import { PluginAdapter, ScheduleItem, TaskItem } from '@dashboard-link/shared'

/**
 * Base adapter class that all plugins should extend
 * Provides common functionality and enforces the plugin interface
 */
export abstract class BaseAdapter implements PluginAdapter {
  abstract id: string
  abstract name: string
  abstract description: string
  abstract version: string

  /**
   * Get today's schedule items for a worker
   * Must be implemented by each plugin
   */
  abstract getTodaySchedule(workerId: string, config: Record<string, unknown>): Promise<ScheduleItem[]>

  /**
   * Get today's tasks for a worker
   * Must be implemented by each plugin
   */
  abstract getTodayTasks(workerId: string, config: unknown): Promise<TaskItem[]>

  /**
   * Optional webhook handler for real-time updates
   * Override this method if your plugin supports webhooks
   */
  async handleWebhook?(_payload: unknown, _config: unknown): Promise<void> {
    throw new Error(`Webhook not implemented for ${this.name}`)
  }

  /**
   * Validate plugin configuration
   * Override with plugin-specific validation logic
   */
  async validateConfig(config: unknown): Promise<boolean> {
    return typeof config === 'object' && config !== null && Object.keys(config).length > 0
  }

  /**
   * Helper method to filter items for today
   */
  protected filterToday<T extends { start_time?: string; due_date?: string }>(items: T[]): T[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return items.filter((item) => {
      const date = new Date(item.start_time || item.due_date || '')
      return date >= today && date < tomorrow
    })
  }
}
