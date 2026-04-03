import type { ScheduleItem } from '@dashboard-link/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CreateScheduleItemRequest {
  title: string
  startTime: string
  endTime: string
  location?: string
  description?: string
}

interface UpdateScheduleItemRequest {
  title?: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string
}

interface ScheduleItemsResponse {
  data: ScheduleItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchScheduleItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
): Promise<ScheduleItemsResponse> {
  const response = await api.get<ScheduleItemsResponse>(`/api/v1/workers/${workerId}/schedule-items`, {
    params: { startDate, endDate, page, limit },
  })

  return response.data
}

async function createScheduleItem(
  workerId: string,
  data: CreateScheduleItemRequest
): Promise<ScheduleItem> {
  const response = await api.post<ScheduleItem>(`/api/v1/workers/${workerId}/schedule-items`, data)
  return response.data
}

async function updateScheduleItem(
  workerId: string,
  itemId: string,
  data: UpdateScheduleItemRequest
): Promise<ScheduleItem> {
  const response = await api.put<ScheduleItem>(
    `/api/v1/workers/${workerId}/schedule-items/${itemId}`,
    data
  )
  return response.data
}

async function deleteScheduleItem(workerId: string, itemId: string): Promise<void> {
  await api.delete(`/api/v1/workers/${workerId}/schedule-items/${itemId}`)
}

export function useScheduleItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['schedule-items', workerId, startDate, endDate, page, limit],
    queryFn: () => fetchScheduleItems(workerId, startDate, endDate, page, limit),
    enabled: !!workerId,
  })
}

export function useCreateScheduleItem(workerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateScheduleItemRequest) => createScheduleItem(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items', workerId],
      })
    },
  })
}

export function useUpdateScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workerId,
      itemId,
      data,
    }: {
      workerId: string
      itemId: string
      data: UpdateScheduleItemRequest
    }) => updateScheduleItem(workerId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items', variables.workerId],
      })
    },
  })
}

export function useDeleteScheduleItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workerId, itemId }: { workerId: string; itemId: string }) =>
      deleteScheduleItem(workerId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items', variables.workerId],
      })
    },
  })
}

export type { CreateScheduleItemRequest, ScheduleItem, UpdateScheduleItemRequest }
