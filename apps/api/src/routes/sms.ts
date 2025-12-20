import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { smsRateLimitMiddleware } from '../middleware/rateLimit';
import { SMSService } from '../services/sms.service';
import { TokenService } from '../services/token.service';
import { createClient } from '@supabase/supabase-js';

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
  const userId = c.get('userId');
  const { workerId, expirySeconds } = await c.req.json();

  try {
    // Get user's organization
    const { data: admin } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (!admin) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single();

    if (workerError || !worker) {
      return c.json({ error: 'Worker not found' }, 404);
    }

    if (!worker.active) {
      return c.json({ error: 'Worker is inactive' }, 400);
    }

    // Generate token
    const tokenData = await TokenService.generateToken({
      workerId,
      expirySeconds,
    });

    // Generate dashboard link
    const dashboardUrl = TokenService.generateDashboardLink(tokenData.token);

    // Send SMS
    const smsResult = await SMSService.sendDashboardLink(
      worker.phone,
      dashboardUrl,
      worker.name,
      admin.organization_id,
      workerId
    );

    if (!smsResult.success) {
      return c.json({ error: smsResult.error || 'Failed to send SMS' }, 500);
    }

    return c.json({
      success: true,
      token: tokenData.token,
      dashboardUrl,
      expiresAt: tokenData.expires_at,
      messageId: smsResult.messageId,
    });
  } catch (error) {
    console.error('Send dashboard link error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to send dashboard link' 
    }, 500);
  }
});

/**
 * Send custom SMS to a worker
 */
sms.post('/send', async (c) => {
  const userId = c.get('userId');
  const { workerId, message } = await c.req.json();

  try {
    const { data: admin } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (!admin) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single();

    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404);
    }

    const result = await SMSService.sendSMS({
      phone: worker.phone,
      message,
      organizationId: admin.organization_id,
      workerId,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    }, 500);
  }
});

export default sms;
