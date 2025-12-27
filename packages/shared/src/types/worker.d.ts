export interface Worker {
  id: string
  organization_id: string
  name: string
  phone: string
  email?: string
  active: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}
export interface WorkerToken {
  id: string
  worker_id: string
  token: string
  expires_at: string
  created_at: string
  used_at?: string
  revoked: boolean
}
//# sourceMappingURL=worker.d.ts.map
