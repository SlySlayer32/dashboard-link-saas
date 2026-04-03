import type { SMSDashboardLinkRequest, SMSDashboardLinkResponse } from '@dashboard-link/shared'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { api } from '../lib/api'

function parseExpiryHours(expiresIn: string) {
  const hours = Number.parseInt(expiresIn.replace('h', ''), 10)
  return Number.isNaN(hours) ? 6 : hours
}

export function useSendDashboardLink() {
  return useMutation({
    mutationFn: async (data: SMSDashboardLinkRequest): Promise<SMSDashboardLinkResponse> => {
      const response = await api.post<SMSDashboardLinkResponse>('/api/v1/sms/send-dashboard-link', {
        workerId: data.workerId,
        expiryHours: parseExpiryHours(data.expiresIn),
        message: data.customMessage?.trim() || undefined,
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Dashboard link sent successfully!')
      } else {
        toast.error('Failed to send dashboard link')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send dashboard link')
    },
  })
}

export function useSendSMS() {
  return useMutation({
    mutationFn: async ({ workerId, to, message }: { workerId?: string; to?: string; message: string }) => {
      const response = await api.post('/api/v1/sms/send', {
        workerId,
        to,
        message,
      })

      return response.data
    },
    onSuccess: () => {
      toast.success('SMS sent successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send SMS')
    },
  })
}
