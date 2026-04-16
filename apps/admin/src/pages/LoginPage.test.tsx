import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  error: null as string | null,
  isAuthenticated: false,
  isLoading: false,
}))

const authActions = vi.hoisted(() => ({
  clearError: vi.fn(),
  login: vi.fn(),
}))

const authStore = vi.hoisted(() => ({
  getState: vi.fn(),
  state: {
    user: null as null | { workspace_preferences?: { completedAt?: string; defaultRoute: string } },
  },
}))

const supabaseAuth = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('../store/auth', () => ({
  useAuthActions: () => authActions,
  useAuthError: () => authState.error,
  useAuthIsAuthenticated: () => authState.isAuthenticated,
  useAuthIsLoading: () => authState.isLoading,
  useAuthStore: Object.assign(
    (selector?: (state: typeof authStore.state) => unknown) =>
      selector ? selector(authStore.state) : authStore.state,
    {
      getState: authStore.getState,
    }
  ),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: supabaseAuth,
  },
}))

import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    authState.error = null
    authState.isAuthenticated = false
    authState.isLoading = false
    authStore.state.user = null

    authActions.login.mockResolvedValue({ success: true })
    authStore.getState.mockReturnValue({
      register: vi.fn().mockResolvedValue({ success: true }),
    })

    supabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

    globalThis.history.replaceState({}, '', '/login')
  })

  it('renders password-only admin auth without magic-link UI', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const dialog = screen.getByRole('dialog')

    expect(screen.getByText('Secure admin login with email and password')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Email/i)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.queryByText(/passwordless/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send magic link/i })).not.toBeInTheDocument()
  })

  it('submits email and password through the auth store', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const dialog = screen.getByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/Email/i), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(authActions.login).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      })
    })
  })

  it('sends password reset emails to the reset-password route', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Forgot password?' }))

    await waitFor(() => {
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
    })

    const emailInputs = screen.getAllByPlaceholderText('you@company.com')

    fireEvent.change(emailInputs[emailInputs.length - 1], {
      target: { value: 'admin@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }))

    await waitFor(() => {
      expect(supabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith('admin@example.com', {
        redirectTo: `${globalThis.location.origin}/reset-password`,
      })
    })
  })
})
