import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

interface TaskItem {
  id: string;
  worker_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface CreateTaskItemRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

interface UpdateTaskItemRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

interface TaskItemsResponse {
  data: TaskItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchTaskItems(
  token: string,
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
): Promise<TaskItemsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/workers/${workerId}/task-items?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch task items');
  }

  return response.json();
}

async function createTaskItem(
  token: string,
  workerId: string,
  data: CreateTaskItemRequest
): Promise<TaskItem> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/workers/${workerId}/task-items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task item');
  }

  return response.json();
}

async function updateTaskItem(
  token: string,
  itemId: string,
  data: UpdateTaskItemRequest
): Promise<TaskItem> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/task-items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task item');
  }

  return response.json();
}

async function deleteTaskItem(token: string, itemId: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/task-items/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete task item');
  }
}

export function useTaskItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['task-items', workerId, startDate, endDate, page, limit],
    queryFn: () =>
      fetchTaskItems(token || '', workerId, startDate, endDate, page, limit),
    enabled: !!token && !!workerId,
  });
}

export function useCreateTaskItem(workerId: string) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskItemRequest) =>
      createTaskItem(token || '', workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task-items', workerId],
      });
    },
  });
}

export function useUpdateTaskItem() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateTaskItemRequest }) =>
      updateTaskItem(token || '', itemId, data),
    onSuccess: (_, { _itemId }) => {
      queryClient.invalidateQueries({
        queryKey: ['task-items'],
      });
    },
  });
}

export function useDeleteTaskItem() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteTaskItem(token || '', itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['task-items'],
      });
    },
  });
}

export type { CreateTaskItemRequest, TaskItem, UpdateTaskItemRequest };

