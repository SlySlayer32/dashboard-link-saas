import {
  getDashboardRepository,
  getOrganizationRepository,
  getWorkerRepository,
} from '@dashboard-link/database'
import type { TenantContext } from '@dashboard-link/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

// Import routes
import tokens from './routes/tokens'
import { workers } from './routes/workers'

// Import canonical middleware
import { authMiddleware } from './middleware/auth'
import { cacheMiddleware, createCacheConfig } from './middleware/cache'
import { tenantContextMiddleware } from './middleware/tenant'

// Import services
import { SMSService } from './services/SMSService'
import { TokenService } from './services/TokenService'
import { WebhookService } from './services/webhook-service'

import type { AppContextVariables } from './types'

// Create v1 API with tenant isolation
const v1 = new Hono<{
  Variables: AppContextVariables & {
    tenant: TenantContext
    requestId: string
    tenantId: string
  }
}>()

// Apply auth + tenant middleware to all v1 routes except auth and webhooks
v1.use('*', async (c, next) => {
  // Skip auth middleware for public endpoints
  if (
    c.req.path.startsWith('/auth/') ||
    c.req.path.startsWith('/webhooks/') ||
    c.req.path === '/dashboard/redeem'
  ) {
    await next()
    return
  }
  await authMiddleware(c, next)
})

v1.use('*', async (c, next) => {
  // Skip tenant context for public endpoints
  if (
    c.req.path.startsWith('/auth/') ||
    c.req.path.startsWith('/webhooks/') ||
    c.req.path === '/dashboard/redeem'
  ) {
    await next()
    return
  }
  await tenantContextMiddleware(c, next)
})

// Apply cache middleware AFTER auth+tenant (R07: correct middleware order)
v1.use('/workers', cacheMiddleware(createCacheConfig('workers')))
v1.use('/dashboard', cacheMiddleware(createCacheConfig('dashboard')))
v1.use('/dashboards/*', cacheMiddleware(createCacheConfig('dashboard')))

// Auth endpoints (public - no tenant middleware needed)
v1.post('/auth/login', async (c) => {
  // Placeholder for login logic
  return c.json({
    success: true,
    data: { message: 'Login endpoint - to be implemented' },
  })
})

// Worker dashboard redemption endpoint (public - uses token auth)
v1.post(
  '/dashboard/redeem',
  zValidator(
    'json',
    z.object({
      token: z.string().min(1, { message: 'Token is required' }),
    })
  ),
  async (c) => {
    const { token } = c.req.valid('json')
    const tokenService = new TokenService()

    try {
      // Verify token and get dashboard data
      const dashboardData = await tokenService.redeemToken(token)

      return c.json({
        success: true,
        data: dashboardData,
        meta: {
          requestId: crypto.randomUUID(),
          version: '2024-01-01',
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        return c.json(
          {
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Dashboard link has expired',
            },
          },
          410
        )
      }

      if (error instanceof Error && error.message.includes('not implemented')) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_IMPLEMENTED',
              message: 'Token service not yet available',
            },
          },
          501
        )
      }

      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        },
        401
      )
    }
  }
)

