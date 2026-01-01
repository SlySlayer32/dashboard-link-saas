export interface Dashboard {
  id: string;
  organizationId: string;
  workerId: string;
  name: string;
  active: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  pluginId: string;
  config: Record<string, unknown>;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Re-export standardized plugin types for frontend compatibility
export { StandardScheduleItem as ScheduleItem, StandardTaskItem as TaskItem } from './plugin.types';
