import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ForgotPassword } from '../../../components/auth/ForgotPassword'

describe('ForgotPassword', () => {
  it('submits the entered email address', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <ForgotPassword
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        success={false}
      />
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ops@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('ops@example.com')
    })

    expect(screen.getByText('Unable to send reset link')).toBeInTheDocument()
  })

  it('shows the success state when reset email is sent', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <ForgotPassword
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        success={true}
      />
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ops@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument()
    })
  })
})
