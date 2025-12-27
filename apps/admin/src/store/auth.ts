import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { LoginCredentials, User } from '../types/auth'

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000'

export interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  expiresAt: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshAuthToken: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Login failed')
          }

          const data = await response.json()

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          })
          throw error
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
        })
      },

      // Refresh token action
      refreshAuthToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          const data = await response.json()

          set({
            token: data.token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
          })
        } catch (error) {
          // If refresh fails, logout the user
          get().logout()
          throw error
        }
      },

      // Clear error action
      clearError: () => {
        set({ error: null })
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthStore) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state: AuthStore | undefined) => {
        // Check if token is expired on rehydrate
        if (state?.token && state?.expiresAt) {
          const expiresAt = new Date(state.expiresAt)
          if (expiresAt < new Date()) {
            // Token expired, clear auth state
            state.logout()
          }
        }
      },
    }
  )
)

// Export typed selectors for components
export const useAuth = () => useAuthStore()
export const useAuthUser = () => useAuthStore((state: AuthStore) => state.user)
export const useAuthToken = () => useAuthStore((state: AuthStore) => state.token)
export const useAuthIsLoading = () => useAuthStore((state: AuthStore) => state.isLoading)
export const useAuthError = () => useAuthStore((state: AuthStore) => state.error)
export const useAuthIsAuthenticated = () =>
  useAuthStore((state: AuthStore) => state.isAuthenticated)
