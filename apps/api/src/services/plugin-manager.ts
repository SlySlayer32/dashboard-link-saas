/**
 * Plugin Manager Service
 *
 * Manages plugin lifecycle and operations for the API
 * Follows the Zapier-style architecture where plugins are isolated
 */

import { pluginManager as corePluginManager } from '@dashboard-link/plugins'
import type { PluginConfig, StandardScheduleItem, StandardTaskItem } from '@dashboard-link/shared'
import { logger } from '../utils/logger.js'

// Local type for plugin execution results
interface PluginResult {
  success: boolean
  data?: unknown
  error?: {
    code: string
    message: string
  }
}

export class PluginManagerService {
  private plugins = new Map<string, PluginConfig>()

  /**
   * Register a plugin
   */
  async registerPlugin(config: PluginConfig): Promise<void> {
    logger.info('Registering plugin', { pluginId: config.id })
    this.plugins.set(config.id, config)
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    logger.info('Unregistering plugin', { pluginId })
    this.plugins.delete(pluginId)
  }

  /**
   * Get all registered plugins
   */
  async getPlugins(): Promise<PluginConfig[]> {
    return Array.from(this.plugins.values())
  }

  /**
   * Get a specific plugin
   */
  async getPlugin(pluginId: string): Promise<PluginConfig | undefined> {
    return this.plugins.get(pluginId)
  }

  /**
   * Execute a plugin operation
   */
  async executePlugin(pluginId: string, operation: string, data: unknown): Promise<PluginResult> {
    const plugin = this.plugins.get(pluginId)

    if (!plugin) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_NOT_FOUND',
          message: `Plugin ${pluginId} not found`,
        },
      }
    }

    logger.info('Executing plugin operation', {
      pluginId,
      operation,
      data,
    })

    // TODO: Implement actual plugin execution
    // This would involve loading the plugin adapter and executing the operation

    return {
      success: true,
      data: {
        pluginId,
        operation,
        result: 'Plugin executed successfully',
      },
    }
  }

  /**
   * Get dashboard data for a worker from all configured plugins
   * This aggregates schedule and task data from active data sources
   */
  async getDashboardData(
    workerId: string,
    organizationId: string,
    pluginConfigs: PluginConfig[]
  ): Promise<{
    schedule: StandardScheduleItem[]
    tasks: StandardTaskItem[]
  }> {
    logger.info('Fetching dashboard data', {
      workerId,
      organizationId,
      pluginCount: pluginConfigs.length,
    })

    // Filter to only enabled plugins
    const enabledConfigs = pluginConfigs.filter((config) => config.enabled)

    if (enabledConfigs.length === 0) {
      logger.info('No enabled plugins found for organization', { organizationId })
      return { schedule: [], tasks: [] }
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateRange = {
      start: today.toISOString(),
      end: tomorrow.toISOString(),
    }

    try {
      // Execute all plugins in parallel
      const [scheduleResults, taskResults] = await Promise.all([
        corePluginManager.executeSchedulePlugins(workerId, enabledConfigs, dateRange),
        corePluginManager.executeTaskPlugins(workerId, enabledConfigs),
      ])

      // Aggregate successful results
      const schedule = scheduleResults
        .filter((result) => result.success)
        .flatMap((result) => result.data)

      const tasks = taskResults.filter((result) => result.success).flatMap((result) => result.data)

      // Log any errors
      const scheduleErrors = scheduleResults.filter((result) => !result.success)
      const taskErrors = taskResults.filter((result) => !result.success)

      if (scheduleErrors.length > 0) {
        logger.warn('Some schedule plugins failed', {
          workerId,
          errors: scheduleErrors.map((r) => ({
            source: r.metadata.source,
            errors: r.errors,
          })),
        })
      }

      if (taskErrors.length > 0) {
        logger.warn('Some task plugins failed', {
          workerId,
          errors: taskErrors.map((r) => ({
            source: r.metadata.source,
            errors: r.errors,
          })),
        })
      }

      logger.info('Dashboard data fetched successfully', {
        workerId,
        scheduleCount: schedule.length,
        taskCount: tasks.length,
      })

      return { schedule, tasks }
    } catch (error) {
      logger.error(
        'Failed to fetch dashboard data',
        error instanceof Error ? error : new Error(String(error)),
        { workerId, organizationId }
      )

      // Return empty data on error rather than throwing
      return { schedule: [], tasks: [] }
    }
  }
}

// Export singleton instance
export const pluginManager = new PluginManagerService()
