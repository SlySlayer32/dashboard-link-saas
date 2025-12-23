import { ScheduleItem, TaskItem } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import { BaseAdapter } from '../base/adapter'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

/**
 * Manual Data Entry Plugin Adapter
 * Allows admins to manually enter schedule and task data
 * No external API integration - data stored directly in the database
 */
export class ManualAdapter extends BaseAdapter {
  id = 'manual'
  name = 'Manual Entry'
  description = 'Manually entered schedules and tasks (no external API)'
  version = '1.0.0'

  async getTodaySchedule(
    workerId: string,
    _config: unknown
  ): Promise<ScheduleItem[]> {
    try {
      // Get today's date range in UTC
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      // Query manual schedule items for today
      const { data, error } = await supabase
        .from('manual_schedule_items')
        .select('*')
        .eq('worker_id', workerId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching manual schedule:', error)
        return []
      }

      // Transform database rows to ScheduleItem format
      return (data || []).map((item: {
        id: string;
        title: string;
        start_time: string;
        end_time: string;
        location?: string;
        description?: string;
        metadata?: Record<string, unknown>;
      }) => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location,
        description: item.description,
        type: 'manual' as const,
        source: 'manual' as const,
        metadata: item.metadata || {},
      }))
    } catch (error) {
      console.error('Error in ManualAdapter.getTodaySchedule:', error)
      return []
    }
  }

  async getTodayTasks(_workerId: string, _config: unknown): Promise<TaskItem[]> {
    try {
      // Get today's date range in UTC
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      // Query manual task items for worker
      const { data, error } = await supabase
        .from('manual_task_items')
        .select('*')
        .eq('worker_id', _workerId)
        .or(
          `due_date.is.null,due_date.gte.${today.toISOString()},due_date.lt.${tomorrow.toISOString()}`
        )
        .order('priority', { ascending: false }) // High priority first
        .order('due_date', { ascending: true }) // Earlier due dates first

      if (error) {
        console.error('Error fetching manual tasks:', error)
        return []
      }

      // Transform database rows to TaskItem format
      return (data || []).map((item: {
        id: string;
        title: string;
        description?: string;
        due_date?: string;
        priority?: string;
        status?: string;
        metadata?: Record<string, unknown>;
      }) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        due_date: item.due_date,
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        type: 'manual' as const,
        source: 'manual' as const,
        metadata: item.metadata || {},
      }))
    } catch (error) {
      console.error('Error in ManualAdapter.getTodayTasks:', error)
      return []
    }
  }

  async validateConfig(_config: Record<string, unknown>): Promise<boolean> {
    // Manual adapter doesn't require external configuration
    return true
  }

  async handleWebhook(_payload: unknown, _config: Record<string, unknown>): Promise<void> {
    // Manual adapter doesn't support webhooks
    throw new Error('Manual adapter does not support webhooks')
  }
}
