import { createAuthService } from '@dashboard-link/auth'
import axios, { AxiosInstance } from 'axios'

// Initialize auth service
const authService = createAuthService('supabase', {
  providerConfig: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  jwtSecret: import.meta.env.VITE_JWT_SECRET || 'default-secret',
  tokenExpiry: 3600,
  refreshTokenExpiry: 2592000
})

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            const result = await authService.refreshToken(refreshToken)
            
            if (result.success && result.tokens) {
              localStorage.setItem('token', result.tokens.accessToken)
              localStorage.setItem('refreshToken', result.tokens.refreshToken)
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${result.tokens.accessToken}`
              return client(originalRequest)
            }
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Auth API client
export const authApiClient = createApiClient()

// Auth API methods
export const authApi = {
  // Login
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await authApiClient.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Register
  register: async (userData: { email: string; password: string; name: string; organizationName: string }) => {
    try {
      const response = await authApiClient.post('/auth/register', userData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await authApiClient.post('/auth/logout')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await authApiClient.post('/auth/refresh', { refresh_token: refreshToken })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get profile
  getProfile: async () => {
    try {
      const response = await authApiClient.get('/auth/me')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      const response = await authApiClient.post('/auth/reset-password', { email })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authApiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Generic API client for other endpoints
export const apiClient = createApiClient()

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Response type utility
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export default authApiClient
