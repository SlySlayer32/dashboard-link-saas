import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface WorkerData {
  id: string
  name: string
  phone: string
  email?: string
  active: boolean
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
  organizationId: string
}

interface WorkerStats {
  totalSms: number
  sentSms: number
  failedSms: number
  smsToday: number
  smsThisWeek: number
}

interface WorkerAccessSummary {
  lastOpenedAt: string | null
  totalOpens: number
}

interface WorkerDetailResponse {
  worker: WorkerData
  stats: WorkerStats
  access: WorkerAccessSummary
}

async function fetchWorkerDetail(workerId: string): Promise<WorkerDetailResponse> {
  const response = await api.get<WorkerDetailResponse>(`/api/v1/workers/${workerId}/stats`)
  return response.data
}

export function useWorkerDetail(workerId: string) {
  return useQuery({
    queryKey: ['worker', 'detail', workerId],
    queryFn: () => fetchWorkerDetail(workerId),
    enabled: !!workerId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  })
}
