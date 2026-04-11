import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseAuth = vi.hoisted(() => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: supabaseAuth,
  },
}))

import ResetPasswordPage from './ResetPasswordPage'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    supabaseAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })
    supabaseAuth.setSession.mockResolvedValue({ error: null })
    supabaseAuth.signOut.mockResolvedValue({ error: null })
    supabaseAuth.updateUser.mockResolvedValue({ error: null })
    supabaseAuth.verifyOtp.mockResolvedValue({ error: null })

    globalThis.history.replaceState({}, '', '/reset-password')
  })

  it('updates the user password when a recovery session is available', async () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Create new password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
      target: { value: 'newPassword123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), {
      target: { value: 'newPassword123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(supabaseAuth.updateUser).toHaveBeenCalledWith({ password: 'newPassword123' })
    })
  })

  it('shows the invalid link state when there is no recovery session', async () => {
    supabaseAuth.getSession.mockResolvedValueOnce({
      data: { session: null },
    })

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument()
    })
  })
})
