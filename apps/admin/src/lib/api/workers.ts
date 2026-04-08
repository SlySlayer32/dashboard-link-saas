/**
 * Worker API Client
 *
 * Type-safe API client for worker management endpoints
 */

import type {
  CreateWorkerInput as CreateWorkerDTO,
  UpdateWorkerInput as UpdateWorkerDTO,
  Worker,
} from '@dashboard-link/shared'
import { api } from '../api'

// Local response types since they're not exported from shared
export interface WorkerListResponse {
  workers: Worker[]
  total: number
}

export interface WorkerResponse {
  worker: Worker
}

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/api/v1'

export interface ApiError {
  error: string
  field?: string
  code?: string
}

function extractApiError(error: unknown, fallback: string): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
  ) {
    return new Error((error as { response: { data: { error: string } } }).response.data.error)
  }

  return new Error(fallback)
}

/**
 * Get all workers for the authenticated user's organization
 */
export async function getWorkers(): Promise<WorkerListResponse> {
  try {
    const response = await api.get<WorkerListResponse>(`${API_BASE}/workers`)
    return response.data
  } catch (error) {
    throw extractApiError(error, 'Failed to fetch workers')
  }
}

/**
 * Get a single worker by ID
 */
export async function getWorker(id: string): Promise<Worker> {
  try {
    const response = await api.get<WorkerResponse>(`${API_BASE}/workers/${id}`)
    return response.data.worker
  } catch (error) {
    throw extractApiError(error, 'Failed to fetch worker')
  }
}

/**
 * Create a new worker
 */
export async function createWorker(data: CreateWorkerDTO): Promise<WorkerResponse> {
  try {
    const response = await api.post<WorkerResponse>(`${API_BASE}/workers`, data)
    return response.data
  } catch (error) {
    throw extractApiError(error, 'Failed to create worker')
  }
}

/**
 * Update an existing worker
 */
export async function updateWorker(
  id: string,
  data: UpdateWorkerDTO & { updatedAt?: string }
): Promise<Worker> {
  try {
    const response = await api.put<WorkerResponse>(`${API_BASE}/workers/${id}`, data)
    return response.data.worker
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number; data?: ApiError } }).response?.status === 409 &&
      (error as { response?: { data?: ApiError } }).response?.data?.code === 'CONCURRENT_EDIT'
    ) {
      const concurrentError = new Error('Worker was updated by another user') as Error & {
        code?: string
      }
      concurrentError.code = 'CONCURRENT_EDIT'
      throw concurrentError
    }

    throw extractApiError(error, 'Failed to update worker')
  }
}

/**
 * Soft delete a worker
 */
export async function deleteWorker(id: string): Promise<void> {
  try {
    await api.delete(`${API_BASE}/workers/${id}`)
  } catch (error) {
    throw extractApiError(error, 'Failed to delete worker')
  }
}

/**
 * Search workers by query
 */
export async function searchWorkers(query: string, limit = 10): Promise<Worker[]> {
  try {
    const response = await api.get<Worker[]>(
      `${API_BASE}/workers/search/${encodeURIComponent(query)}?limit=${limit}`
    )
    return response.data
  } catch (error) {
    throw extractApiError(error, 'Failed to search workers')
  }
}

/**
 * Get active workers only
 */
export async function getActiveWorkers(): Promise<Worker[]> {
  try {
    const response = await api.get<Worker[]>(`${API_BASE}/workers/active/list`)
    return response.data
  } catch (error) {
    throw extractApiError(error, 'Failed to fetch active workers')
  }
}
