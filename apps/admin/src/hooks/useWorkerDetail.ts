import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

interface WorkerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  organization_id: string;
}

interface WorkerStats {
  totalSms: number;
  sentSms: number;
  failedSms: number;
  smsToday: number;
  smsThisWeek: number;
}

interface WorkerDetailResponse {
  worker: WorkerData;
  stats: WorkerStats;
}

async function fetchWorkerDetail(token: string, workerId: string): Promise<WorkerDetailResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/workers/${workerId}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch worker details');
  }

  return response.json();
}

export function useWorkerDetail(workerId: string) {
  const { token } = useAuthStore();
  
  return useQuery({
    queryKey: ['worker', 'detail', workerId],
    queryFn: () => fetchWorkerDetail(token || '', workerId),
    enabled: !!token && !!workerId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });
}
