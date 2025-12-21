import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import type { Worker } from '@dashboard-link/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WorkersResponse {
  data: Worker[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseWorkersOptions {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export function useWorkers(options: UseWorkersOptions = {}) {
  const { search = '', status = 'all', page = 1, limit = 20 } = options;
  const queryClient = useQueryClient();

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    
    if (search.trim()) {
      params.append('search', search.trim());
    }
    
    if (status !== 'all') {
      params.append('active', status === 'active' ? 'true' : 'false');
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return params.toString();
  }, [search, status, page, limit]);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workers', queryString],
    queryFn: async (): Promise<WorkersResponse> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE}/workers${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch workers');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch next page
  useEffect(() => {
    if (data?.pagination && page < data.pagination.totalPages) {
      const nextParams = new URLSearchParams(queryString);
      nextParams.set('page', (page + 1).toString());
      
      queryClient.prefetchQuery({
        queryKey: ['workers', nextParams.toString()],
        queryFn: async (): Promise<WorkersResponse> => {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(
            `${API_BASE}/workers?${nextParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch workers');
          }

          return response.json();
        },
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [data, page, queryString, queryClient]);

  return {
    workers: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  };
}

// Hook for debounced search
export function useDebouncedSearch(delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {
    searchValue: debouncedValue,
    setSearchValue: setValue,
    immediateValue: value,
  };
}

// Hook for getting a single worker
export function useWorker(workerId: string) {
  return useQuery({
    queryKey: ['worker', workerId],
    queryFn: async (): Promise<Worker> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch worker');
      }

      return response.json();
    },
    enabled: !!workerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
