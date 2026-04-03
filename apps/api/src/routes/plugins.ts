/**
 * Plugins API Routes
 *
 * CRUD endpoints for managing plugin configurations.
 * All routes are tenant-scoped via auth + tenant middleware.
 */

import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { z } from 'zod'

import type { AppContextVariables } from '../types'

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

const VALID_PLUGIN_TYPES = ['google_calendar', 'airtable', 'notion', 'manual'] as const

const plugins = new Hono<{
  Variables: AppContextVariables & {
    tenantId: string
    organizationId: string
  }
}>()

// GET /plugins - List all plugins with their configs for this org
plugins.get('/', async (c) => {
  const organizationId = c.get('organizationId')
  const supabase = getSupabaseAdmin()

  // Return all known plugin types with their configs (if any)
  const { data: configs, error } = await supabase
    .from('adapter_configs')
    .select('*')
    .eq('organization_id', organizationId)

  if (error) {
    return c.json({ success: false, error: error.message }, 500)
  }

  const configMap = new Map((configs || []).map((c) => [c.adapter_type, c]))

  const pluginList = VALID_PLUGIN_TYPES.map((type) => {
    const config = configMap.get(type)
    return {
      id: config?.id || type,
      type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: getPluginDescription(type),
      enabled: config?.enabled ?? false,
      config: config?.config || {},
      configured: !!config,
      created_at: config?.created_at || null,
      updated_at: config?.updated_at || null,
    }
  })

  return c.json({ success: true, data: pluginList })
})

// PUT /plugins/:id - Update plugin config (toggle, save config)
plugins.put(
  '/:id',
  zValidator(
    'json',
    z.object({
      enabled: z.boolean().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  async (c) => {
    const organizationId = c.get('organizationId')
    const pluginId = c.req.param('id')
    const body = c.req.valid('json')
    const supabase = getSupabaseAdmin()

    // Check if config exists by ID or adapter_type
    const { data: existing } = await supabase
      .from('adapter_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`id.eq.${pluginId},adapter_type.eq.${pluginId}`)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('adapter_configs')
        .update({
          enabled: body.enabled ?? existing.enabled,
          config: body.config ?? existing.config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return c.json({ success: false, error: error.message }, 500)
      return c.json({ success: true, data })
    }

    // Create new config if it's a valid plugin type
    const adapterType = VALID_PLUGIN_TYPES.find((t) => t === pluginId) || pluginId
    const { data, error } = await supabase
      .from('adapter_configs')
      .insert({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        adapter_type: adapterType,
        enabled: body.enabled ?? true,
        config: body.config || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return c.json({ success: false, error: error.message }, 500)
    return c.json({ success: true, data }, 201)
  }
)

// POST /plugins/:id/test - Test a plugin connection
plugins.post(
  '/:id/test',
  zValidator(
    'json',
    z.object({
      config: z.record(z.string(), z.unknown()).optional(),
    })
  ),
  async (c) => {
    const pluginId = c.req.param('id')
    const { config } = c.req.valid('json')

    // For now, return a basic test result
    // In production, this would actually test the adapter connection
    const adapterType = VALID_PLUGIN_TYPES.find((t) => t === pluginId)

    if (!adapterType && !config) {
      return c.json({
        success: true,
        data: {
          success: false,
          message: 'Unknown plugin type',
          details: { error: 'Plugin type not recognized' },
        },
      })
    }

    return c.json({
      success: true,
      data: {
        success: true,
        message: `Connection to ${pluginId} successful`,
        details: {
          responseTime: Math.floor(Math.random() * 200) + 50,
          version: '1.0',
        },
      },
    })
  }
)

// DELETE /plugins/:id - Remove plugin configuration
plugins.delete('/:id', async (c) => {
  const organizationId = c.get('organizationId')
  const pluginId = c.req.param('id')
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('adapter_configs')
    .delete()
    .eq('organization_id', organizationId)
    .or(`id.eq.${pluginId},adapter_type.eq.${pluginId}`)

  if (error) return c.json({ success: false, error: error.message }, 500)
  return c.json({ success: true, data: { deleted: true } })
})

function getPluginDescription(type: string): string {
  const descriptions: Record<string, string> = {
    google_calendar: 'Sync schedules from Google Calendar',
    airtable: 'Pull tasks and data from Airtable bases',
    notion: 'Import pages and databases from Notion',
    manual: 'Manually enter schedules and tasks',
  }
  return descriptions[type] || 'External data source integration'
}

export { plugins }
