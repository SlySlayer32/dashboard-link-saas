import {
  getAdapterConfigRepository,
  getDashboardRepository,
  getOrganizationRepository,
  getWorkerRepository,
} from '@dashboard-link/database'
import type { TenantContext } from '@dashboard-link/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

// Import routes
import { plugins } from './routes/plugins'
import { sms } from './routes/sms'
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

function getRelatedWorker(
  workerRecord:
    | { name?: string | null; phone?: string | null }
    | Array<{ name?: string | null; phone?: string | null }>
    | null
    | undefined
) {
  if (!workerRecord) {
    return null
  }

  return Array.isArray(workerRecord) ? workerRecord[0] ?? null : workerRecord
}

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
    c.req.path === '/dashboard/redeem' ||
    c.req.path.startsWith('/dashboards/')
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
    c.req.path === '/dashboard/redeem' ||
    c.req.path.startsWith('/dashboards/')
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

// GET /dashboards/:token - Public endpoint for worker dashboard (token-based auth)
v1.get('/dashboards/:token', async (c) => {
  const rawToken = c.req.param('token')
  const tokenService = new TokenService()

  try {
    const result = await tokenService.redeemToken(rawToken)

    // Fetch worker schedule and tasks for today
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )

    const today = new Date().toISOString().split('T')[0]

    const [scheduleResult, tasksResult] = await Promise.all([
      supabase
        .from('schedule_items')
        .select('*')
        .eq('worker_id', result.workerId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: true }),
      supabase
        .from('task_items')
        .select('*')
        .eq('worker_id', result.workerId)
        .or(`due_date.eq.${today},due_date.is.null`)
        .order('due_date', { ascending: true })
    ])

    return c.json({
      worker: {
        id: result.workerId,
        name: result.workerName,
      },
      schedule: (scheduleResult.data || []).map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location || '',
        description: s.notes || '',
        metadata: {},
      })),
      tasks: (tasksResult.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        dueDate: t.due_date || undefined,
        status: t.completed ? 'completed' : 'pending',
        priority: t.priority || 'medium',
        metadata: {},
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token'

    if (message.includes('expired')) {
      return c.json({ error: 'Dashboard link has expired', reason: 'expired' }, 401)
    }
    if (message.includes('revoked')) {
      return c.json({ error: 'Dashboard link has been revoked', reason: 'revoked' }, 401)
    }

    return c.json({ error: 'Invalid or expired link', reason: 'invalid' }, 401)
  }
})

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

// Dashboard stats (protected - admin app)
v1.get('/dashboard/stats', async (c) => {
  const organizationId = c.get('organizationId')

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    ).toISOString()

    const [workersResult, activeResult, smsToday, smsWeek, todaysAccessLogs, recentSms, recentAccess] =
      await Promise.all([
      supabase
        .from('workers')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      supabase
        .from('workers')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', todayStart),
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('created_at', weekStart),
      supabase
        .from('access_logs')
        .select('id, worker_id')
        .eq('organization_id', organizationId)
        .eq('validation_status', 'success')
        .gte('accessed_at', todayStart),
      supabase
        .from('sms_logs')
        .select('id, status, created_at, phone_number, worker_id, workers(name, phone)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('access_logs')
        .select('id, validation_status, accessed_at, worker_id, workers(name, phone)')
        .eq('organization_id', organizationId)
        .eq('validation_status', 'success')
        .order('accessed_at', { ascending: false })
        .limit(10),
    ])

    const totalWorkers = workersResult.count || 0
    const activeWorkers = activeResult.count || 0
    const uniqueWorkersOpenedToday = new Set(
      (todaysAccessLogs.data || []).map((log) => log.worker_id).filter(Boolean)
    ).size

    const smsActivity = (recentSms.data || []).map((s) => {
      const worker = getRelatedWorker(s.workers)

      return {
        id: `sms-${s.id}`,
        type: 'sms' as const,
        status: s.status,
        createdAt: s.created_at,
        workerId: s.worker_id,
        workerName: worker?.name || 'Unknown worker',
        workerPhone: worker?.phone || s.phone_number,
        message: 'Dashboard link sent',
      }
    })

    const accessActivity = (recentAccess.data || []).map((entry) => {
      const worker = getRelatedWorker(entry.workers)

      return {
        id: `access-${entry.id}`,
        type: 'dashboard_open' as const,
        status: entry.validation_status,
        createdAt: entry.accessed_at,
        workerId: entry.worker_id,
        workerName: worker?.name || 'Unknown worker',
        workerPhone: worker?.phone || '',
        message: 'Dashboard opened',
      }
    })

    const recentActivity = [...smsActivity, ...accessActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return c.json({
      success: true,
      data: {
        stats: {
          totalWorkers,
          activeWorkers,
          inactiveWorkers: totalWorkers - activeWorkers,
          smsToday: smsToday.count || 0,
          smsThisWeek: smsWeek.count || 0,
          dashboardOpensToday: todaysAccessLogs.data?.length || 0,
          uniqueWorkersOpenedToday,
        },
        recentActivity,
      },
    })
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
})

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

      // Store adapter configuration via repository
      const adapterConfigRepo = getAdapterConfigRepository()
      const adapterConfig = await adapterConfigRepo.create({
        organizationId,
        adapterType: adapterData.adapter_type,
        config: adapterData.config,
        enabled: adapterData.enabled,
      })

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

// Mount plugins routes
v1.route('/plugins', plugins)

// Mount SMS routes
v1.route('/sms', sms)

// Mount tokens route
v1.route('/tokens', tokens)

// Mount workers route
v1.route('/workers', workers)

export default v1
