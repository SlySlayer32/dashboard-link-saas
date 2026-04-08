import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setPreviewMode } from '../lib/preview'
import { supabase } from '../lib/supabase'

// User interface
interface User {
  id: string
  email: string
  name: string
  organization_id?: string
  role?: 'admin' | 'owner'
}

// Auth state interface
interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  expiresAt: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: {
    email: string
    password: string
  }) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    email: string
    password: string
    name: string
    organizationName: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  clearError: () => void
  checkAuth: () => Promise<void>
  refreshAuthToken: () => Promise<void>
  setLoading: (loading: boolean) => void
  devBypass: () => void
}

// Create Zustand store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        setPreviewMode(false)

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message,
            })
            return { success: false, error: error.message }
          }

          if (data.user && data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email || '',
              organization_id: data.user.user_metadata?.organization_id,
              role: data.user.user_metadata?.role || 'admin',
            }

            set({
              user,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at
                ? new Date(data.session.expires_at * 1000).toISOString()
                : null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            // Store token for API calls
            localStorage.setItem('auth_token', data.session.access_token)
            localStorage.setItem('sb-access-token', data.session.access_token)

            return { success: true }
          }

          set({ isLoading: false, error: 'Invalid response from auth service' })
          return { success: false, error: 'Invalid response from auth service' }
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'An unexpected error occurred',
          })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        setPreviewMode(false)

        try {
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                name: userData.name,
                organization_name: userData.organizationName,
              },
            },
          })

          if (error) {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message,
            })
            return { success: false, error: error.message }
          }

          if (data.user && data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: userData.name,
              organization_id: data.user.user_metadata?.organization_id,
              role: 'admin',
            }

            set({
              user,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at
                ? new Date(data.session.expires_at * 1000).toISOString()
                : null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            localStorage.setItem('auth_token', data.session.access_token)
            localStorage.setItem('sb-access-token', data.session.access_token)

            return { success: true }
          }

          // Email confirmation may be required
          set({ isLoading: false, error: null })
          return { success: true }
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'An unexpected error occurred',
          })
          return { success: false, error: 'An unexpected error occurred' }
        }
      },

      logout: () => {
        setPreviewMode(false)
        supabase.auth.signOut()
        localStorage.removeItem('auth_token')
        localStorage.removeItem('sb-access-token')
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null, isLoading: false })
      },

      refreshAuthToken: async () => {
        const { data, error } = await supabase.auth.refreshSession()

        if (error || !data.session) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
          })
          localStorage.removeItem('auth_token')
          localStorage.removeItem('sb-access-token')
          throw new Error(error?.message || 'Token refresh failed')
        }

        localStorage.setItem('auth_token', data.session.access_token)
        localStorage.setItem('sb-access-token', data.session.access_token)

        set({
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at
            ? new Date(data.session.expires_at * 1000).toISOString()
            : null,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      devBypass: () => {
        const mockUser: User = {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'admin',
          organization_id: 'dev-org-123',
        }

        setPreviewMode(true)
        localStorage.setItem('auth_token', 'dev-token-123')
        localStorage.setItem('sb-access-token', 'dev-token-123')

        set({
          user: mockUser,
          token: 'dev-token-123',
          refreshToken: 'dev-refresh-token-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      },

      checkAuth: async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          const user: User = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.name || data.session.user.email || '',
            organization_id: data.session.user.user_metadata?.organization_id,
            role: data.session.user.user_metadata?.role || 'admin',
          }

          localStorage.setItem('auth_token', data.session.access_token)
          localStorage.setItem('sb-access-token', data.session.access_token)

          set({
            user,
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at
              ? new Date(data.session.expires_at * 1000).toISOString()
              : null,
            isAuthenticated: true,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Individual hooks for specific state pieces
export const useAuth = () => useAuthStore((state) => state.user)
export const useAuthIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    register: state.register,
    logout: state.logout,
    clearError: state.clearError,
    checkAuth: state.checkAuth,
    devBypass: state.devBypass,
  }))

// Development helper for quick login
export const useDevLogin = () => {
  const { devBypass } = useAuthActions()

  return {
    devLogin: () => devBypass(),
  }
}

export type AuthStateType = AuthState
