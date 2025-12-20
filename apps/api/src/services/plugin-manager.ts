import { PluginRegistry } from '@dashboard-link/plugins';
import type { ScheduleItem, TaskItem, PluginAdapter } from '@dashboard-link/shared';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Plugin Manager Service
 * Orchestrates data fetching from multiple plugins
 */
export class PluginManagerService {
  /**
   * Get all data for a worker's dashboard
   */
  static async getDashboardData(workerId: string): Promise<{
    schedule: ScheduleItem[];
    tasks: TaskItem[];
  }> {
    // Get worker's organization
    const { data: worker } = await supabase
      .from('workers')
      .select('organization_id')
      .eq('id', workerId)
      .single();

    if (!worker) {
      throw new Error('Worker not found');
    }

    // Get active widgets for worker's dashboard
    const { data: dashboard } = await supabase
      .from('dashboards')
      .select('*, dashboard_widgets(*)')
      .eq('worker_id', workerId)
      .eq('active', true)
      .single();

    if (!dashboard || !dashboard.dashboard_widgets) {
      return { schedule: [], tasks: [] };
    }

    // Fetch data from each active widget's plugin
    const schedulePromises: Promise<ScheduleItem[]>[] = [];
    const taskPromises: Promise<TaskItem[]>[] = [];

    for (const widget of dashboard.dashboard_widgets) {
      if (!widget.active) continue;

      const plugin = PluginRegistry.get(widget.plugin_id);
      if (!plugin) {
        console.warn(`Plugin ${widget.plugin_id} not found`);
        continue;
      }

      // Get plugin config from organization
      const { data: pluginConfig } = await supabase
        .from('plugin_configs')
        .select('*')
        .eq('organization_id', worker.organization_id)
        .eq('plugin_id', widget.plugin_id)
        .single();

      const config = { ...pluginConfig?.config, ...widget.config };

      // Fetch data from plugin
      schedulePromises.push(plugin.getTodaySchedule(workerId, config));
      taskPromises.push(plugin.getTodayTasks(workerId, config));
    }

    // Wait for all plugins to respond
    const scheduleResults = await Promise.allSettled(schedulePromises);
    const taskResults = await Promise.allSettled(taskPromises);

    // Combine results from all plugins
    const schedule = scheduleResults
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<ScheduleItem[]>).value);

    const tasks = taskResults
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<TaskItem[]>).value);

    // Sort schedule by start time
    schedule.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Sort tasks by priority and due date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => {
      const priorityA = priorityOrder[a.priority || 'low'];
      const priorityB = priorityOrder[b.priority || 'low'];
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      const dateA = new Date(a.due_date || 0).getTime();
      const dateB = new Date(b.due_date || 0).getTime();
      return dateA - dateB;
    });

    return { schedule, tasks };
  }

  /**
   * Get available plugins
   */
  static getAvailablePlugins(): PluginAdapter[] {
    return PluginRegistry.getAll();
  }

  /**
   * Validate plugin configuration
   */
  static async validatePluginConfig(
    pluginId: string,
    config: Record<string, any>
  ): Promise<boolean> {
    const plugin = PluginRegistry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    return plugin.validateConfig(config);
  }
}
