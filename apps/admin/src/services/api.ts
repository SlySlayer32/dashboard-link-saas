import { authFetch } from '../utils/authInterceptor'

type RequestInit = globalThis.RequestInit

type ApiResponse<T = unknown> = Promise<T>

interface ApiError {
  message: string
  status?: number
  code?: string
}

type ApiResult<T> = T | ApiError

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// API client that handles authentication automatically
export const apiClient = {
  get: <T = unknown>(url: string, options?: RequestInit): ApiResponse<ApiResult<T>> =>
    authFetch(`${API_BASE_URL}${url}`, { method: 'GET', ...options }) as ApiResponse<ApiResult<T>>,

  post: <T = unknown, D = Record<string, unknown>>(
    url: string,
    data?: D,
    options?: RequestInit
  ): ApiResponse<ApiResult<T>> =>
    authFetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }) as ApiResponse<ApiResult<T>>,

  put: <T = unknown, D = Record<string, unknown>>(
    url: string,
    data?: D,
    options?: RequestInit
  ): ApiResponse<ApiResult<T>> =>
    authFetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }) as ApiResponse<ApiResult<T>>,

  patch: <T = unknown, D = Record<string, unknown>>(
    url: string,
    data?: D,
    options?: RequestInit
  ): ApiResponse<ApiResult<T>> =>
    authFetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }) as ApiResponse<ApiResult<T>>,

  delete: <T = unknown>(url: string, options?: RequestInit): ApiResponse<ApiResult<T>> =>
    authFetch(`${API_BASE_URL}${url}`, { method: 'DELETE', ...options }) as ApiResponse<
      ApiResult<T>
    >,
}
