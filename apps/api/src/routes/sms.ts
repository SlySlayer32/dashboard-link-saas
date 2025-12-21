import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { smsRateLimitMiddleware } from '../middleware/rateLimit';
import { SMSService } from '../services/sms.service';
import { TokenService } from '../services/token.service';
import { createClient } from '@supabase/supabase-js';
import type { 
  SMSDashboardLinkRequest, 
  SMSDashboardLinkResponse, 
  SMSLogsResponse,
  PaginationParams,
  SendSMSRequest
} from '../types/sms';

const sms = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// All routes require authentication and rate limiting
sms.use('*', authMiddleware);
sms.use('*', smsRateLimitMiddleware);

/**
 * Send dashboard link to a worker
 */
sms.post('/send-dashboard-link', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');
  const { workerId, expiresIn, customMessage }: SMSDashboardLinkRequest = await c.req.json();

  try {
    // Validate input
    if (!workerId || !expiresIn) {
      return c.json({ 
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'workerId and expiresIn are required'
        }
      }, 400);
    }

    // Validate expiresIn value
    const validExpiryValues = ['1h', '6h', '12h', '24h'];
    if (!validExpiryValues.includes(expiresIn)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_EXPIRY',
          message: 'expiresIn must be one of: 1h, 6h, 12h, 24h'
        }
      }, 400);
    }

    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized'
        }
      }, 403);
    }

    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single();

    if (workerError || !worker) {
      return c.json({
        success: false,
        error: {
          code: 'WORKER_NOT_FOUND',
          message: 'Worker not found'
        }
      }, 404);
    }

    if (!worker.active) {
      return c.json({
        success: false,
        error: {
          code: 'WORKER_INACTIVE',
          message: 'Worker is inactive'
        }
      }, 400);
    }

    // Convert expiresIn to seconds
    const expiryMap = {
      '1h': 3600,
      '6h': 21600,
      '12h': 43200,
      '24h': 86400
    };
    const expirySeconds = expiryMap[expiresIn];

    // Generate token
    const tokenData = await TokenService.generateToken({
      workerId,
      expirySeconds,
    });

    // Generate dashboard link
    const dashboardUrl = TokenService.generateDashboardLink(tokenData.token);

    // Prepare message
    const message = customMessage || 
      `Hi ${worker.name}! Your daily dashboard is ready: ${dashboardUrl}`;

    // Send SMS
    const smsResult = await SMSService.sendSMS({
      phone: worker.phone,
      message,
      organizationId: admin.organization_id,
      workerId,
    });

    // Get SMS log ID for response
    const { data: smsLog } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', admin.organization_id)
      .eq('worker_id', workerId)
      .eq('phone', worker.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const response: SMSDashboardLinkResponse = {
      success: true,
      data: {
        smsId: smsLog?.id || '',
        token: tokenData.token,
        dashboardUrl,
        status: smsResult.success ? 'sent' : 'failed',
        expiresAt: tokenData.expires_at,
      }
    };

    if (!smsResult.success) {
      response.data.status = 'failed';
      return c.json(response, 500);
    }

    return c.json(response);
  } catch (error) {
    console.error('Send dashboard link error:', error);
    return c.json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send dashboard link'
      }
    }, 500);
  }
});

/**
 * Get SMS logs for the organization
 */
sms.get('/logs', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');
  const { page = '1', limit = '20', workerId }: Record<string, string> = c.req.query();

  try {
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized'
        }
      }, 403);
    }

    // Build query
    let query = supabase
      .from('sms_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', admin.organization_id)
      .order('created_at', { ascending: false });

    // Add worker filter if provided
    if (workerId) {
      query = query.eq('worker_id', workerId);
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    const response: SMSLogsResponse = {
      success: true,
      data: logs || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };

    return c.json(response);
  } catch (error) {
    console.error('Get SMS logs error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve SMS logs'
      }
    }, 500);
  }
});

/**
 * Send custom SMS to a worker
 */
sms.post('/send', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');
  const { workerId, message }: SendSMSRequest = await c.req.json();

  try {
    // Validate input
    if (!workerId || !message) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'workerId and message are required'
        }
      }, 400);
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized'
        }
      }, 403);
    }

    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single();

    if (!worker) {
      return c.json({
        success: false,
        error: {
          code: 'WORKER_NOT_FOUND',
          message: 'Worker not found'
        }
      }, 404);
    }

    const result = await SMSService.sendSMS({
      phone: worker.phone,
      message,
      organizationId: admin.organization_id,
      workerId,
    });

    // Get SMS log ID for response
    const { data: smsLog } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', admin.organization_id)
      .eq('worker_id', workerId)
      .eq('phone', worker.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'SMS_FAILED',
          message: result.error || 'Failed to send SMS'
        }
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        smsId: smsLog?.id || '',
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed'
      }
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send SMS'
      }
    }, 500);
  }
});

export default sms;
