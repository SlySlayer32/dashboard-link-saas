// Temporarily commented out to get API running
// TODO: Fix tokens package module resolution
// import { createTokenManager } from '@dashboard-link/tokens'
import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { smsRateLimitMiddleware } from '../middleware/rateLimit'
// TODO(sms-integration): Replace legacy SMSService with new SMS system from packages/sms
// TODO(sms-integration): Import and use SMSService from @dashboard-link/sms package
// import { SMSService } from '../services/sms.service'

// TODO(sms-integration): Import new SMS service from packages/sms
// import { smsService } from '@dashboard-link/sms'
import type { AppContext } from '../types'
import type {
  SMSDashboardLinkRequest,
  SMSDashboardLinkResponse,
  SMSLogsResponse,
  SendSMSRequest,
} from '../types/sms'
import { logger } from '../utils/logger.js'

// Initialize token manager with environment configuration
// TODO: Fix tokens package module resolution
// const tokenManager = createTokenManager({
//   provider: 'database',
//   tableName: 'worker_tokens',
//   hashTokens: true,
//   cleanupExpired: true,
//   defaultExpiry: 86400, // 1 day for worker tokens
//   refreshExpiry: 2592000, // 30 days
// })

// TODO(tokens): @dashboard-link/tokens DatabaseTokenProvider expects a different table shape than
// `worker_tokens` in the initial migration (token_hash/payload/etc vs token TEXT). Align schema or
// point this token manager at the correct table.

const sms = new Hono<AppContext>()

// TODO(sms-config): Add environment-based SMS provider configuration
// TODO(sms-config): Load MobileMessage credentials from environment variables
// TODO(sms-config): Set up provider registration based on ADR-003 decision
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// TODO(sms-provider): Register MobileMessage provider as default for Australian numbers
// TODO(sms-provider): Configure provider fallback order: MobileMessage -> Twilio -> AWS SNS
// TODO(sms-provider): Add provider health checking and automatic failover

// TODO(sms-logs): sms_logs schema in migrations is missing fields the service layer writes (e.g.
// `provider`). Keep migrations and inserts in sync so logging doesn't silently fail.
// TODO(sms-logs): Add migration to update sms_logs table with missing fields (provider, error_type, etc.)
// TODO(sms-logs): Ensure service layer and database schema are aligned for all SMS-related tables

// All routes require authentication, tenant context, and rate limiting
sms.use('*', authMiddleware)
sms.use('*', tenantContextMiddleware)
sms.use('*', smsRateLimitMiddleware)

/**
 * Send dashboard link to a worker
 */
sms.post('/send-dashboard-link', async (c) => {
  const userId = c.get('userId')
  const { workerId, expiresIn, customMessage }: SMSDashboardLinkRequest = await c.req.json()

  if (!userId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        },
      },
      401
    )
  }

  try {
    // Validate input
    if (!workerId || !expiresIn) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'workerId and expiresIn are required',
          },
        },
        400
      )
    }

    // Validate expiresIn value
    const validExpiryValues = ['1h', '6h', '12h', '24h']
    if (!validExpiryValues.includes(expiresIn)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_EXPIRY',
            message: 'expiresIn must be one of: 1h, 6h, 12h, 24h',
          },
        },
        400
      )
    }

    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single()

    if (adminError || !admin) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authorized',
          },
        },
        403
      )
    }

    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single()

    if (workerError || !worker) {
      return c.json(
        {
          success: false,
          error: {
            code: 'WORKER_NOT_FOUND',
            message: 'Worker not found',
          },
        },
        404
      )
    }

    // TODO(tokens): Replace temporary token generation with proper token system integration
    // TODO(tokens): Use tokenManager.generateWorkerToken() once tokens package is fixed
    // TODO(tokens): Ensure token expiry matches user selection (1h, 6h, 12h, 24h)
    // Generate token - TODO: Implement proper token generation
    // const tokenData = await tokenManager.generateWorkerToken(workerId, admin.organization_id, {
    //   permissions: ['worker:access', 'sms:receive'],
    //   metadata: {
    //     expiresIn,
    //     generatedFor: 'sms_dashboard_link',
    //   },
    // })

    // Temporary placeholder token
    const tokenData = {
      token: `temp-token-${Date.now()}`,
      dashboardUrl: `http://localhost:5174/dashboard?token=temp-token-${Date.now()}`,
      expiresAt: new Date(Date.now() + (expiresIn || 86400) * 1000).toISOString(),
    }

    // Generate dashboard link
    const dashboardUrl = tokenData.dashboardUrl

    // Prepare message
    const message =
      customMessage || `Hi ${worker.name}! Your daily dashboard is ready: ${dashboardUrl}`

    // TODO(sms-integration): Replace legacy SMSService.sendSMS with new SMS system
    // TODO(sms-integration): Use smsService.sendMessage() from packages/sms
    // TODO(sms-integration): Add proper message formatting and validation
    // Send SMS using new service
    const smsResult = await smsService.sendMessage({
      to: worker.phone_number,
      content: message,
      // Add organization context for multi-tenant support
      metadata: {
        organizationId: admin.organization_id,
        workerId,
        sentBy: userId,
        messageType: 'dashboard_link',
        tokenId: tokenData.token,
      },
    })

    // Get SMS log ID for response
    const { data: smsLog } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', admin.organization_id)
      .eq('worker_id', workerId)
      .eq('phone_number', worker.phone_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const response: SMSDashboardLinkResponse = {
      success: true,
      data: {
        smsId: smsLog?.id || '',
        token: tokenData.token,
        dashboardUrl,
        status: smsResult.success ? 'sent' : 'failed',
        expiresAt: tokenData.expiresAt,
      },
    }

    if (!smsResult.success) {
      response.data.status = 'failed'
      return c.json(response, 500)
    }

    return c.json(response)
  } catch (error) {
    logger.error(
      'Send dashboard link error',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send dashboard link',
        },
      },
      500
    )
  }
})

