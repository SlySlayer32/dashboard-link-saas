import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MagicLinkAuth } from './MagicLinkAuth'

describe('MagicLinkAuth - Tab Switching', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onLogin: vi.fn(),
    onMagicLink: vi.fn(),
    onSignup: vi.fn(),
    onForgotPassword: vi.fn(),
    isLoading: false,
    error: undefined,
  }

  it('should switch to password tab and show form', async () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    // Click password tab
    const passwordTab = screen.getByRole('tab', { name: 'Password' })
    fireEvent.click(passwordTab)
    
    // Wait for tab content to be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })
    
    // Check for sign in button
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should switch to sign up tab and show form', async () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    // Click sign up tab
    const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signUpTab)
    
    // Wait for tab content to be visible
    await waitFor(() => {
      expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })
    
    // Check for create account button
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('should show forgot password link in login tab', async () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    // Click password tab
    const passwordTab = screen.getByRole('tab', { name: 'Password' })
    fireEvent.click(passwordTab)
    
    // Wait for content and check for forgot password link
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument()
    })
  })
})
