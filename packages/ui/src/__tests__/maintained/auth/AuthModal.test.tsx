import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthModal } from '../../../components/auth/LoginForm'

describe('AuthModal', () => {
  const createProps = () => ({
    isOpen: true,
    onOpenChange: vi.fn(),
    onLogin: vi.fn().mockResolvedValue(undefined),
    onSignup: vi.fn().mockResolvedValue(undefined),
    onForgotPassword: vi.fn(),
    isLoading: false,
    error: undefined,
  })

  it('renders nothing when closed', () => {
    const props = createProps()

    render(<AuthModal {...props} isOpen={false} />)

    expect(screen.queryByText('Authentication')).not.toBeInTheDocument()
  })

  it('submits password login with email and password', async () => {
    const props = createProps()

    render(<AuthModal {...props} />)

    const loginPanel = screen.getByRole('tabpanel')

    fireEvent.change(within(loginPanel).getByLabelText(/Email/i), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(within(loginPanel).getByLabelText(/Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(within(loginPanel).getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(props.onLogin).toHaveBeenCalledWith('admin@example.com', 'password123')
    })
  })

  it('opens forgot password from the login form', () => {
    const props = createProps()

    render(<AuthModal {...props} />)

    const loginPanel = screen.getByRole('tabpanel')
    fireEvent.click(within(loginPanel).getByRole('button', { name: 'Forgot password?' }))

    expect(props.onForgotPassword).toHaveBeenCalledTimes(1)
  })

  it('submits signup from the sign up tab', async () => {
    const props = createProps()

    render(<AuthModal {...props} />)

    const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.mouseDown(signUpTab)
    fireEvent.click(signUpTab)

    await waitFor(() => {
      expect(signUpTab).toHaveAttribute('aria-selected', 'true')
    })

    const signUpPanel = screen.getByRole('tabpanel')

    fireEvent.change(within(signUpPanel).getByLabelText(/Organization Name/i), {
      target: { value: 'CleanConnect' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/Admin Email/i), {
      target: { value: 'founder@example.com' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/^Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(within(signUpPanel).getByLabelText(/Confirm Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(within(signUpPanel).getByRole('checkbox'))
    fireEvent.click(within(signUpPanel).getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(props.onSignup).toHaveBeenCalledWith({
        organizationName: 'CleanConnect',
        adminEmail: 'founder@example.com',
        adminPassword: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true,
      })
    })
  })
})
