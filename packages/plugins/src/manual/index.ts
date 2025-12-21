import { BaseAdapter } from '../base/adapter';
import { ScheduleItem, TaskItem } from '@dashboard-link/shared';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Manual Data Entry Plugin Adapter
 * Allows admins to manually enter schedule and task data
 * No external API integration - data stored directly in the database
 */
export class ManualAdapter extends BaseAdapter {
  id = 'manual';
  name = 'Manual Entry';
  description = 'Manually entered schedules and tasks (no external API)';
  version = '1.0.0';

  async getTodaySchedule(
    workerId: string,
    config: Record<string, any>
  ): Promise<ScheduleItem[]> {
    try {
      // Get today's date range in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      // Query manual schedule items for today
      const { data, error } = await supabase
        .from('manual_schedule_items')
        .select('*')
        .eq('worker_id', workerId)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching manual schedule:', error);
        return [];
      }

      // Transform database rows to ScheduleItem format
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        location: item.location,
        description: item.description,
        type: 'manual',
        source: 'manual',
        metadata: item.metadata || {},
      }));
    } catch (error) {
      console.error('Error in ManualAdapter.getTodaySchedule:', error);
      return [];
    }
  }

  async getTodayTasks(
    workerId: string,
    config: Record<string, any>
  ): Promise<TaskItem[]> {
    try {
      // Get today's date range in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      // Query manual task items
      // We include tasks without due dates and tasks due today
      const { data, error } = await supabase
        .from('manual_task_items')
        .select('*')
        .eq('worker_id', workerId)
        .or(`due_date.is.null,due_date.gte.${today.toISOString()},due_date.lt.${tomorrow.toISOString()}`)
        .order('priority', { ascending: false }) // High priority first
        .order('due_date', { ascending: true }); // Earlier due dates first

      if (error) {
        console.error('Error fetching manual tasks:', error);
        return [];
      }

      // Transform database rows to TaskItem format
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        due_date: item.due_date,
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        type: 'manual',
        source: 'manual',
        metadata: item.metadata || {},
      }));
    } catch (error) {
      console.error('Error in ManualAdapter.getTodayTasks:', error);
      return [];
    }
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    // Manual adapter doesn't require external configuration
    return true;
  }

  async handleWebhook(payload: any, config: Record<string, any>): Promise<void> {
    // Manual adapter doesn't support webhooks
    throw new Error('Manual adapter does not support webhooks');
  }
}
