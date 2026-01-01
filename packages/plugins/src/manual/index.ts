import { DateRange, PluginConfig, StandardScheduleItem, StandardTaskItem, ValidationResult } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import { BasePluginAdapter } from '../base/adapter'

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
export class ManualAdapter extends BasePluginAdapter {
  readonly id = 'manual'
  readonly name = 'Manual Entry'
  readonly version = '1.0.0'
  readonly description = 'Allows admins to manually enter schedule and task data'

  protected async fetchExternalSchedule(
    workerId: string,
    dateRange: DateRange,
    _config: PluginConfig
  ): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('manual_schedule_items')
      .select('*')
      .eq('worker_id', workerId)
      .gte('start_time', dateRange.start)
      .lt('start_time', dateRange.end)
      .order('start_time', { ascending: true })

    if (error) throw error
    return data || []
  }

  protected async fetchExternalTasks(
    workerId: string,
    _config: PluginConfig
  ): Promise<unknown[]> {
    // Get today's date range
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const { data, error } = await supabase
      .from('manual_task_items')
      .select('*')
      .eq('worker_id', workerId)
      .or(
        `due_date.is.null,due_date.gte.${today.toISOString()},due_date.lt.${tomorrow.toISOString()}`
      )
      .order('priority', { ascending: false }) // High priority first
      .order('due_date', { ascending: true }) // Earlier due dates first

    if (error) throw error
    return data || []
  }

  protected transformScheduleItem(externalItem: unknown): StandardScheduleItem | null {
    const item = externalItem as {
      id: string;
      title: string;
      start_time: string;
      end_time: string;
      location?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }

    if (!item.start_time || !item.end_time) {
      return null
    }

    return {
      id: item.id,
      title: item.title,
      startTime: item.start_time,
      endTime: item.end_time,
      location: item.location,
      description: item.description,
      metadata: {
        source: 'manual',
        createdAt: new Date().toISOString(),
        ...item.metadata,
      },
    }
  }

  protected transformTaskItem(externalItem: unknown): StandardTaskItem | null {
    const item = externalItem as {
      id: string;
      title: string;
      description?: string;
      due_date?: string;
      priority?: 'low' | 'medium' | 'high';
      status?: 'pending' | 'in_progress' | 'completed';
      metadata?: Record<string, unknown>;
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      dueDate: item.due_date,
      priority: item.priority || 'medium',
      status: item.status || 'pending',
      metadata: {
        source: 'manual',
        createdAt: new Date().toISOString(),
        ...item.metadata,
      },
    }
  }

  async validateConfig(_config: PluginConfig): Promise<ValidationResult> {
    // Manual adapter doesn't require external configuration
    return { valid: true }
  }

  getConfigSchema(): import('@dashboard-link/shared').PluginConfigSchema {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }
}
