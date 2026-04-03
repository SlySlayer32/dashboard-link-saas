import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface DashboardStatsData {
  totalWorkers: number
  activeWorkers: number
  inactiveWorkers: number
  smsToday: number
  smsThisWeek: number
  dashboardOpensToday: number
  uniqueWorkersOpenedToday: number
}

export interface ActivityItem {
  id: string
  type: 'sms' | 'dashboard_open'
  message: string
  status: string
  createdAt: string
  workerId: string
  workerName: string
  workerPhone: string
}

interface DashboardResponse {
  stats: DashboardStatsData
  recentActivity: ActivityItem[]
}

async function fetchDashboardStats(): Promise<DashboardResponse> {
  const response = await api.get<{ success: boolean; data: DashboardResponse }>('/api/v1/dashboard/stats')
  return response.data.data
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
