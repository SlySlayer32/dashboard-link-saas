import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User interface
interface User {
  id: string
  email: string
  name: string
}

// Auth state interface
interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  register: (userData: { email: string; password: string; name: string; organizationName: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  clearError: () => void
  checkAuth: () => Promise<void>
}

// Mock auth service for now (since we don't have the full auth service implemented)
const mockAuthService = {
  login: async (credentials: { email: string; password: string }) => {
    // Mock successful login
    return {
      success: true,
      user: { id: '1', email: credentials.email, name: 'Test User' },
      tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
      error: undefined
    }
  },

  register: async (userData: { email: string; password: string; name: string; organizationName: string }) => {
    // Mock successful registration
    return {
      success: true,
      user: { id: '1', email: userData.email, name: userData.name },
      error: undefined
    }
  },

  logout: async () => {
    return { success: true }
  }
}

// Create Zustand store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })

        try {
          const result = await mockAuthService.login(credentials)

          if (result.success && result.user && result.tokens) {
            set({
              user: result.user,
              token: result.tokens.accessToken,
              refreshToken: result.tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: result.error || 'Login failed'
            })
            return { success: false, error: result.error }
          }
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'An unexpected error occurred'
          })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await mockAuthService.register(userData)

          if (result.success && result.user) {
            // Auto-login after registration
            const loginResult = await mockAuthService.login({
              email: userData.email,
              password: userData.password
            })

            if (loginResult.success && loginResult.user && loginResult.tokens) {
              set({
                user: loginResult.user,
                token: loginResult.tokens.accessToken,
                refreshToken: loginResult.tokens.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              return { success: true }
            }
          }

          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: result.error || 'Registration failed'
          })
          return { success: false, error: result.error }
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'An unexpected error occurred'
          })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      clearError: () => {
        set({ error: null })
      },

      checkAuth: async () => {
        const { token } = get()
        if (token) {
          // For now, just set authenticated if token exists
          // In real implementation, validate token with server
          set({ isAuthenticated: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Individual hooks for specific state pieces
export const useAuth = () => useAuthStore((state) => state.user)
export const useAuthIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  clearError: state.clearError,
  checkAuth: state.checkAuth
}))

// Development helper for quick login
export const useDevLogin = () => {
  const { login } = useAuthActions()
  
  return {
    devLogin: () => login({
      email: 'dev@example.com',
      password: 'dev-password'
    })
  }
}

export type AuthStateType = AuthState
