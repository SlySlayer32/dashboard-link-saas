import { PluginRegistry } from '@dashboard-link/plugins'
import type { PluginAdapter, ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

/**
 * Plugin Manager Service
 * Orchestrates data fetching from multiple plugins
 */
export class PluginManagerService {
  /**
   * Get all data for a worker's dashboard
   * @param workerId - ID of the worker
   * @param date - Optional date to fetch data for (defaults to current date)
   */
  static async getDashboardData(
    workerId: string,
    date: Date = new Date()
  ): Promise<{
    schedule: ScheduleItem[]
    tasks: TaskItem[]
  }> {
    // Normalize date to start of day in UTC
    const startOfDay = new Date(date)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1)

    // Get worker's organization
    const { data: worker } = await supabase
      .from('workers')
      .select('organization_id')
      .eq('id', workerId)
      .single()

    if (!worker) {
      throw new Error('Worker not found')
    }

    // Get active widgets for worker's dashboard
    const { data: dashboard } = await supabase
      .from('dashboards')
      .select('*, dashboard_widgets(*)')
      .eq('worker_id', workerId)
      .eq('active', true)
      .single()

    if (!dashboard || !dashboard.dashboard_widgets) {
      return { schedule: [], tasks: [] }
    }

    // Fetch data from each active widget's plugin
    const { data: pluginConfigs } = await supabase
      .from('plugin_configs')
      .select('*')
      .eq('organization_id', worker.organization_id)

    if (!pluginConfigs || pluginConfigs.length === 0) {
      return { schedule: [], tasks: [] }
    }

    const results = await Promise.allSettled(
      pluginConfigs.map(async (pluginConfig) => {
        const adapter = PluginRegistry.get(pluginConfig.plugin_id)
        if (!adapter) {
          logger.warn(`Plugin not found: ${pluginConfig.plugin_id}`)
          return { schedule: [], tasks: [] }
        }

        try {
          // Pass date information to plugin adapters
          const pluginConfigWithDate = {
            ...pluginConfig.config,
            _requestDate: startOfDay.toISOString(),
          }

          const [schedule, tasks] = await Promise.all([
            adapter.getTodaySchedule(workerId, pluginConfigWithDate),
            adapter.getTodayTasks(workerId, pluginConfigWithDate),
          ])

          // Filter items for the requested date
          const filteredSchedule = schedule.filter((item) => {
            const itemDate = new Date(item.start_time)
            return itemDate >= startOfDay && itemDate < endOfDay
          })

          const filteredTasks = tasks.filter((task) => {
            if (!task.due_date) return true // Tasks without due date are included
            const dueDate = new Date(task.due_date)
            return dueDate >= startOfDay && dueDate < endOfDay
          })

          return { schedule: filteredSchedule, tasks: filteredTasks }
        } catch (error) {
          logger.error(`Plugin ${pluginConfig.plugin_id} failed:`, error)
          return { schedule: [], tasks: [] }
        }
      })
    )

    // Combine results from all plugins
    const allScheduleItems: ScheduleItem[] = []
    const allTaskItems: TaskItem[] = []

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allScheduleItems.push(...result.value.schedule)
        allTaskItems.push(...result.value.tasks)
      }
    })

    // Sort schedule by start time
    allScheduleItems.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    // Sort tasks by priority and due date
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    allTaskItems.sort((a, b) => {
      const priorityA = priorityOrder[a.priority || 'low']
      const priorityB = priorityOrder[b.priority || 'low']
      if (priorityA !== priorityB) return priorityA - priorityB

      const dateA = new Date(a.due_date || 0).getTime()
      const dateB = new Date(b.due_date || 0).getTime()
      return dateA - dateB
    })

    return { schedule: allScheduleItems, tasks: allTaskItems }
  }

  /**
   * Get available plugins
   */
  static getAvailablePlugins(): PluginAdapter[] {
    return PluginRegistry.getAll()
  }

  /**
   * Validate plugin configuration
   */
  static async validatePluginConfig(
    pluginId: string,
    config: Record<string, unknown>
  ): Promise<boolean> {
    const plugin = PluginRegistry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    return plugin.validateConfig(config)
  }
}
