import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface WorkerAccessLog {
  id: string
  workerId: string
  tokenId: string
  accessedAt: string
  validationStatus: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

async function fetchWorkerAccessLogs(workerId: string, limit = 20): Promise<WorkerAccessLog[]> {
  const response = await api.get<{ success: boolean; data: WorkerAccessLog[] }>(
    `/api/v1/workers/${workerId}/access-logs?limit=${limit}`
  )

  return response.data.data
}

export function useWorkerAccessLogs(workerId: string, limit = 20) {
  return useQuery({
    queryKey: ['worker', 'access-logs', workerId, limit],
    queryFn: () => fetchWorkerAccessLogs(workerId, limit),
    enabled: !!workerId,
    staleTime: 60_000,
  })
}
