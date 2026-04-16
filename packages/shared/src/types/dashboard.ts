export interface Dashboard {
  id: string
  organizationId: string
  workerId: string
  name: string
  active: boolean
  config?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DashboardWidget {
  id: string
  dashboardId: string
  pluginId: string
  config: Record<string, unknown>
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardActivityItem {
  id: string
  type: 'sms' | 'dashboard_open'
  message: string
  status: string
  createdAt: string
  workerId: string
  workerName: string
  workerPhone: string
}

export interface NonOpenerItem {
  workerId: string
  workerName: string
  workerPhone: string
  smsLogId: string
  sentAt: string
  smsStatus: 'pending' | 'sent' | 'delivered'
  tokenId: string
  minutesSinceSent: number
}

export interface AdminDashboardStats {
  totalWorkers: number
  activeWorkers: number
  inactiveWorkers: number
  smsToday: number
  smsThisWeek: number
  dashboardOpensToday: number
  uniqueWorkersOpenedToday: number
  deliveryRateToday: number
  smsDeliveredToday: number
  smsFailedToday: number
  nonOpenersToday: NonOpenerItem[]
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats
  recentActivity: DashboardActivityItem[]
}

// Re-export standardized plugin types for frontend compatibility
export {
  StandardScheduleItem as ScheduleItem,
  StandardTaskItem as TaskItem,
} from './plugin.types.js'
