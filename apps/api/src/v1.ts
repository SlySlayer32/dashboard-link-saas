import { getOrganizationRepository, getWorkerRepository } from '@dashboard-link/database'
import { TenantContext, tenantMiddleware } from '@dashboard-link/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

// Import services
import { SMSService } from './services/sms-service'
import { TokenService } from './services/token-service'
import { WebhookService } from './services/webhook-service'

// Create v1 API with tenant isolation
const v1 = new Hono<{
  Variables: TenantContext & {
    tenant: TenantContext
    requestId: string
    tenantId: string
    userId: string
    userRole: string
  }
}>()

// Apply tenant middleware to all v1 routes except auth and webhooks
v1.use('*', async (c, next) => {
  // Skip tenant middleware for auth and webhook endpoints
  if (c.req.path.startsWith('/auth/') || c.req.path.startsWith('/webhooks/')) {
    await next()
    return
  }
  await tenantMiddleware(c, next)
})

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
      token: z.string().min(1, 'Token is required'),
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
  const tenant = c.get('tenant')

  return c.json({
    success: true,
    data: {
      user: {
        id: tenant.userId,
        orgId: tenant.orgId,
        role: tenant.role,
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
  const tenant = c.get('tenant')
  const orgRepo = getOrganizationRepository()

  try {
    const org = await orgRepo.findById(tenant.orgId)

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

// Workers CRUD with validation
v1.get(
  '/workers',
  zValidator(
    'query',
    z.object({
      limit: z.coerce.number().min(1).max(100).optional().default(50),
      offset: z.coerce.number().min(0).optional().default(0),
      status: z.enum(['active', 'inactive', 'suspended']).optional(),
    })
  ),
  async (c) => {
    const tenant = c.get('tenant')
    const query = c.req.valid('query')
    const workerRepo = getWorkerRepository()

    try {
      const options = {
        where: {
          organizationId: tenant.orgId,
          ...(query.status && { active: query.status === 'active' }),
        },
        limit: query.limit,
        offset: query.offset,
      }

      // Get paginated results
      const page = Math.floor(query.offset / query.limit) + 1
      const result = await workerRepo.findWithPagination(options, page, query.limit)

      return c.json({
        success: true,
        data: result.data,
        meta: {
          pagination: {
            limit: query.limit,
            offset: query.offset,
            total: result.total,
            hasMore: query.offset + result.data.length < result.total,
          },
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
  }
)

// Create worker
v1.post(
  '/workers',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required'),
      phone_e164: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
      status: z.enum(['active', 'inactive', 'suspended']).optional().default('active'),
    })
  ),
  async (c) => {
    const tenant = c.get('tenant')
    const workerData = c.req.valid('json')
    const workerRepo = getWorkerRepository()

    try {
      const newWorker = await workerRepo.create({
        organizationId: tenant.orgId,
        name: workerData.name,
        phone: workerData.phone_e164,
        active: workerData.status === 'active',
      })

      return c.json(
        {
          success: true,
          data: newWorker,
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

// Create dashboard
v1.post(
  '/dashboards',
  zValidator(
    'json',
    z.object({
      worker_id: z.string().uuid('Invalid worker ID'),
      name: z.string().min(1, 'Dashboard name is required'),
      config: z
        .object({
          widgets: z
            .array(
              z.object({
                type: z.string(),
                source: z.string(),
                config: z.record(z.any()).optional(),
              })
            )
            .optional(),
        })
        .optional(),
    })
  ),
  async (c) => {
    const tenant = c.get('tenant')
    const dashboardData = c.req.valid('json')

    try {
      // Verify worker belongs to tenant
      const workerRepo = getWorkerRepository()
      const worker = await workerRepo.findById(dashboardData.worker_id)

      if (!worker || worker.organizationId !== tenant.orgId) {
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

      // Create dashboard configuration
      const dashboard = {
        id: crypto.randomUUID(),
        worker_id: dashboardData.worker_id,
        organization_id: tenant.orgId,
        name: dashboardData.name,
        config: dashboardData.config || { widgets: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Save dashboard to database
      await c.env.DB.prepare(
        `
            INSERT INTO dashboards (id, worker_id, organization_id, name, config, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
        .bind(
          dashboard.id,
          dashboard.worker_id,
          dashboard.organization_id,
          dashboard.name,
          JSON.stringify(dashboard.config),
          dashboard.created_at,
          dashboard.updated_at
        )
        .run()

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
    const tenant = c.get('tenant')
    const dashboardId = c.req.param('id')
    const { message, expires_in_hours } = c.req.valid('json')

    try {
      // Get dashboard with worker info
      const { results } = await c.env.DB.prepare(
        `
            SELECT d.*, w.name as worker_name, w.phone as worker_phone
            FROM dashboards d
            JOIN workers w ON d.worker_id = w.id
            WHERE d.id = ? AND d.organization_id = ?
        `
      )
        .bind(dashboardId, tenant.orgId)
        .all()

      if (results.length === 0) {
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

      const dashboard = results[0] as {
        worker_id: string
        worker_name: string
        worker_phone: string
        org_id: string
      }

      // Create secure token
      const tokenService = new TokenService()
      const token = await tokenService.createToken({
        workerId: dashboard.worker_id,
        orgId: tenant.orgId,
        dashboardId: dashboardId,
        expiresInHours: expires_in_hours,
      })

      // Enqueue SMS job
      const smsService = new SMSService()
      const smsJob = await smsService.enqueueSMS({
        to: dashboard.worker_phone,
        message:
          message ||
          `Your dashboard is ready: ${process.env.APP_URL || 'http://localhost:5173'}/dashboard/${token}`,
        orgId: tenant.orgId,
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
v1.post(
  '/adapters/configs',
  zValidator(
    'json',
    z.object({
      adapter_type: z.string().min(1, 'Adapter type is required'),
      config: z.record(z.any()),
      enabled: z.boolean().optional().default(true),
    })
  ),
  async (c) => {
    const tenant = c.get('tenant')
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
      const config = {
        id: crypto.randomUUID(),
        organization_id: tenant.orgId,
        adapter_type: adapterData.adapter_type,
        config: adapterData.config,
        enabled: adapterData.enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await c.env.DB.prepare(
        `
            INSERT INTO adapter_configs (id, organization_id, adapter_type, config, enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
        .bind(
          config.id,
          config.organization_id,
          config.adapter_type,
          JSON.stringify(config.config),
          config.enabled,
          config.created_at,
          config.updated_at
        )
        .run()

      return c.json(
        {
          success: true,
          data: config,
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

export default v1
