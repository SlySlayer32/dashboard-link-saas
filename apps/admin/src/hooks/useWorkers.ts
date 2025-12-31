import type { Worker } from '@dashboard-link/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const DEV_MODE = import.meta.env.MODE === 'development'

interface WorkersResponse {
  data: Worker[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseWorkersOptions {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  limit?: number
}

export function useWorkers(options: UseWorkersOptions = {}) {
  const { search = '', status = 'all', page = 1, limit = 20 } = options
  const queryClient = useQueryClient()

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    if (search.trim()) {
      params.append('search', search.trim())
    }

    if (status !== 'all') {
      params.append('active', status === 'active' ? 'true' : 'false')
    }

    params.append('page', page.toString())
    params.append('limit', limit.toString())

    return params.toString()
  }, [search, status, page, limit])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workers', queryString],
    queryFn: async (): Promise<WorkersResponse> => {
      // Development mode mock data
      if (DEV_MODE) {
        const mockWorkers: Worker[] = [
          {
            id: 'worker-1',
            name: 'John Doe',
            phone: '+1234567890',
            email: 'john.doe@example.com',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            organization_id: 'dev-org-id',
          },
          {
            id: 'worker-2',
            name: 'Jane Smith',
            phone: '+0987654321',
            email: 'jane.smith@example.com',
            active: true,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            organization_id: 'dev-org-id',
          },
          {
            id: 'worker-3',
            name: 'Mike Johnson',
            phone: '+1122334455',
            email: 'mike.johnson@example.com',
            active: false,
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            organization_id: 'dev-org-id',
          },
        ]

        // Filter based on search and status
        let filteredWorkers = mockWorkers
        if (status === 'active') {
          filteredWorkers = mockWorkers.filter(w => w.active)
        } else if (status === 'inactive') {
          filteredWorkers = mockWorkers.filter(w => !w.active)
        }

        if (search.trim()) {
          filteredWorkers = filteredWorkers.filter(w => 
            w.name.toLowerCase().includes(search.toLowerCase()) ||
            (w.email && w.email.toLowerCase().includes(search.toLowerCase())) ||
            w.phone.includes(search)
          )
        }

        const total = filteredWorkers.length
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedWorkers = filteredWorkers.slice(startIndex, endIndex)

        return {
          data: paginatedWorkers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      }

      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const url = `${API_BASE}/workers${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch workers')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  // Prefetch next page
  useEffect(() => {
    if (data?.pagination && page < data.pagination.totalPages) {
      const nextParams = new URLSearchParams(queryString)
      nextParams.set('page', (page + 1).toString())

      queryClient.prefetchQuery({
        queryKey: ['workers', nextParams.toString()],
        queryFn: async (): Promise<WorkersResponse> => {
          const token = localStorage.getItem('auth_token')
          if (!token) {
            throw new Error('No authentication token found')
          }

          const response = await fetch(`${API_BASE}/workers?${nextParams.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to fetch workers')
          }

          return response.json()
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      })
    }
  }, [data, page, queryString, queryClient])

  return {
    workers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  }
}

// Hook for debounced search
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

// Hook for getting a single worker
export function useWorker(workerId: string) {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: async (): Promise<Worker> => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch worker')
      }

      return response.json()
    },
    enabled: !!workerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
