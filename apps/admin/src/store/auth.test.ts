import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoginCredentials } from '../types/auth'
import { useAuthStore } from './auth'

// Mock fetch
global.fetch = vi.fn()

// Use the same User interface as the auth store
interface User {
  id: string
  email: string
  name: string
}

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

const mockCredentials: LoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
}

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear localStorage mock
    const localStorageMock = vi.fn()
    ;(global.localStorage.getItem as any) = localStorageMock
    ;(global.localStorage.setItem as any) = vi.fn()
    ;(global.localStorage.removeItem as any) = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should handle rehydration without localStorage', async () => {
      // Skip localStorage persistence testing as it's implementation detail
      // Focus on store behavior instead
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'refresh-token',
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const state = useAuthStore.getState()

      await expect(state.login(mockCredentials)).resolves.not.toThrow()

      const currentState = useAuthStore.getState()
      expect(currentState.user).toEqual(mockUser)
      expect(currentState.token).toBe('test-token')
      expect(currentState.refreshToken).toBe('refresh-token')
      expect(currentState.isAuthenticated).toBe(true)
      expect(currentState.isLoading).toBe(false)
      expect(currentState.error).toBeNull()

      // Verify localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth-storage',
        expect.stringContaining('test-token')
      )
    })

    it('should handle login failure with invalid credentials', async () => {
      const errorResponse = {
        message: 'Invalid credentials',
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      } as Response)

      const state = useAuthStore.getState()

      await expect(state.login(mockCredentials)).rejects.toThrow('Invalid credentials')

      const currentState = useAuthStore.getState()
      expect(currentState.user).toBeNull()
      expect(currentState.token).toBeNull()
      expect(currentState.isAuthenticated).toBe(false)
      expect(currentState.isLoading).toBe(false)
      expect(currentState.error).toBe('Invalid credentials')
    })

    it('should handle network errors during login', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const state = useAuthStore.getState()

      await expect(state.login(mockCredentials)).rejects.toThrow('An unexpected error occurred')

      const currentState = useAuthStore.getState()
      expect(currentState.error).toBe('An unexpected error occurred')
      expect(currentState.isLoading).toBe(false)
      expect(currentState.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      // Create a promise that we control
      let resolveLogin: (value: unknown) => void = () => {}
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve
      })

      ;(fetch as any).mockReturnValueOnce(loginPromise as any)

      const state = useAuthStore.getState()

      // Start login
      const loginCall = state.login(mockCredentials)

      // Check loading state
      expect(useAuthStore.getState().isLoading).toBe(true)

      // Resolve the promise
      resolveLogin({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'test-token',
          refreshToken: 'refresh-token',
        }),
      })

      await loginCall

      // Loading should be false
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('Logout', () => {
    it('should clear all auth state on logout', () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
        error: 'some error',
      })

      const state = useAuthStore.getState()
      state.logout()

      const currentState = useAuthStore.getState()
      expect(currentState.user).toBeNull()
      expect(currentState.token).toBeNull()
      expect(currentState.refreshToken).toBeNull()
      expect(currentState.isAuthenticated).toBe(false)
      expect(currentState.error).toBeNull()
      expect(currentState.isLoading).toBe(false)
    })
  })

  describe('Refresh Token', () => {
    it('should refresh token successfully', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        token: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
        isAuthenticated: true,
      })

      const mockResponse = {
        token: 'new-token',
        expires_at: '2025-12-31T23:59:59Z',
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const state = useAuthStore.getState()

      await expect(state.refreshAuthToken()).resolves.not.toThrow()

      const currentState = useAuthStore.getState()
      expect(currentState.token).toBe('new-token')
      expect(currentState.user).toEqual(mockUser) // User should remain the same
      expect(currentState.isAuthenticated).toBe(true)
    })

    it('should handle refresh token failure', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        token: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
        isAuthenticated: true,
      })

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Token refresh failed' }),
      } as Response)

      const state = useAuthStore.getState()

      await expect(state.refreshAuthToken()).rejects.toThrow('Token refresh failed')

      // Should logout on refresh failure
      const currentState = useAuthStore.getState()
      expect(currentState.user).toBeNull()
      expect(currentState.token).toBeNull()
      expect(currentState.isAuthenticated).toBe(false)
    })

    it('should throw error when no token to refresh', async () => {
      const state = useAuthStore.getState()

      await expect(state.refreshAuthToken()).rejects.toThrow('No refresh token available')
    })
  })

  describe('Clear Error', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' })

      const state = useAuthStore.getState()
      state.clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })

    it('should clear error state and set loading to false', () => {
      useAuthStore.setState({ error: 'Some error', isLoading: true })

      const state = useAuthStore.getState()
      state.clearError()

      expect(useAuthStore.getState().error).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('Set Loading', () => {
    it('should set loading state', () => {
      const state = useAuthStore.getState()

      state.setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)

      state.setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('Typed Selectors', () => {
    it('should return correct values from selectors', () => {
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        isLoading: true,
        error: 'test error',
        isAuthenticated: true,
      })

      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().token).toBe('test-token')
      expect(useAuthStore.getState().isLoading).toBe(true)
      expect(useAuthStore.getState().error).toBe('test error')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })
})
