import type { ScheduleItem, TaskItem, Worker } from '@dashboard-link/shared'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { API_URL } from '../lib/config'

interface DashboardData {
  worker: Worker
  schedule: ScheduleItem[]
  tasks: TaskItem[]
}

export type DashboardErrorCode =
  | 'invalid-token'
  | 'expired-token'
  | 'network-error'
  | 'missing-token'
  | 'unknown'

export class DashboardError extends Error {
  code: DashboardErrorCode

  constructor(message: string, code: DashboardErrorCode) {
    super(message)
    this.name = 'DashboardError'
    this.code = code
  }
}

export function useDashboardData(token?: string): UseQueryResult<DashboardData, DashboardError> {
  return useQuery<DashboardData, DashboardError>({
    queryKey: ['dashboard', token],
    queryFn: async () => {
      if (!token) {
        throw new DashboardError('Token is required', 'missing-token')
      }

      let response: Response
      try {
        response = await fetch(`${API_URL}/dashboards/${token}`)
      } catch {
        throw new DashboardError(
          'Network error. Please check your connection and try again.',
          'network-error'
        )
      }

      if (response.status === 401) {
        const error = await response.json()
        const reason = error.reason === 'expired' ? 'expired-token' : 'invalid-token'
        throw new DashboardError(error.error || 'Invalid or expired link', reason)
      }

      if (!response.ok) {
        throw new DashboardError('Failed to load dashboard', 'unknown')
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
      // Don't retry on authentication errors or missing token
      if (
        error instanceof DashboardError &&
        ['expired-token', 'invalid-token', 'missing-token'].includes(error.code)
      ) {
        return false
      }
      return failureCount < 1
    },
  })
}
