import type { TaskItem } from '@dashboard-link/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CreateTaskItemRequest {
  title: string
  description?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed'
}

interface UpdateTaskItemRequest {
  title?: string
  description?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'completed'
}

interface TaskItemsResponse {
  data: TaskItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchTaskItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
): Promise<TaskItemsResponse> {
  const response = await api.get<TaskItemsResponse>(`/api/v1/workers/${workerId}/task-items`, {
    params: { startDate, endDate, page, limit },
  })

  return response.data
}

async function createTaskItem(workerId: string, data: CreateTaskItemRequest): Promise<TaskItem> {
  const response = await api.post<TaskItem>(`/api/v1/workers/${workerId}/task-items`, data)
  return response.data
}

async function updateTaskItem(
  workerId: string,
  itemId: string,
  data: UpdateTaskItemRequest
): Promise<TaskItem> {
  const response = await api.put<TaskItem>(`/api/v1/workers/${workerId}/task-items/${itemId}`, data)
  return response.data
}

async function deleteTaskItem(workerId: string, itemId: string): Promise<void> {
  await api.delete(`/api/v1/workers/${workerId}/task-items/${itemId}`)
}

export function useTaskItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['task-items', workerId, startDate, endDate, page, limit],
    queryFn: () => fetchTaskItems(workerId, startDate, endDate, page, limit),
    enabled: !!workerId,
  })
}

export function useCreateTaskItem(workerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskItemRequest) => createTaskItem(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task-items', workerId],
      })
    },
  })
}

export function useUpdateTaskItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workerId,
      itemId,
      data,
    }: {
      workerId: string
      itemId: string
      data: UpdateTaskItemRequest
    }) => updateTaskItem(workerId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['task-items', variables.workerId],
      })
    },
  })
}

export function useDeleteTaskItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workerId, itemId }: { workerId: string; itemId: string }) =>
      deleteTaskItem(workerId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['task-items', variables.workerId],
      })
    },
  })
}

export type { CreateTaskItemRequest, TaskItem, UpdateTaskItemRequest }