// Webhook endpoints (public - signature-based auth)
v1.post('/webhooks/:provider', async (c) => {
  const provider = c.req.param('provider')
  const webhookService = new WebhookService()

  try {
    // Verify webhook signature
    const signature = c.req.header('X-Signature') || c.req.header('X-Hub-Signature-256')
    if (!signature) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'Webhook signature required',
          },
        },
        401
      )
    }

    // Get raw body for signature verification
    const body = await c.req.text()
    const isValid = await webhookService.verifySignature(provider, body, signature)

    if (!isValid) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid webhook signature',
          },
        },
        401
      )
    }

    // Process webhook with idempotency
    const idempotencyKey = c.req.header('X-Idempotency-Key') || crypto.randomUUID()
    const result = await webhookService.processWebhook(provider, body, idempotencyKey)

    return c.json({
      success: true,
      data: result,
      meta: {
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// Protected endpoints
v1.get('/me', async (c) => {
  const userId = c.get('userId')
  const organizationId = c.get('organizationId')
  const userRole = c.get('userRole')

  return c.json({
    success: true,
    data: {
      user: {
        id: userId,
        orgId: organizationId,
        role: userRole,
      },
      timestamp: new Date().toISOString(),
    },
    meta: {
      requestId: crypto.randomUUID(),
      version: '2024-01-01',
    },
  })
})

// Organizations CRUD
v1.get('/organizations', async (c) => {
  const organizationId = c.get('organizationId')
  if (!organizationId) {
    return c.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing organization context' } },
      401
    )
  }
  const orgRepo = getOrganizationRepository()

  try {
    const org = await orgRepo.findById(organizationId)

    return c.json({
      success: true,
      data: org ? [org] : [],
      meta: {
        requestId: crypto.randomUUID(),
        version: '2024-01-01',
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

// Workers CRUD with validation - REMOVED - now using mounted route from ./routes/workers.ts

// Create dashboard
v1.post(
  '/dashboards',
  zValidator(
    'json',
    z.object({
      worker_id: z.string().uuid('Invalid worker ID'),
      name: z.string().min(1, { message: 'Dashboard name is required' }),
      config: z
        .object({
          widgets: z
            .array(
              z.object({
                type: z.string(),
                source: z.string(),
                config: z.record(z.string(), z.unknown()).optional(),
              })
            )
            .optional(),
        })
        .optional(),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const dashboardData = c.req.valid('json')

    try {
      // Verify worker belongs to tenant
      const workerRepo = getWorkerRepository()
      const worker = await workerRepo.findById(dashboardData.worker_id)

      if (!worker?.organizationId || worker.organizationId !== organizationId) {
        return c.json(
          {
            success: false,
            error: {
              code: 'WORKER_NOT_FOUND',
              message: 'Worker not found or access denied',
            },
          },
          404
        )
      }

      // Create dashboard configuration using repository
      const dashboardRepo = getDashboardRepository()
      const dashboard = await dashboardRepo.create({
        workerId: dashboardData.worker_id,
        organizationId: organizationId,
        name: dashboardData.name,
        config: dashboardData.config || { widgets: [] },
      } as Parameters<typeof dashboardRepo.create>[0])

      return c.json(
        {
          success: true,
          data: dashboard,
          meta: {
            requestId: crypto.randomUUID(),
            version: '2024-01-01',
          },
        },
        201
      )
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

// Send dashboard link via SMS
v1.post(
  '/dashboards/:id/send-link',
  zValidator(
    'json',
    z.object({
      message: z.string().optional(),
      expires_in_hours: z.number().min(1).max(24).optional().default(24),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const dashboardId = c.req.param('id')
    const { message, expires_in_hours } = c.req.valid('json')

    try {
      // Get dashboard via repository
      const dashboardRepo = getDashboardRepository()
      const dashboard = await dashboardRepo.findById(dashboardId)

      if (!dashboard || dashboard.organizationId !== organizationId) {
        return c.json(
          {
            success: false,
            error: {
              code: 'DASHBOARD_NOT_FOUND',
              message: 'Dashboard not found or access denied',
            },
          },
          404
        )
      }

      // Get worker info via repository
      const workerRepo = getWorkerRepository()
      const worker = await workerRepo.findById(dashboard.workerId)

      if (!worker) {
        return c.json(
          {
            success: false,
            error: {
              code: 'WORKER_NOT_FOUND',
              message: 'Associated worker not found',
            },
          },
          404
        )
      }

      // Create secure token
      const tokenService = new TokenService()
      const token = await tokenService.createToken({
        workerId: dashboard.workerId,
        orgId: organizationId,
        dashboardId: dashboardId,
        expiresInHours: expires_in_hours,
      })

      // Enqueue SMS job
      const smsService = new SMSService()
      const smsJob = await smsService.enqueueSMS({
        to: worker.phone,
        message:
          message ||
          `Your dashboard is ready: ${process.env.APP_URL || 'http://localhost:5173'}/dashboard/${token}`,
        orgId: organizationId,
        type: 'dashboard_link',
      })

      return c.json(
        {
          success: true,
          data: {
            jobId: smsJob.id,
            token: token,
            expiresAt: new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString(),
          },
          meta: {
            requestId: crypto.randomUUID(),
            version: '2024-01-01',
          },
        },
        201
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('not implemented')) {
        return c.json(
          {
            success: false,
            error: {
              code: 'NOT_IMPLEMENTED',
              message: 'Service not yet available',
            },
          },
          501
        )
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

// Configure adapter
// TODO: Create AdapterConfigRepository for full repository pattern (R05 tracked)
v1.post(
  '/adapters/configs',
  zValidator(
    'json',
    z.object({
      adapter_type: z.string().min(1, { message: 'Adapter type is required' }),
      config: z.record(z.string(), z.unknown()),
      enabled: z.boolean().optional().default(true),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const adapterData = c.req.valid('json')

    try {
      // Validate adapter type
      const validAdapters = ['google_calendar', 'airtable', 'notion', 'manual']
      if (!validAdapters.includes(adapterData.adapter_type)) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_ADAPTER',
              message: `Invalid adapter type. Must be one of: ${validAdapters.join(', ')}`,
            },
          },
          400
        )
      }

      // Store adapter configuration
      // TODO: Move to AdapterConfigRepository when created
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || ''
      )

      const adapterConfig = {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        adapter_type: adapterData.adapter_type,
        config: adapterData.config,
        enabled: adapterData.enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabaseAdmin.from('adapter_configs').insert(adapterConfig)

      if (error) {
        throw error
      }

      return c.json(
        {
          success: true,
          data: adapterConfig,
          meta: {
            requestId: crypto.randomUUID(),
            version: '2024-01-01',
          },
        },
        201
      )
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

// Mount tokens route
v1.route('/tokens', tokens)

// Mount workers route
v1.route('/workers', workers)

export default v1
