import type {
  SMSTemplate,
  SMSTemplateCreateRequest,
  SMSTemplatePreviewResponse,
  SMSTemplateUpdateRequest,
} from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'

type WorkerRecord = {
  id: string
  name: string
  phone: string
}

type TemplateRow = {
  id: string
  organization_id: string
  name: string
  body: string
  category: 'dashboard_link'
  is_default: boolean
  created_at: string
  updated_at: string
}

const DASHBOARD_LINK_FALLBACK = 'Hi {{worker_name}}, your dashboard is ready: {{dashboard_link}}'

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

function getPreviewDashboardLink() {
  const appUrl = process.env.WORKER_APP_URL || process.env.APP_URL || 'http://localhost:5174'
  return `${appUrl}/dashboard/[live-link-on-send]`
}

function renderTemplateBody(
  body: string,
  placeholders: Record<'worker_name' | 'dashboard_link' | 'expiry_hours', string>
) {
  return body
    .replace(/\{\{worker_name\}\}/g, placeholders.worker_name)
    .replace(/\{\{dashboard_link\}\}/g, placeholders.dashboard_link)
    .replace(/\{\{expiry_hours\}\}/g, placeholders.expiry_hours)
}

export class SMSTemplateService {
  async listTemplates(organizationId: string): Promise<SMSTemplate[]> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to load SMS templates: ${error.message}`)
    }

    return (data || []).map((template) => this.mapTemplate(template as TemplateRow))
  }

  async createTemplate(
    organizationId: string,
    input: SMSTemplateCreateRequest
  ): Promise<SMSTemplate> {
    const supabase = getSupabaseAdmin()

    if (input.isDefault) {
      await this.clearDefaultTemplate(organizationId, input.category)
    }

    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        body: input.body.trim(),
        category: input.category,
        is_default: Boolean(input.isDefault),
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`Failed to create SMS template: ${error?.message || 'Unknown error'}`)
    }

    return this.mapTemplate(data as TemplateRow)
  }

  async updateTemplate(
    organizationId: string,
    templateId: string,
    input: SMSTemplateUpdateRequest
  ): Promise<SMSTemplate> {
    const supabase = getSupabaseAdmin()
    const current = await this.getTemplateById(organizationId, templateId)

    if (!current) {
      throw new Error('SMS template not found')
    }

    if (input.isDefault) {
      await this.clearDefaultTemplate(organizationId, current.category)
    }

    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) {
      updateData.name = input.name.trim()
    }
    if (input.body !== undefined) {
      updateData.body = input.body.trim()
    }
    if (input.isDefault !== undefined) {
      updateData.is_default = input.isDefault
    }

    const { data, error } = await supabase
      .from('sms_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`Failed to update SMS template: ${error?.message || 'Unknown error'}`)
    }

    return this.mapTemplate(data as TemplateRow)
  }

  async deleteTemplate(organizationId: string, templateId: string): Promise<void> {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to delete SMS template: ${error.message}`)
    }
  }

  async setDefaultTemplate(organizationId: string, templateId: string): Promise<SMSTemplate> {
    const current = await this.getTemplateById(organizationId, templateId)
    if (!current) {
      throw new Error('SMS template not found')
    }

    await this.clearDefaultTemplate(organizationId, current.category)

    return this.updateTemplate(organizationId, templateId, {
      isDefault: true,
    })
  }

  async previewTemplate(
    organizationId: string,
    workerId: string,
    expiryHours: number,
    templateId?: string,
    body?: string
  ): Promise<SMSTemplatePreviewResponse['data']> {
    const worker = await this.getWorker(organizationId, workerId)
    const resolved = await this.resolveBody({
      organizationId,
      workerId,
      expiryHours,
      templateId,
      customBody: body,
      dashboardLink: getPreviewDashboardLink(),
    })

    return {
      body: resolved.body,
      dashboardLinkPreview: getPreviewDashboardLink(),
      templateId: resolved.templateId,
      placeholders: {
        worker_name: worker.name,
        dashboard_link: getPreviewDashboardLink(),
        expiry_hours: String(expiryHours),
      },
    }
  }

  async resolveDashboardLinkMessage(options: {
    organizationId: string
    workerId: string
    expiryHours: number
    dashboardLink: string
    templateId?: string
    customMessage?: string
  }): Promise<{
    body: string
    templateId: string | null
  }> {
    return this.resolveBody({
      organizationId: options.organizationId,
      workerId: options.workerId,
      expiryHours: options.expiryHours,
      templateId: options.templateId,
      customBody: options.customMessage,
      dashboardLink: options.dashboardLink,
    })
  }

  private async resolveBody(options: {
    organizationId: string
    workerId: string
    expiryHours: number
    templateId?: string
    customBody?: string
    dashboardLink: string
  }) {
    const worker = await this.getWorker(options.organizationId, options.workerId)
    const placeholders = {
      worker_name: worker.name,
      dashboard_link: options.dashboardLink,
      expiry_hours: String(options.expiryHours),
    } as const

    if (options.customBody?.trim()) {
      return {
        body: renderTemplateBody(options.customBody.trim(), placeholders),
        templateId: options.templateId || null,
      }
    }

    if (options.templateId) {
      const template = await this.getTemplateById(options.organizationId, options.templateId)
      if (!template) {
        throw new Error('SMS template not found')
      }

      return {
        body: renderTemplateBody(template.body, placeholders),
        templateId: template.id,
      }
    }

    const defaultTemplate = await this.getDefaultTemplate(options.organizationId, 'dashboard_link')
    if (defaultTemplate) {
      return {
        body: renderTemplateBody(defaultTemplate.body, placeholders),
        templateId: defaultTemplate.id,
      }
    }

    return {
      body: renderTemplateBody(DASHBOARD_LINK_FALLBACK, placeholders),
      templateId: null,
    }
  }

  private async getWorker(organizationId: string, workerId: string): Promise<WorkerRecord> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, phone')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !data) {
      throw new Error('Worker not found or access denied')
    }

    return data as WorkerRecord
  }

  private async getTemplateById(
    organizationId: string,
    templateId: string
  ): Promise<SMSTemplate | null> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load SMS template: ${error.message}`)
    }

    return data ? this.mapTemplate(data as TemplateRow) : null
  }

  private async getDefaultTemplate(
    organizationId: string,
    category: 'dashboard_link'
  ): Promise<SMSTemplate | null> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('category', category)
      .eq('is_default', true)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to load default SMS template: ${error.message}`)
    }

    return data ? this.mapTemplate(data as TemplateRow) : null
  }

  private async clearDefaultTemplate(
    organizationId: string,
    category: 'dashboard_link'
  ): Promise<void> {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('sms_templates')
      .update({ is_default: false })
      .eq('organization_id', organizationId)
      .eq('category', category)

    if (error) {
      throw new Error(`Failed to update SMS template defaults: ${error.message}`)
    }
  }

  private mapTemplate(row: TemplateRow): SMSTemplate {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      body: row.body,
      category: row.category,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
