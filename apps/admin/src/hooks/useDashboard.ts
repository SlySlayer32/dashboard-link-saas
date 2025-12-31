import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'

const DEV_MODE = import.meta.env.MODE === 'development'

interface DashboardStatsData {
  totalWorkers: number
  activeWorkers: number
  inactiveWorkers: number
  smsToday: number
  smsThisWeek: number
}

interface ActivityItem {
  id: string
  message: string
  status: string
  created_at: string
  worker_id: string
  workers: {
    name: string
    phone: string
  }
}

interface DashboardResponse {
  stats: DashboardStatsData
  recentActivity: ActivityItem[]
}

async function fetchDashboardStats(token: string): Promise<DashboardResponse> {
  // Development mode mock data
  if (DEV_MODE) {
    return {
      stats: {
        totalWorkers: 25,
        activeWorkers: 18,
        inactiveWorkers: 7,
        smsToday: 142,
        smsThisWeek: 892,
      },
      recentActivity: [
        {
          id: '1',
          message: 'John Doe completed task',
          status: 'completed',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          worker_id: 'worker-1',
          workers: {
            name: 'John Doe',
            phone: '+1234567890',
          },
        },
        {
          id: '2',
          message: 'Jane Smith started new task',
          status: 'in_progress',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          worker_id: 'worker-2',
          workers: {
            name: 'Jane Smith',
            phone: '+0987654321',
          },
        },
        {
          id: '3',
          message: 'SMS sent to customer group',
          status: 'sent',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          worker_id: 'worker-3',
          workers: {
            name: 'Mike Johnson',
            phone: '+1122334455',
          },
        },
      ],
    }
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }

  return response.json()
}

export function useDashboard() {
  const { token } = useAuthStore()

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetchDashboardStats(token || ''),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: !!token,
  })
}