/**
 * Get SMS logs for the organization
 */
sms.get('/logs', async (c) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        },
      },
      401
    )
  }

  const {
    page = '1',
    limit = '20',
    workerId,
    status,
    dateFrom,
    dateTo,
    search,
  }: Record<string, string> = c.req.query()

  try {
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))) // Max 100 per page
    const offset = (pageNum - 1) * limitNum

    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single()

    if (adminError || !admin) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authorized',
          },
        },
        403
      )
    }

    // Build query
    let query = supabase
      .from('sms_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', admin.organization_id)
      .order('created_at', { ascending: false })

    // Add worker filter if provided
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Add date range filters if provided
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Add search filter if provided (search in message and worker phone)
    if (search) {
      query = query.or(`message_content.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1)

    const { data: logs, error, count } = await query

    if (error) {
      throw error
    }

    // Calculate pagination info
    const total = count || 0
    const totalPages = Math.ceil(total / limitNum)

    const response: SMSLogsResponse = {
      success: true,
      data: logs || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    }

    return c.json(response)
  } catch (error) {
    logger.error('Get SMS logs error', error instanceof Error ? error : new Error(String(error)))
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve SMS logs',
        },
      },
      500
    )
  }
})

/**
 * Send custom SMS to a worker
 */
sms.post('/send', async (c) => {
  const userId = c.get('userId')
  const { workerId, message }: SendSMSRequest = await c.req.json()

  if (!userId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        },
      },
      401
    )
  }

  try {
    // Validate input
    if (!workerId || !message) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'workerId and message are required',
          },
        },
        400
      )
    }

    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single()

    if (adminError || !admin) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authorized',
          },
        },
        403
      )
    }

    const { data: worker } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('organization_id', admin.organization_id)
      .single()

    if (!worker) {
      return c.json(
        {
          success: false,
          error: {
            code: 'WORKER_NOT_FOUND',
            message: 'Worker not found',
          },
        },
        404
      )
    }

    const result = await smsService.sendMessage({
      to: worker.phone_number,
      content: message,
      metadata: {
        organizationId: admin.organization_id,
        workerId,
        sentBy: userId,
        messageType: 'custom',
      },
    })

    // Get SMS log ID for response
    const { data: smsLog } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('organization_id', admin.organization_id)
      .eq('worker_id', workerId)
      .eq('phone_number', worker.phone_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: 'SMS_FAILED',
            message: result.error || 'Failed to send SMS',
          },
        },
        500
      )
    }

    return c.json({
      success: true,
      data: {
        smsId: smsLog?.id || '',
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
      },
    })
  } catch (error) {
    logger.error('Send SMS error', error instanceof Error ? error : new Error(String(error)))
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send SMS',
        },
      },
      500
    )
  }
})

export default sms
