export interface Dashboard {
  id: string
  organization_id: string
  worker_id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}
export interface DashboardWidget {
  id: string
  dashboard_id: string
  plugin_id: string
  config: Record<string, unknown>
  order: number
  active: boolean
  created_at: string
  updated_at: string
}
export interface ScheduleItem {
  id: string
  title: string
  start_time: string
  end_time: string
  location?: string
  description?: string
  metadata?: Record<string, unknown>
}
export interface TaskItem {
  id: string
  title: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed'
  metadata?: Record<string, unknown>
}
//# sourceMappingURL=dashboard.d.ts.map
