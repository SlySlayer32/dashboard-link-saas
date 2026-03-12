/**
 * Worker API Client
 *
 * Type-safe API client for worker management endpoints
 */

import type { Worker, CreateWorkerDTO, UpdateWorkerDTO } from '@dashboard-link/shared'

const API_BASE = '/api/v1'

export interface WorkerListResponse {
  workers: Worker[]
}

export interface WorkerResponse {
  worker: Worker
  dashboard?: {
    id: string
    name: string
    workerId: string
    organizationId: string
    active: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface ApiError {
  error: string
  field?: string
  code?: string
}

/**
 * Get all workers for the authenticated user's organization
 */
export async function getWorkers(): Promise<Worker[]> {
  const response = await fetch(`${API_BASE}/workers`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error || 'Failed to fetch workers')
  }

  return response.json()
}

/**
 * Get a single worker by ID
 */
export async function getWorker(id: string): Promise<Worker> {
  const response = await fetch(`${API_BASE}/workers/${id}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error || 'Failed to fetch worker')
  }

  return response.json()
}

/**
 * Create a new worker
 */
export async function createWorker(data: CreateWorkerDTO): Promise<WorkerResponse> {
  const response = await fetch(`${API_BASE}/workers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()

    // Handle specific error cases
    if (response.status === 409) {
      throw new Error(error.error || 'Phone number already in use')
    }

    throw new Error(error.error || 'Failed to create worker')
  }

  return response.json()
}

/**
 * Update an existing worker
 */
export async function updateWorker(
  id: string,
  data: UpdateWorkerDTO & { updatedAt?: string }
): Promise<Worker> {
  const response = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()

    // Handle specific error cases
    if (response.status === 409) {
      if (error.code === 'CONCURRENT_EDIT') {
        const concurrentError = new Error(error.error || 'Worker was updated by another user')
        ;(concurrentError as any).code = 'CONCURRENT_EDIT'
        throw concurrentError
      }
      throw new Error(error.error || 'Phone number already in use')
    }

    if (response.status === 404) {
      throw new Error('Worker not found')
    }

    throw new Error(error.error || 'Failed to update worker')
  }

  return response.json()
}

/**
 * Soft delete a worker
 */
export async function deleteWorker(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()

    if (response.status === 404) {
      throw new Error('Worker not found')
    }

    throw new Error(error.error || 'Failed to delete worker')
  }
}

/**
 * Search workers by query
 */
export async function searchWorkers(query: string, limit = 10): Promise<Worker[]> {
  const response = await fetch(
    `${API_BASE}/workers/search/${encodeURIComponent(query)}?limit=${limit}`,
    {
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error || 'Failed to search workers')
  }

  return response.json()
}

/**
 * Get active workers only
 */
export async function getActiveWorkers(): Promise<Worker[]> {
  const response = await fetch(`${API_BASE}/workers/active/list`, {
    credentials: 'include',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error || 'Failed to fetch active workers')
  }

  return response.json()
}
