import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

interface ScheduleItem {
  id: string;
  worker_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CreateScheduleItemRequest {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

interface UpdateScheduleItemRequest {
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
}

interface ScheduleItemsResponse {
  data: ScheduleItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchScheduleItems(
  token: string,
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
): Promise<ScheduleItemsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/workers/${workerId}/schedule-items?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch schedule items');
  }

  return response.json();
}

async function createScheduleItem(
  token: string,
  workerId: string,
  data: CreateScheduleItemRequest
): Promise<ScheduleItem> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/workers/${workerId}/schedule-items`,
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
    throw new Error(error.error || 'Failed to create schedule item');
  }

  return response.json();
}

async function updateScheduleItem(
  token: string,
  itemId: string,
  data: UpdateScheduleItemRequest
): Promise<ScheduleItem> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/schedule-items/${itemId}`,
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
    throw new Error(error.error || 'Failed to update schedule item');
  }

  return response.json();
}

async function deleteScheduleItem(token: string, itemId: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/schedule-items/${itemId}`,
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
    throw new Error(error.error || 'Failed to delete schedule item');
  }
}

export function useScheduleItems(
  workerId: string,
  startDate?: string,
  endDate?: string,
  page = 1,
  limit = 20
) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['schedule-items', workerId, startDate, endDate, page, limit],
    queryFn: () =>
      fetchScheduleItems(token || '', workerId, startDate, endDate, page, limit),
    enabled: !!token && !!workerId,
  });
}

export function useCreateScheduleItem(workerId: string) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleItemRequest) =>
      createScheduleItem(token || '', workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items', workerId],
      });
    },
  });
}

export function useUpdateScheduleItem() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateScheduleItemRequest }) =>
      updateScheduleItem(token || '', itemId, data),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items'],
      });
    },
  });
}

export function useDeleteScheduleItem() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteScheduleItem(token || '', itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['schedule-items'],
      });
    },
  });
}

export type { CreateScheduleItemRequest, ScheduleItem, UpdateScheduleItemRequest };

