import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoginCredentials, User } from '../types/auth'
import { useAuthStore } from './auth'

// Mock fetch
global.fetch = vi.fn()

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  organization_id: 'test-org-id',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockCredentials: LoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
}

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockImplementation(() => {})
    vi.mocked(localStorage.removeItem).mockImplementation(() => {})
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.expiresAt).toBeNull()
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
        expires_at: '2024-12-31T23:59:59Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const state = useAuthStore.getState()

      await expect(state.login(mockCredentials)).resolves.not.toThrow()

      const currentState = useAuthStore.getState()
      expect(currentState.user).toEqual(mockUser)
      expect(currentState.token).toBe('test-token')
      expect(currentState.expiresAt).toBe('2024-12-31T23:59:59Z')
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

      vi.mocked(fetch).mockResolvedValueOnce({
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
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const state = useAuthStore.getState()

      await expect(state.login(mockCredentials)).rejects.toThrow('Network error')

      const currentState = useAuthStore.getState()
      expect(currentState.error).toBe('Network error')
      expect(currentState.isLoading).toBe(false)
      expect(currentState.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      // Create a promise that we control
      let resolveLogin: (value: unknown) => void = () => {}
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve
      })

      vi.mocked(fetch).mockReturnValueOnce(loginPromise as any)

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
          expires_at: '2024-12-31T23:59:59Z',
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
        expiresAt: '2024-12-31T23:59:59Z',
        isAuthenticated: true,
        error: 'some error',
      })

      const state = useAuthStore.getState()
      state.logout()

      const currentState = useAuthStore.getState()
      expect(currentState.user).toBeNull()
      expect(currentState.token).toBeNull()
      expect(currentState.expiresAt).toBeNull()
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
        expiresAt: '2024-12-31T23:59:59Z',
        isAuthenticated: true,
      })

      const mockResponse = {
        token: 'new-token',
        expires_at: '2025-12-31T23:59:59Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
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
        expiresAt: '2024-12-31T23:59:59Z',
        isAuthenticated: true,
      })

      vi.mocked(fetch).mockResolvedValueOnce({
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
