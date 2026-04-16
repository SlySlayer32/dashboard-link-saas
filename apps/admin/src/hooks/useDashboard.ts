import { useQuery } from '@tanstack/react-query'
import type { AdminDashboardResponse } from '@dashboard-link/shared'
import { api } from '../lib/api'
import { isPreviewMode } from '../lib/preview'

const previewDashboardData: AdminDashboardResponse = {
  stats: {
    totalWorkers: 12,
    activeWorkers: 10,
    inactiveWorkers: 2,
    smsToday: 18,
    smsThisWeek: 74,
    dashboardOpensToday: 9,
    uniqueWorkersOpenedToday: 7,
    deliveryRateToday: 86,
    smsDeliveredToday: 12,
    smsFailedToday: 2,
    nonOpenersToday: [
      {
        workerId: 'preview-worker-1',
        workerName: 'Sarah Chen',
        workerPhone: '+61 412 345 678',
        smsLogId: 'sms-preview-1',
        sentAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        smsStatus: 'delivered',
        tokenId: 'token-preview-1',
        minutesSinceSent: 90,
      },
      {
        workerId: 'preview-worker-4',
        workerName: 'Daniel Park',
        workerPhone: '+61 455 987 654',
        smsLogId: 'sms-preview-2',
        sentAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        smsStatus: 'sent',
        tokenId: 'token-preview-2',
        minutesSinceSent: 42,
      },
    ],
  },
  recentActivity: [
    {
      id: 'preview-sms-1',
      type: 'sms',
      message: 'Dashboard link sent',
      status: 'sent',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      workerId: 'preview-worker-1',
      workerName: 'Sarah Chen',
      workerPhone: '+61 412 345 678',
    },
    {
      id: 'preview-open-1',
      type: 'dashboard_open',
      message: 'Dashboard opened',
      status: 'success',
      createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      workerId: 'preview-worker-2',
      workerName: 'Marcus Lee',
      workerPhone: '+61 423 456 789',
    },
    {
      id: 'preview-sms-2',
      type: 'sms',
      message: 'Dashboard link sent',
      status: 'delivered',
      createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      workerId: 'preview-worker-3',
      workerName: 'Priya Nair',
      workerPhone: '+61 434 567 890',
    },
  ],
}

async function fetchDashboardStats(): Promise<AdminDashboardResponse> {
  if (isPreviewMode()) {
    return previewDashboardData
  }

  const response = await api.get<{ success: boolean; data: AdminDashboardResponse }>(
    '/api/v1/dashboard/stats'
  )
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
