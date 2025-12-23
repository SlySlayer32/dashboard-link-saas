import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

interface DashboardStatsData {
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  smsToday: number;
  smsThisWeek: number;
}

interface ActivityItem {
  id: string;
  message: string;
  status: string;
  created_at: string;
  worker_id: string;
  workers: {
    name: string;
    phone: string;
  };
}

interface DashboardResponse {
  stats: DashboardStatsData;
  recentActivity: ActivityItem[];
}

async function fetchDashboardStats(token: string): Promise<DashboardResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  return response.json();
}

export function useDashboard() {
  const { token } = useAuthStore();
  
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetchDashboardStats(token || ''),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    enabled: !!token,
  });
}
