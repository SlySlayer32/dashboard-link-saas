import { ApiResponse, Worker, logger } from '@dashboard-link/shared'
import { UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/api-client'

// Temporary local type definitions to fix import issues
interface WorkerQuerySchema {
  page: number
  limit: number
  search?: string
  active?: boolean
  organization_id?: string
}

interface CreateWorkerSchema {
  name: string
  phone: string
  email?: string
  active?: boolean
  metadata?: Record<string, unknown>
  organization_id?: string
}

type UpdateWorkerSchema = Partial<CreateWorkerSchema>

// Types for API responses
type WorkersResponse = ApiResponse<Worker[]>
type WorkerResponse = ApiResponse<Worker>

// Query key factory
const workerKeys = {
  all: ['workers'] as const,
  lists: () => [...workerKeys.all, 'list'] as const,
  list: (query: WorkerQuerySchema) => [...workerKeys.lists(), query] as const,
  details: () => [...workerKeys.all, 'detail'] as const,
  detail: (id: string) => [...workerKeys.details(), id] as const,
}

// Get workers with pagination and filtering
export function useWorkers(
  query: WorkerQuerySchema,
  options?: Omit<UseQueryOptions<WorkersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workerKeys.list(query),
    queryFn: async (): Promise<WorkersResponse> => {
      try {
        const params = new URLSearchParams()
        params.append('page', query.page.toString())
        params.append('limit', query.limit.toString())

        if (query.search) params.append('search', query.search)
        if (query.active !== undefined) params.append('active', query.active.toString())
        if (query.organization_id) params.append('organization_id', query.organization_id)

        const response = await apiClient.get(`/workers?${params.toString()}`)
        return response.data
      } catch (error) {
        logger.error('Failed to fetch workers', error as Error, { query })
        throw error
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (
        (error as unknown as { status: number }).status >= 400 &&
        (error as unknown as { status: number }).status < 500
      )
        return false
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Get single worker by ID
export function useWorker(
  id: string,
  options?: Omit<UseQueryOptions<WorkerResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workerKeys.detail(id),
    queryFn: async (): Promise<WorkerResponse> => {
      try {
        const response = await apiClient.get(`/workers/${id}`)
        return response.data
      } catch (error) {
        logger.error('Failed to fetch worker', error as Error, { workerId: id })
        throw error
      }
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      if (
        (error as unknown as { status: number }).status >= 400 &&
        (error as unknown as { status: number }).status < 500
      )
        return false
      return failureCount < 3
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

// Create worker mutation
export function useCreateWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWorkerSchema): Promise<WorkerResponse> => {
      try {
        const response = await apiClient.post('/workers', data)
        return response.data
      } catch (error) {
        logger.error('Failed to create worker', error as Error, { data })
        throw error
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch workers list
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() })

      // Add the new worker to the cache
      queryClient.setQueryData(workerKeys.detail(data.data?.id || ''), data)

      logger.info('Worker created successfully', {
        workerId: data.data?.id || '',
        workerName: variables.name,
      })
    },
    onError: (error, variables) => {
      logger.error('Create worker mutation failed', error as Error, {
        workerName: variables.name,
      })
    },
  })
}

// Update worker mutation
export function useUpdateWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateWorkerSchema
    }): Promise<WorkerResponse> => {
      try {
        const response = await apiClient.put(`/workers/${id}`, data)
        return response.data
      } catch (error) {
        logger.error('Failed to update worker', error as Error, { workerId: id, data })
        throw error
      }
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: workerKeys.detail(id) })

      // Snapshot the previous value
      const previousWorker = queryClient.getQueryData<WorkerResponse>(workerKeys.detail(id))

      // Optimistically update to the new value
      if (previousWorker?.data) {
        queryClient.setQueryData<WorkerResponse>(workerKeys.detail(id), {
          ...previousWorker,
          data: { ...previousWorker.data, ...data },
        })
      }

      // Return a context object with the snapshotted value
      return { previousWorker }
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate
      if (context?.previousWorker) {
        queryClient.setQueryData(workerKeys.detail(variables.id), context.previousWorker)
      }

      logger.error('Update worker mutation failed', error as Error, {
        workerId: variables.id,
      })
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: workerKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() })
    },
  })
}

// Delete worker mutation
export function useDeleteWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/workers/${id}`)
      } catch (error) {
        logger.error('Failed to delete worker', error as Error, { workerId: id })
        throw error
      }
    },
    onSuccess: (_data, id) => {
      // Remove worker from cache
      queryClient.removeQueries({ queryKey: workerKeys.detail(id) })

      // Invalidate workers list
      queryClient.invalidateQueries({ queryKey: workerKeys.lists() })

      logger.info('Worker deleted successfully', { workerId: id })
    },
    onError: (error, id) => {
      logger.error('Delete worker mutation failed', error as Error, { workerId: id })
    },
  })
}

// Bulk operations
export function useBulkUpdateWorkers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      data,
    }: {
      ids: string[]
      data: UpdateWorkerSchema
    }): Promise<Worker[]> => {
      try {
        const response = await apiClient.put('/workers/bulk', { ids, data })
        return response.data.data
      } catch (error) {
        logger.error('Failed to bulk update workers', error as Error, { ids, data })
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate all worker queries
      queryClient.invalidateQueries({ queryKey: workerKeys.all })
      logger.info('Bulk update completed successfully')
    },
    onError: (error) => {
      logger.error('Bulk update failed', error as Error)
    },
  })
}

// Export query keys for external use
export { workerKeys }
