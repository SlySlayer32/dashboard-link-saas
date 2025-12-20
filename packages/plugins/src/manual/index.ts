import { BaseAdapter } from '../base/adapter';
import { ScheduleItem, TaskItem } from '@dashboard-link/shared';

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
    // Manual entries are stored directly in the database
    // This would typically query the database for manual_schedule_items
    // where worker_id = workerId AND date = today
    
    console.log(`Fetching manual schedule entries for worker ${workerId}`);
    
    // Placeholder - in real implementation, this would query the database
    return [];
  }

  async getTodayTasks(
    workerId: string,
    config: Record<string, any>
  ): Promise<TaskItem[]> {
    // Manual tasks are stored directly in the database
    // This would query the database for manual_task_items
    
    console.log(`Fetching manual task entries for worker ${workerId}`);
    
    // Placeholder - in real implementation, this would query the database
    return [];
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
