import type { SMSDashboardLinkRequest, SMSDashboardLinkResponse } from '@dashboard-link/shared'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useSendDashboardLink() {
  return useMutation({
    mutationFn: async (data: SMSDashboardLinkRequest): Promise<SMSDashboardLinkResponse> => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE}/sms/send-dashboard-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to send dashboard link')
      }

      return response.json()
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
    mutationFn: async ({ workerId, message }: { workerId: string; message: string }) => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workerId, message }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to send SMS')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('SMS sent successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send SMS')
    },
  })
}
