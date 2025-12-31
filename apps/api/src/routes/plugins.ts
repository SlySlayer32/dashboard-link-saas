import { PluginRegistry } from '@dashboard-link/plugins';
import type { PluginTestResult, PluginsConfig } from '@dashboard-link/shared';
import { logger } from '../utils/logger.js';
import { zValidator } from '@hono/zod-validator';
import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const plugins = new Hono()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// All routes require authentication
plugins.use('*', authMiddleware)

// Validation schemas
const updatePluginConfigSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.unknown()),
})

const testPluginConfigSchema = z.object({
  config: z.record(z.unknown()),
})

const googleCalendarConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  calendarId: z.string().optional(),
})

const airtableConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseId: z.string().optional(),
  tableName: z.string().optional(),
})

const notionConfigSchema = z.object({
  integrationSecret: z.string().optional(),
  databaseId: z.string().optional(),
})

/**
 * Get all available plugins and their configurations
 */
plugins.get('/', async (c) => {
  // @ts-expect-error - Hono context typing issue
  const userId = c.get('userId')

  try {
    // Get admin and organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id, organizations(*)')
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

    // Get all registered plugins
    const allPlugins = PluginRegistry.getAll()

    // Get current plugin configurations from organization
    const orgPlugins: PluginsConfig = admin.organizations?.settings?.plugins || {}

    // Build response with plugin info and current config
    const pluginsResponse = allPlugins.map((plugin) => {
      const pluginConfig = orgPlugins[plugin.id] || { enabled: false, config: {} }

      return {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        category:
          plugin.id === 'google-calendar'
            ? ('calendar' as const)
            : plugin.id === 'airtable' || plugin.id === 'notion'
              ? ('task' as const)
              : ('manual' as const),
        documentationUrl: `https://docs.cleanconnect.com/plugins/${plugin.id}`,
        webhookSupported: !!plugin.handleWebhook,
        features: [
          plugin.id === 'google-calendar'
            ? 'Calendar Sync'
            : plugin.id === 'airtable'
              ? 'Task Management'
              : plugin.id === 'notion'
                ? 'Database Integration'
                : 'Manual Configuration',
        ],
        enabled: pluginConfig.enabled,
        configured: Object.keys(pluginConfig.config || {}).length > 0,
        config: pluginConfig.config,
        status: pluginConfig.status,
      }
    })

    return c.json({
      success: true,
      data: pluginsResponse,
    })
  } catch (error) {
    logger.error('Get plugins error:', error) // Use logger
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve plugins',
        },
      },
      500
    )
  }
})

/**
 * Update plugin configuration
 */
plugins.put('/:pluginId', zValidator('json', updatePluginConfigSchema), async (c) => {
  // @ts-expect-error - Hono context typing issue
  const userId = c.get('userId')
  const pluginId = c.req.param('pluginId')
  const body = c.req.valid('json')

  try {
    // Validate plugin exists
    if (!PluginRegistry.has(pluginId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: 'Plugin not found',
          },
        },
        404
      )
    }

    // Get admin and organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
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

    // Validate plugin-specific config
    let validatedConfig = body.config

    if (pluginId === 'google-calendar') {
      const result = googleCalendarConfigSchema.safeParse(body.config)
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONFIG',
              message: 'Invalid Google Calendar configuration',
              details: result.error.errors,
            },
          },
          400
        )
      }
      validatedConfig = result.data
    } else if (pluginId === 'airtable') {
      const result = airtableConfigSchema.safeParse(body.config)
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONFIG',
              message: 'Invalid Airtable configuration',
              details: result.error.errors,
            },
          },
          400
        )
      }
      validatedConfig = result.data
    } else if (pluginId === 'notion') {
      const result = notionConfigSchema.safeParse(body.config)
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONFIG',
              message: 'Invalid Notion configuration',
              details: result.error.errors,
            },
          },
          400
        )
      }
      validatedConfig = result.data
    }

    // Get current organization data
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', admin.organization_id)
      .single()

    if (fetchError || !currentOrg) {
      return c.json(
        {
          success: false,
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found',
          },
        },
        404
      )
    }

    // Update plugin configuration
    const settings = currentOrg.settings || {}
    const plugins = settings.plugins || {}

    plugins[pluginId] = {
      enabled: body.enabled,
      config: validatedConfig,
    }

    settings.plugins = plugins

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.organization_id)

    if (updateError) {
      logger.error(`Update plugin ${pluginId} failed:`, updateError) // Use logger
      return c.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: updateError.message,
          },
        },
        400
      )
    }

    return c.json({
      success: true,
      data: {
        id: pluginId,
        enabled: body.enabled,
        config: validatedConfig,
      },
    })
  } catch (error) {
    logger.error(`Update plugin ${pluginId} failed:`, error) // Use logger
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update plugin configuration',
        },
      },
      500
    )
  }
})

/**
 * Test plugin configuration
 */
plugins.post('/:pluginId/test', zValidator('json', testPluginConfigSchema), async (c) => {
  // @ts-expect-error - Hono context typing issue
  const userId = c.get('userId')
  const pluginId = c.req.param('pluginId')
  const body = c.req.valid('json')

  try {
    // Validate plugin exists
    if (!PluginRegistry.has(pluginId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: 'Plugin not found',
          },
        },
        404
      )
    }

    // Get admin and organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
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

    // Test plugin configuration
    const plugin = PluginRegistry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`)
    }
    const isValid = await plugin.validateConfig(body.config)

    const testResult: PluginTestResult = {
      success: isValid,
      message: isValid ? 'Configuration is valid' : 'Configuration validation failed',
      timestamp: new Date().toISOString(),
    }

    // Update plugin status in organization
    if (isValid) {
      const { data: currentOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', admin.organization_id)
        .single()

      if (!fetchError && currentOrg) {
        const settings = currentOrg.settings || {}
        const plugins = settings.plugins || {}

        if (plugins[pluginId]) {
          plugins[pluginId].status = {
            id: pluginId,
            enabled: plugins[pluginId].enabled,
            configured: true,
            connected: true,
            lastTested: testResult.timestamp,
          }

          await supabase
            .from('organizations')
            .update({
              settings,
              updated_at: new Date().toISOString(),
            })
            .eq('id', admin.organization_id)
        }
      }
    }

    return c.json({
      success: true,
      data: testResult,
    })
  } catch (error) {
    logger.error('Test plugin config error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to test plugin configuration',
        },
      },
      500
    )
  }
})

/**
 * Delete plugin configuration
 */
plugins.delete('/:pluginId', async (c) => {
  // @ts-expect-error - Hono context typing issue
  const userId = c.get('userId')
  const pluginId = c.req.param('pluginId')

  try {
    // Validate plugin exists
    if (!PluginRegistry.has(pluginId)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: 'Plugin not found',
          },
        },
        404
      )
    }

    // Get admin and organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
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

    // Get current organization data
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', admin.organization_id)
      .single()

    if (fetchError || !currentOrg) {
      return c.json(
        {
          success: false,
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
            message: 'Organization not found',
          },
        },
        404
      )
    }

    // Remove plugin configuration
    const settings = currentOrg.settings || {}
    const plugins = settings.plugins || {}

    delete plugins[pluginId]
    settings.plugins = plugins

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.organization_id)

    if (updateError) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: updateError.message,
          },
        },
        400
      )
    }

    return c.json({
      success: true,
      data: { id: pluginId },
    })
  } catch (error) {
    logger.error('Delete plugin config error:', error)
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete plugin configuration',
        },
      },
      500
    )
  }
})

export default plugins
