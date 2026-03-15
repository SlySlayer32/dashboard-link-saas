/**
 * Data Source Service
 *
 * Manages data source configurations for plugin integrations
 * Fetches plugin configs from the data_sources table
 */

import type { PluginConfig } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'
import { logger } from '../utils/logger.js'

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

export class DataSourceService {
  /**
   * Get all active plugin configurations for an organization
   */
  async getPluginConfigs(organizationId: string): Promise<PluginConfig[]> {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) {
        logger.error('Failed to fetch plugin configs', error, { organizationId })
        return []
      }

      if (!data || data.length === 0) {
        logger.info('No active data sources found', { organizationId })
        return []
      }

      // Transform database records to PluginConfig format
      const configs: PluginConfig[] = data.map((source) => ({
        id: source.plugin_id,
        name: source.plugin_id,
        version: source.plugin_version,
        enabled: source.status === 'active',
        settings: (source.config as Record<string, unknown>) || {},
        credentials: {
          accessToken: source.access_token_encrypted,
          refreshToken: source.refresh_token_encrypted,
        },
      }))

      logger.info('Fetched plugin configs', {
        organizationId,
        count: configs.length,
        plugins: configs.map((c) => c.id),
      })

      return configs
    } catch (error) {
      logger.error(
        'Error fetching plugin configs',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId }
      )
      return []
    }
  }

  /**
   * Get a specific plugin configuration
   */
  async getPluginConfig(organizationId: string, pluginId: string): Promise<PluginConfig | null> {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('plugin_id', pluginId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.plugin_id,
        name: data.plugin_id,
        version: data.plugin_version,
        enabled: data.status === 'active',
        settings: (data.config as Record<string, unknown>) || {},
        credentials: {
          accessToken: data.access_token_encrypted,
          refreshToken: data.refresh_token_encrypted,
        },
      }
    } catch (error) {
      logger.error(
        'Error fetching plugin config',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId, pluginId }
      )
      return null
    }
  }

  /**
   * Update last sync timestamp for a data source
   */
  async updateLastSync(organizationId: string, pluginId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sources')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('plugin_id', pluginId)

      if (error) {
        logger.error('Failed to update last sync', error, { organizationId, pluginId })
      }
    } catch (error) {
      logger.error(
        'Error updating last sync',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId, pluginId }
      )
    }
  }

  /**
   * Update data source status and error message
   */
  async updateStatus(
    organizationId: string,
    pluginId: string,
    status: 'active' | 'error' | 'disconnected',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sources')
        .update({
          status,
          last_error: errorMessage || null,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('plugin_id', pluginId)

      if (error) {
        logger.error('Failed to update data source status', error, {
          organizationId,
          pluginId,
          status,
        })
      }
    } catch (error) {
      logger.error(
        'Error updating data source status',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId, pluginId, status }
      )
    }
  }
}

// Export singleton instance
export const dataSourceService = new DataSourceService()
