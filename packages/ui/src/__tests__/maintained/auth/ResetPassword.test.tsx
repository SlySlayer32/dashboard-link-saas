import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResetPassword } from '../../../components/auth/ResetPassword'

describe('ResetPassword', () => {
  it('shows the invalid token state when the token is no longer valid', () => {
    render(
      <ResetPassword
        token='expired-token'
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isValidToken={false}
      />
    )

    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request new reset link' })).toBeInTheDocument()
  })

  it('submits the new password and shows success state', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <ResetPassword
        token='valid-token'
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    )

    fireEvent.change(screen.getByLabelText(/^New Password/), {
      target: { value: 'newPassword123' },
    })
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/), {
      target: { value: 'newPassword123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('valid-token', 'newPassword123')
    })

    expect(screen.getByText('Password Reset Successfully')).toBeInTheDocument()
  })
})
