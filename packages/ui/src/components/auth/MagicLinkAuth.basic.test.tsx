import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MagicLinkAuth } from './MagicLinkAuth'

describe('MagicLinkAuth - Basic Tests', () => {
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

  it('should render modal with tabs', () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    expect(screen.getByText('Dashboard Link')).toBeInTheDocument()
    expect(screen.getByText('Email Magic Link')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('should show magic link form by default', () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    expect(screen.getByText('Get a secure link sent to your email. No password needed.')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()
  })

  it('should switch tabs', () => {
    render(<MagicLinkAuth {...defaultProps} />)
    
    // Click password tab
    const passwordTab = screen.getByRole('tab', { name: 'Password' })
    fireEvent.click(passwordTab)
    
    // Should show password form
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    
    // Click sign up tab
    const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
    fireEvent.click(signUpTab)
    
    // Should show signup form
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })
})
