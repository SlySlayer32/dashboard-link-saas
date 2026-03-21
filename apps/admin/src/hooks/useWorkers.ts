import type {
  CreateWorkerInput as CreateWorkerDTO,
  UpdateWorkerInput as UpdateWorkerDTO
} from '@dashboard-link/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { createWorker, deleteWorker, getWorker, getWorkers, updateWorker } from '../lib/api/workers'

export function useWorkers() {
  const query = useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
  })

  return {
    workers: query.data?.workers ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useWorker(workerId: string) {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => getWorker(workerId),
    enabled: Boolean(workerId),
  })
}

export function useDebouncedSearch(delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState('')
  const [value, setValue] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return {
    searchValue: debouncedValue,
    setSearchValue: setValue,
    immediateValue: value,
  }
}

export function useWorkerMutations() {
  const queryClient = useQueryClient()

  const createWorkerMutation = useMutation({
    mutationFn: (data: CreateWorkerDTO) => createWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast.success('Worker created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create worker')
    },
  })

  const updateWorkerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkerDTO & { updatedAt?: string } }) =>
      updateWorker(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['worker', variables.id] })
      toast.success('Worker updated successfully')
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === 'CONCURRENT_EDIT') {
        toast.error('Worker was updated by another user. Please refresh and try again.')
        return
      }

      toast.error(error.message || 'Failed to update worker')
    },
  })

  const deleteWorkerMutation = useMutation({
    mutationFn: (id: string) => deleteWorker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast.success('Worker deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete worker')
    },
  })

  return {
    createWorker: createWorkerMutation,
    updateWorker: updateWorkerMutation,
    deleteWorker: deleteWorkerMutation,
  }
}
