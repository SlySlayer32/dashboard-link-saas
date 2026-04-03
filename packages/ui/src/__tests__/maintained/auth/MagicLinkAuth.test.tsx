import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MagicLinkAuth } from '../../../components/auth/MagicLinkAuth'

describe('MagicLinkAuth', () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onLogin: vi.fn().mockResolvedValue(undefined),
    onMagicLink: vi.fn().mockResolvedValue(undefined),
    onSignup: vi.fn().mockResolvedValue(undefined),
    onForgotPassword: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: undefined,
  })

  it('renders nothing when closed', () => {
    const props = createProps()

    render(<MagicLinkAuth {...props} isOpen={false} />)

    expect(screen.queryByText('Dashboard Link')).not.toBeInTheDocument()
  })

  it('submits the magic link form and shows confirmation copy', async () => {
    const props = createProps()

    render(<MagicLinkAuth {...props} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'manager@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link' }))

    await waitFor(() => {
      expect(props.onMagicLink).toHaveBeenCalledWith({
        email: 'manager@example.com',
        sent: false,
      })
    })

    expect(screen.getByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText(/manager@example\.com/i)).toBeInTheDocument()
  })

  it('submits password login from the password tab', async () => {
    const props = createProps()

    render(<MagicLinkAuth {...props} />)

    const passwordTab = screen.getByRole('tab', { name: 'Password' })
    fireEvent.mouseDown(passwordTab)
    fireEvent.click(passwordTab)

    await waitFor(() => {
      expect(passwordTab).toHaveAttribute('aria-selected', 'true')
    })

    const loginPanel = screen.getByRole('tabpanel')

    fireEvent.change(within(loginPanel).getByLabelText(/^email/i), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(within(loginPanel).getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(within(loginPanel).getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(props.onLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      })
    })
  })

  it('submits signup after terms are accepted', async () => {
    const props = createProps()

    render(<MagicLinkAuth {...props} />)

    const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.mouseDown(signUpTab)
    fireEvent.click(signUpTab)

    await waitFor(() => {
      expect(signUpTab).toHaveAttribute('aria-selected', 'true')
    })

    const signUpPanel = screen.getByRole('tabpanel')

    fireEvent.change(within(signUpPanel).getByLabelText(/^Organization Name/), {
      target: { value: 'CleanConnect' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/^email/i), {
      target: { value: 'founder@example.com' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/^password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/^Confirm Password/), {
      target: { value: 'password123' },
    })
    fireEvent.click(within(signUpPanel).getByRole('checkbox'))
    fireEvent.click(within(signUpPanel).getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(props.onSignup).toHaveBeenCalledWith({
        organization: 'CleanConnect',
        email: 'founder@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        termsAccepted: true,
      })
    })
  })
})
