import type { ScheduleItem, TaskItem, Worker } from '@dashboard-link/shared'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { API_URL } from '../lib/config'

interface DashboardData {
  worker: Worker
  schedule: ScheduleItem[]
  tasks: TaskItem[]
}

export function useDashboardData(token?: string): UseQueryResult<DashboardData, Error> {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token is required')
      }

      const response = await fetch(`${API_URL}/dashboards/${token}`)

      if (response.status === 401) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid or expired link')
      }

      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      return response.json()
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes for worker dashboard
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error instanceof Error &&
        (error.message.includes('expired') || error.message.includes('Invalid'))
      ) {
        return false
      }
      return failureCount < 1
    },
  })
}
