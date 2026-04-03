import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface AdminSMSLog {
  id: string
  organizationId?: string
  workerId?: string
  to: string
  body: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  errorReason?: string
  sentAt?: string
  deliveredAt?: string
  createdAt: string
}

interface SMSLogsParams {
  page?: number
  limit?: number
  workerId?: string
  status?: AdminSMSLog['status']
  dateFrom?: string
  dateTo?: string
  search?: string
}

export function useSMSLogs(params: SMSLogsParams = {}): UseQueryResult<SMSLogsResponse> {
  const { page = 1, limit = 20, workerId, status, dateFrom, dateTo, search } = params

  return useQuery({
    queryKey: ['sms-logs', page, limit, workerId, status, dateFrom, dateTo, search],
    queryFn: async (): Promise<SMSLogsResponse> => {
      const searchParams = new URLSearchParams()
      searchParams.set('page', page.toString())
      searchParams.set('limit', limit.toString())

      // Add filters if provided
      if (workerId) searchParams.set('workerId', workerId)
      if (status) searchParams.set('status', status)
      if (dateFrom) searchParams.set('dateFrom', dateFrom)
      if (dateTo) searchParams.set('dateTo', dateTo)
      if (search) searchParams.set('search', search)

      const response = await api.get<{
        success: boolean
        data: Array<{
          id: string
          organization_id?: string
          worker_id?: string
          phone_number: string
          message_content: string
          status: AdminSMSLog['status']
          error_reason?: string
          sent_at?: string
          delivered_at?: string
          created_at: string
        }>
        pagination: SMSLogsResponse['pagination']
      }>(`/api/v1/sms/logs?${searchParams.toString()}`)

      return {
        success: response.data.success,
        data: response.data.data.map((log) => ({
          id: log.id,
          organizationId: log.organization_id,
          workerId: log.worker_id,
          to: log.phone_number,
          body: log.message_content,
          status: log.status,
          errorReason: log.error_reason,
          sentAt: log.sent_at,
          deliveredAt: log.delivered_at,
          createdAt: log.created_at,
        })),
        pagination: response.data.pagination,
      }
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
  data: AdminSMSLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
