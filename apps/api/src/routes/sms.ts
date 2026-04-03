/**
 * SMS API Routes
 *
 * Endpoints for SMS logs and sending SMS messages.
 * All routes are tenant-scoped via auth + tenant middleware.
 */

import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { z } from 'zod'

import { SMSService } from '../services/SMSService'
import type { AppContextVariables } from '../types'

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

const sms = new Hono<{
  Variables: AppContextVariables & {
    tenantId: string
    organizationId: string
  }
}>()

// GET /sms/logs - List SMS logs with pagination and filters
sms.get('/logs', async (c) => {
  const organizationId = c.get('organizationId')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)
  const workerId = c.req.query('workerId')
  const status = c.req.query('status')
  const dateFrom = c.req.query('dateFrom')
  const dateTo = c.req.query('dateTo')
  const search = c.req.query('search')

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('sms_logs')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (workerId) query = query.eq('worker_id', workerId)
  if (status) query = query.eq('status', status)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)
  if (search) query = query.ilike('phone_number', `%${search}%`)

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) {
    return c.json({ success: false, error: error.message }, 500)
  }

  return c.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
})

// POST /sms/send - Send an SMS message
sms.post(
  '/send',
  zValidator(
    'json',
    z.object({
      to: z.string().min(1, 'Phone number is required'),
      message: z.string().min(1, 'Message is required').max(320),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const { to, message } = c.req.valid('json')

    try {
      const smsService = new SMSService()
      const result = await smsService.enqueueSMS({
        to,
        message,
        orgId: organizationId,
        type: 'manual',
      })

      return c.json({ success: true, data: result }, 201)
    } catch (error) {
      return c.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to send SMS' },
        500
      )
    }
  }
)

// POST /sms/send-dashboard-link - Send a dashboard link to a worker
sms.post(
  '/send-dashboard-link',
  zValidator(
    'json',
    z.object({
      workerId: z.string().uuid('Invalid worker ID'),
      expiryHours: z.number().min(1).max(24).optional().default(24),
      message: z.string().optional(),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const { workerId, expiryHours, message } = c.req.valid('json')

    const supabase = getSupabaseAdmin()

    // Fetch worker
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, full_name, phone')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      return c.json({ success: false, error: 'Worker not found or access denied' }, 404)
    }

    try {
      const { TokenService } = await import('../services/TokenService')
      const tokenService = new TokenService()
      const rawToken = await tokenService.createToken({
        workerId,
        orgId: organizationId,
        dashboardId: workerId, // Use worker ID as dashboard reference
        expiresInHours: expiryHours,
      })

      const appUrl = process.env.WORKER_APP_URL || process.env.APP_URL || 'http://localhost:5174'
      const dashboardUrl = `${appUrl}/dashboard/${rawToken}`
      const smsBody = message || `Hi ${worker.full_name}, your dashboard is ready: ${dashboardUrl}`

      const smsService = new SMSService()
      const smsResult = await smsService.enqueueSMS({
        to: worker.phone,
        message: smsBody,
        orgId: organizationId,
        type: 'dashboard_link',
      })

      return c.json(
        {
          success: true,
          data: {
            smsId: smsResult.id,
            token: rawToken,
            dashboardUrl,
            expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
          },
        },
        201
      )
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send dashboard link',
        },
        500
      )
    }
  }
)

export { sms }
