import { ScheduleItem, TaskItem } from './dashboard';

export interface PluginAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  
  /**
   * Get today's schedule items for a worker
   */
  getTodaySchedule(workerId: string, config: Record<string, any>): Promise<ScheduleItem[]>;
  
  /**
   * Get today's tasks for a worker
   */
  getTodayTasks(workerId: string, config: Record<string, any>): Promise<TaskItem[]>;
  
  /**
   * Optional webhook handler for real-time updates
   */
  handleWebhook?(payload: any, config: Record<string, any>): Promise<void>;
  
  /**
   * Validate plugin configuration
   */
  validateConfig(config: Record<string, any>): Promise<boolean>;
}

export interface PluginConfig {
  id: string;
  organization_id: string;
  plugin_id: string;
  config: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}
