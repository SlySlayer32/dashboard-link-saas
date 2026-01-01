import { createAuthService } from '@dashboard-link/auth'
import { configureStore } from '@reduxjs/toolkit'

// Initialize auth service
const authService = createAuthService('supabase', {
  providerConfig: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  jwtSecret: import.meta.env.VITE_JWT_SECRET || 'default-secret',
  tokenExpiry: 3600,
  refreshTokenExpiry: 2592000,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  },
  sessionConfig: {
    maxSessions: 5,
    idleTimeout: 30,
    absoluteTimeout: 480,
    secureCookies: true,
    sameSite: 'strict'
  }
})

// Auth slice
interface AuthState {
  user: any | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null
}

// Auth actions
const authSlice = {
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state: AuthState) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state: AuthState, action: { payload: { user: any; token: string; refreshToken: string } }) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      state.isLoading = false
      state.error = null
      
      // Store tokens in localStorage
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
    loginFailure: (state: AuthState, action: { payload: string }) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = action.payload
      
      // Clear tokens from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    logout: (state: AuthState) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
      
      // Clear tokens from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    clearError: (state: AuthState) => {
      state.error = null
    }
  }
}

// Create store
export const store = configureStore({
  reducer: {
    auth: authSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

// Auth thunks
export const authActions = {
  login: (credentials: { email: string; password: string }) => async (dispatch: any) => {
    dispatch(authSlice.reducers.loginStart())
    
    try {
      const result = await authService.login(credentials)
      
      if (result.success && result.user && result.tokens) {
        dispatch(authSlice.reducers.loginSuccess({
          user: result.user,
          token: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }))
        return { success: true }
      } else {
        dispatch(authSlice.reducers.loginFailure(result.error || 'Login failed'))
        return { success: false, error: result.error }
      }
    } catch (error) {
      dispatch(authSlice.reducers.loginFailure('An unexpected error occurred'))
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  register: (userData: { email: string; password: string; name: string; organizationName: string }) => async (dispatch: any) => {
    dispatch(authSlice.reducers.loginStart())
    
    try {
      const result = await authService.register(userData)
      
      if (result.success && result.user) {
        // Auto-login after registration
        const loginResult = await authService.login({
          email: userData.email,
          password: userData.password
        })
        
        if (loginResult.success && loginResult.user && loginResult.tokens) {
          dispatch(authSlice.reducers.loginSuccess({
            user: loginResult.user,
            token: loginResult.tokens.accessToken,
            refreshToken: loginResult.tokens.refreshToken
          }))
          return { success: true }
        }
      }
      
      dispatch(authSlice.reducers.loginFailure(result.error || 'Registration failed'))
      return { success: false, error: result.error }
    } catch (error) {
      dispatch(authSlice.reducers.loginFailure('An unexpected error occurred'))
      return { success: false, error: 'An unexpected error occurred' }
    }
  },

  logout: () => async (dispatch: any) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        await authService.logout(token)
      } catch (error) {
        // Continue with logout even if server call fails
        console.error('Logout error:', error)
      }
    }
    
    dispatch(authSlice.reducers.logout())
  },

  refreshToken: () => async (dispatch: any) => {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      dispatch(authSlice.reducers.logout())
      return { success: false, error: 'No refresh token available' }
    }
    
    try {
      const result = await authService.refreshToken(refreshToken)
      
      if (result.success && result.tokens) {
        dispatch(authSlice.reducers.loginSuccess({
          user: store.getState().auth.user,
          token: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }))
        return { success: true }
      } else {
        dispatch(authSlice.reducers.logout())
        return { success: false, error: result.error }
      }
    } catch (error) {
      dispatch(authSlice.reducers.logout())
      return { success: false, error: 'Token refresh failed' }
    }
  },

  getProfile: () => async (dispatch: any) => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      return { success: false, error: 'No token available' }
    }
    
    try {
      const validation = await authService.validateToken(token)
      
      if (validation.valid && validation.user) {
        dispatch(authSlice.reducers.loginSuccess({
          user: validation.user,
          token: token,
          refreshToken: localStorage.getItem('refreshToken') || ''
        }))
        return { success: true }
      } else {
        dispatch(authSlice.reducers.logout())
        return { success: false, error: 'Invalid token' }
      }
    } catch (error) {
      dispatch(authSlice.reducers.logout())
      return { success: false, error: 'Token validation failed' }
    }
  }
}

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
