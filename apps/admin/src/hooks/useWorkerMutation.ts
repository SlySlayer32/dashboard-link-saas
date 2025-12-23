import type { DashboardStats, Worker } from '@dashboard-link/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CreateWorkerRequest {
  name: string;
  phone: string;
  email?: string;
  active?: boolean;
}

interface UpdateWorkerRequest {
  name?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

interface CreateWorkerResponse {
  worker: Worker;
  dashboard: DashboardStats;
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkerRequest): Promise<CreateWorkerResponse> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create worker');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate workers query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success(`Worker "${data.worker.name}" created successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create worker');
    },
  });
}

export function useUpdateWorker(workerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateWorkerRequest): Promise<Worker> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update worker');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update the specific worker in cache
      queryClient.setQueryData(['worker', workerId], data);
      // Invalidate workers list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success(`Worker "${data.name}" updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update worker');
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workerId: string): Promise<void> => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete worker');
      }
    },
    onSuccess: (_, workerId) => {
      // Remove worker from cache
      queryClient.removeQueries({ queryKey: ['worker', workerId] });
      // Invalidate workers list
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete worker');
    },
  });
}
