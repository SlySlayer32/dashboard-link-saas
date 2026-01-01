export interface Dashboard {
  id: string;
  organization_id: string;
  worker_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  plugin_id: string;
  config: Record<string, unknown>;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Re-export standardized plugin types for frontend compatibility
export { StandardScheduleItem as ScheduleItem, StandardTaskItem as TaskItem } from './plugin';
