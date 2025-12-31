import type { SMSLog } from '@dashboard-link/shared'
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface SMSLogsParams {
  page?: number
  limit?: number
  workerId?: string
  status?: SMSLog['status']
  dateFrom?: string
  dateTo?: string
  search?: string
}

export function useSMSLogs(params: SMSLogsParams = {}): UseQueryResult<SMSLogsResponse> {
  const {
    page = 1,
    limit = 20,
    workerId,
    status,
    dateFrom,
    dateTo,
    search,
  } = params

  return useQuery({
    queryKey: ['sms-logs', page, limit, workerId, status, dateFrom, dateTo, search],
    queryFn: async (): Promise<SMSLogsResponse> => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const searchParams = new URLSearchParams()
      searchParams.set('page', page.toString())
      searchParams.set('limit', limit.toString())

      // Add filters if provided
      if (workerId) searchParams.set('workerId', workerId)
      if (status) searchParams.set('status', status)
      if (dateFrom) searchParams.set('dateFrom', dateFrom)
      if (dateTo) searchParams.set('dateTo', dateTo)
      if (search) searchParams.set('search', search)

      const response = await fetch(`${API_BASE}/sms/logs?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch SMS logs')
      }

      return response.json()
    },
    placeholderData: keepPreviousData, // ignore: legitimate TanStack Query caching
    staleTime: 2 * 60 * 1000, // 2 minutes for logs
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

interface SMSLogsResponse {
  success: boolean
  data: SMSLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
