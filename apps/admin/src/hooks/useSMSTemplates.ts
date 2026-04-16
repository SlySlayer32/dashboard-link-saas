import type {
  SMSTemplate,
  SMSTemplateCreateRequest,
  SMSTemplatePreviewRequest,
  SMSTemplatePreviewResponse,
  SMSTemplateUpdateRequest,
} from '@dashboard-link/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { api } from '../lib/api'

export function useSMSTemplates() {
  return useQuery({
    queryKey: ['sms-templates'],
    queryFn: async (): Promise<SMSTemplate[]> => {
      const response = await api.get<{ success: boolean; data: SMSTemplate[] }>(
        '/api/v1/sms/templates'
      )
      return response.data.data || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateSMSTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SMSTemplateCreateRequest): Promise<SMSTemplate> => {
      const response = await api.post<{ success: boolean; data: SMSTemplate }>(
        '/api/v1/sms/templates',
        input
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })
}

export function useUpdateSMSTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: SMSTemplateUpdateRequest
    }): Promise<SMSTemplate> => {
      const response = await api.put<{ success: boolean; data: SMSTemplate }>(
        `/api/v1/sms/templates/${id}`,
        input
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template')
    },
  })
}

export function useDeleteSMSTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/api/v1/sms/templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete template')
    },
  })
}

export function useSetDefaultSMSTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<SMSTemplate> => {
      const response = await api.post<{ success: boolean; data: SMSTemplate }>(
        `/api/v1/sms/templates/${id}/set-default`
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Default template updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update default template')
    },
  })
}

export function usePreviewSMSTemplate() {
  return useMutation({
    mutationFn: async (
      input: SMSTemplatePreviewRequest
    ): Promise<SMSTemplatePreviewResponse['data']> => {
      const response = await api.post<SMSTemplatePreviewResponse>(
        '/api/v1/sms/templates/preview',
        input
      )
      return response.data.data
    },
  })
}
