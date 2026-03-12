export interface Worker {
  id: string
  organizationId: string
  name: string
  phone: string // E.164 format: +61412345678
  email?: string
  active: boolean
  deletedAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateWorkerDTO {
  name: string
  phone: string
  email?: string
  metadata?: Record<string, unknown>
}

export interface UpdateWorkerDTO {
  name?: string
  phone?: string
  email?: string
  active?: boolean
  metadata?: Record<string, unknown>
}

// API Request/Response Types
export interface CreateWorkerRequest {
  name: string
  phone: string // Accepts AU formats: "04XX XXX XXX", "0412345678", "+614XXXXXXXX"
}

export interface UpdateWorkerRequest {
  name?: string
  phone?: string // Accepts AU formats
}

export interface WorkerListResponse {
  workers: Worker[]
  total: number
}

export interface WorkerResponse {
  worker: Worker
}
