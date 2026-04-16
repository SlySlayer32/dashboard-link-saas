import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: authMocks.signInWithPassword,
      signUp: authMocks.signUp,
      signOut: authMocks.signOut,
      refreshSession: authMocks.refreshSession,
      getSession: authMocks.getSession,
    },
  },
}))

import { useAuthStore } from './auth'

const mockSession = {
  access_token: 'test-token',
  refresh_token: 'refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    organization_id: 'org-123',
    role: 'admin',
  },
}

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })

    authMocks.signOut.mockResolvedValue({ error: null })
    authMocks.getSession.mockResolvedValue({ data: { session: null } })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should have the correct initial state', () => {
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.expiresAt).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should login successfully with valid credentials', async () => {
    authMocks.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: mockSession,
      },
      error: null,
    })

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'password123',
    })

    const currentState = useAuthStore.getState()
    expect(result).toEqual({ success: true })
    expect(currentState.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: 'Test User',
      organization_id: 'org-123',
      role: 'admin',
    })
    expect(currentState.token).toBe('test-token')
    expect(currentState.refreshToken).toBe('refresh-token')
    expect(currentState.isAuthenticated).toBe(true)
    expect(currentState.error).toBeNull()
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('sb-access-token', 'test-token')
  })

  it('should return an auth error when login fails', async () => {
    authMocks.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'wrong-password',
    })

    const currentState = useAuthStore.getState()
    expect(result).toEqual({ success: false, error: 'Invalid login credentials' })
    expect(currentState.user).toBeNull()
    expect(currentState.token).toBeNull()
    expect(currentState.isAuthenticated).toBe(false)
    expect(currentState.error).toBe('Invalid login credentials')
  })

  it('should return an unexpected error when login throws', async () => {
    authMocks.signInWithPassword.mockRejectedValueOnce(new Error('Network error'))

    const result = await useAuthStore.getState().login({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' })
    expect(useAuthStore.getState().error).toBe('An unexpected error occurred')
  })

  it('should clear auth state on logout', () => {
    useAuthStore.setState({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        organization_id: 'org-123',
        role: 'admin',
      },
      token: 'test-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date().toISOString(),
      isAuthenticated: true,
      isLoading: false,
      error: 'old error',
    })
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('sb-access-token', 'test-token')

    useAuthStore.getState().logout()

    const currentState = useAuthStore.getState()
    expect(currentState.user).toBeNull()
    expect(currentState.token).toBeNull()
    expect(currentState.refreshToken).toBeNull()
    expect(currentState.isAuthenticated).toBe(false)
    expect(currentState.error).toBeNull()
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-access-token')
  })

  it('should refresh the token successfully', async () => {
    useAuthStore.setState({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        organization_id: 'org-123',
        role: 'admin',
      },
      token: 'old-token',
      refreshToken: 'old-refresh-token',
      expiresAt: new Date().toISOString(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })

    authMocks.refreshSession.mockResolvedValueOnce({
      data: {
        session: {
          ...mockSession,
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
        },
      },
      error: null,
    })

    await expect(useAuthStore.getState().refreshAuthToken()).resolves.toBeUndefined()

    const currentState = useAuthStore.getState()
    expect(currentState.token).toBe('new-token')
    expect(currentState.refreshToken).toBe('new-refresh-token')
    expect(currentState.isAuthenticated).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('sb-access-token', 'new-token')
  })

  it('should clear auth state when token refresh fails', async () => {
    useAuthStore.setState({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        organization_id: 'org-123',
        role: 'admin',
      },
      token: 'old-token',
      refreshToken: 'old-refresh-token',
      expiresAt: new Date().toISOString(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })

    authMocks.refreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Token refresh failed' },
    })

    await expect(useAuthStore.getState().refreshAuthToken()).rejects.toThrow('Token refresh failed')

    const currentState = useAuthStore.getState()
    expect(currentState.user).toBeNull()
    expect(currentState.token).toBeNull()
    expect(currentState.refreshToken).toBeNull()
    expect(currentState.isAuthenticated).toBe(false)
  })

  it('should clear the error state', () => {
    useAuthStore.setState({ error: 'Some error', isLoading: true })

    useAuthStore.getState().clearError()

    expect(useAuthStore.getState().error).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('should clear stale local auth when no Supabase session exists during startup', async () => {
    useAuthStore.setState({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        organization_id: 'org-123',
        role: 'admin',
      },
      token: 'stale-token',
      refreshToken: 'stale-refresh-token',
      expiresAt: new Date().toISOString(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })

    authMocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    await expect(useAuthStore.getState().checkAuth()).resolves.toBeUndefined()

    const currentState = useAuthStore.getState()
    expect(currentState.user).toBeNull()
    expect(currentState.token).toBeNull()
    expect(currentState.refreshToken).toBeNull()
    expect(currentState.isAuthenticated).toBe(false)
    expect(currentState.isLoading).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-access-token')
  })

  it('should restore auth state from the active Supabase session during startup', async () => {
    authMocks.getSession.mockResolvedValueOnce({
      data: {
        session: {
          ...mockSession,
          user: mockUser,
        },
      },
      error: null,
    })

    await expect(useAuthStore.getState().checkAuth()).resolves.toBeUndefined()

    const currentState = useAuthStore.getState()
    expect(currentState.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      name: 'Test User',
      organization_id: 'org-123',
      role: 'admin',
    })
    expect(currentState.token).toBe('test-token')
    expect(currentState.refreshToken).toBe('refresh-token')
    expect(currentState.isAuthenticated).toBe(true)
    expect(currentState.isLoading).toBe(false)
  })
})
