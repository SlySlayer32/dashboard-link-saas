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

import { SMSService } from '../services/SMSService.js'
import { SMSTemplateService } from '../services/sms-template-service.js'
import type { AppContextVariables } from '../types'

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

const sendSmsSchema = z
  .object({
    workerId: z.string().uuid('Invalid worker ID').optional(),
    to: z.string().trim().min(1, 'Phone number is required').optional(),
    message: z.string().min(1, 'Message is required').max(320),
  })
  .refine((value) => Boolean(value.workerId || value.to), {
    message: 'Either workerId or to is required',
    path: ['to'],
  })

const smsTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required').max(80),
  body: z.string().trim().min(1, 'Template body is required').max(1600),
  category: z.literal('dashboard_link'),
  isDefault: z.boolean().optional(),
})

const updateSmsTemplateSchema = smsTemplateSchema
  .omit({ category: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

const smsTemplatePreviewSchema = z.object({
  workerId: z.string().uuid('Invalid worker ID'),
  expiryHours: z.number().min(1).max(24).default(24),
  templateId: z.string().uuid('Invalid template ID').optional(),
  body: z.string().max(1600).optional(),
})

const sms = new Hono<{
  Variables: AppContextVariables & {
    tenantId: string
    organizationId: string
  }
}>()

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

sms.post('/send', zValidator('json', sendSmsSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const userId = c.get('userId')
  const { workerId, to, message } = c.req.valid('json')
  const supabase = getSupabaseAdmin()

  let resolvedPhone = to?.trim()

  if (workerId) {
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, phone')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      return c.json({ success: false, error: 'Worker not found or access denied' }, 404)
    }

    resolvedPhone = worker.phone
  }

  if (!resolvedPhone) {
    return c.json({ success: false, error: 'Phone number is required' }, 400)
  }

  try {
    const smsService = new SMSService()
    const result = await smsService.enqueueSMS({
      to: resolvedPhone,
      message,
      orgId: organizationId,
      type: 'manual',
      workerId,
      sentBy: userId,
    })

    return c.json({ success: true, data: result }, 201)
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send SMS' },
      500
    )
  }
})

sms.get('/templates', async (c) => {
  const organizationId = c.get('organizationId')

  try {
    const templateService = new SMSTemplateService()
    const templates = await templateService.listTemplates(organizationId)

    return c.json({ success: true, data: templates })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load templates',
      },
      500
    )
  }
})

sms.post('/templates', zValidator('json', smsTemplateSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const input = c.req.valid('json')

  try {
    const templateService = new SMSTemplateService()
    const template = await templateService.createTemplate(organizationId, input)

    return c.json({ success: true, data: template }, 201)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template',
      },
      500
    )
  }
})

sms.post('/templates/preview', zValidator('json', smsTemplatePreviewSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const input = c.req.valid('json')

  try {
    const templateService = new SMSTemplateService()
    const preview = await templateService.previewTemplate(
      organizationId,
      input.workerId,
      input.expiryHours,
      input.templateId,
      input.body
    )

    return c.json({ success: true, data: preview })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to preview template',
      },
      500
    )
  }
})

sms.put('/templates/:id', zValidator('json', updateSmsTemplateSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const templateId = c.req.param('id')
  const input = c.req.valid('json')

  try {
    const templateService = new SMSTemplateService()
    const template = await templateService.updateTemplate(organizationId, templateId, input)

    return c.json({ success: true, data: template })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update template'
    return c.json({ success: false, error: message }, message.includes('not found') ? 404 : 500)
  }
})

sms.delete('/templates/:id', async (c) => {
  const organizationId = c.get('organizationId')
  const templateId = c.req.param('id')

  try {
    const templateService = new SMSTemplateService()
    await templateService.deleteTemplate(organizationId, templateId)

    return c.json({ success: true })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      },
      500
    )
  }
})

sms.post('/templates/:id/set-default', async (c) => {
  const organizationId = c.get('organizationId')
  const templateId = c.req.param('id')

  try {
    const templateService = new SMSTemplateService()
    const template = await templateService.setDefaultTemplate(organizationId, templateId)

    return c.json({ success: true, data: template })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set default template'
    return c.json({ success: false, error: message }, message.includes('not found') ? 404 : 500)
  }
})

sms.post(
  '/send-dashboard-link',
  zValidator(
    'json',
    z.object({
      workerId: z.string().uuid('Invalid worker ID'),
      expiryHours: z.number().min(1).max(24).optional().default(24),
      message: z.string().optional(),
      templateId: z.string().uuid('Invalid template ID').optional(),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const userId = c.get('userId')
    const { workerId, expiryHours, message, templateId } = c.req.valid('json')

    const supabase = getSupabaseAdmin()

    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, phone')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      return c.json({ success: false, error: 'Worker not found or access denied' }, 404)
    }

    try {
      const { TokenService } = await import('../services/TokenService')
      const tokenService = new TokenService()
      const token = await tokenService.createToken({
        workerId,
        orgId: organizationId,
        dashboardId: workerId,
        expiresInHours: expiryHours,
      })

      const appUrl = process.env.WORKER_APP_URL || process.env.APP_URL || 'http://localhost:5174'
      const dashboardUrl = `${appUrl}/dashboard/${token.rawToken}`
      const templateService = new SMSTemplateService()
      const renderedMessage = await templateService.resolveDashboardLinkMessage({
        organizationId,
        workerId,
        expiryHours,
        dashboardLink: dashboardUrl,
        templateId,
        customMessage: message,
      })

      const smsService = new SMSService()
      const smsResult = await smsService.enqueueSMS({
        to: worker.phone,
        message: renderedMessage.body,
        orgId: organizationId,
        type: 'dashboard_link',
        workerId,
        tokenId: token.tokenId,
        sentBy: userId,
      })

      return c.json(
        {
          success: true,
          data: {
            smsId: smsResult.id,
            token: token.rawToken,
            dashboardUrl,
            expiresAt: token.expiresAt,
            renderedMessage: renderedMessage.body,
            templateId: renderedMessage.templateId,
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
