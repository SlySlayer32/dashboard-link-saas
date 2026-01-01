import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MagicLinkAuth } from './MagicLinkAuth'

// Mock the console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('MagicLinkAuth', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockConsoleLog.mockClear()
  })

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      expect(screen.getByText('Dashboard Link')).toBeInTheDocument()
      expect(screen.getByText('Email Magic Link')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<MagicLinkAuth {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Dashboard Link')).not.toBeInTheDocument()
    })

    it('should show close button', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const closeButton = screen.getByRole('button').closest('button')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Magic Link Tab', () => {
    it('should show magic link form by default', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      expect(screen.getByText('Get a secure link sent to your email. No password needed.')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument()
    })

    it('should submit magic link form with valid email', async () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onMagicLink).toHaveBeenCalledWith({
          email: 'test@example.com'
        })
      })
    })

    it('should show loading state during magic link submission', () => {
      render(<MagicLinkAuth {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' })
      expect(submitButton).toBeDisabled()
    })

    it('should display error message when provided', () => {
      render(<MagicLinkAuth {...defaultProps} error="Invalid email address" />)
      
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
  })

  describe('Password Login Tab', () => {
    it('should switch to password tab when clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should submit login form with valid credentials', async () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      // Fill form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('should show forgot password link when onForgotPassword is provided', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      expect(screen.getByRole('button', { name: 'Forgot password?' })).toBeInTheDocument()
    })

    it('should not show forgot password link when onForgotPassword is not provided', () => {
      const propsWithoutForgotPassword = { ...defaultProps, onForgotPassword: undefined }
      render(<MagicLinkAuth {...propsWithoutForgotPassword} />)
      
      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument()
    })

    it('should show link to switch to magic link', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      expect(screen.getByRole('button', { name: 'Use magic link' })).toBeInTheDocument()
    })

    it('should switch back to magic link when link is clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: 'Password' })
      fireEvent.click(passwordTab)
      
      // Click magic link link
      const magicLinkButton = screen.getByRole('button', { name: 'Use magic link' })
      fireEvent.click(magicLinkButton)
      
      // Should be back on magic link tab
      expect(screen.getByText('Get a secure link sent to your email. No password needed.')).toBeInTheDocument()
    })
  })

  describe('Sign Up Tab', () => {
    it('should switch to sign up tab when clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('should submit signup form with valid data', async () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Organization Name'), { 
        target: { value: 'Test Company' } 
      })
      fireEvent.change(screen.getByLabelText(/email/i), { 
        target: { value: 'admin@testcompany.com' } 
      })
      fireEvent.change(screen.getByLabelText(/^password/i), { 
        target: { value: 'password123' } 
      })
      fireEvent.change(screen.getByLabelText('Confirm Password'), { 
        target: { value: 'password123' } 
      })
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox')
      fireEvent.click(termsCheckbox)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onSignup).toHaveBeenCalledWith({
          organization: 'Test Company',
          email: 'admin@testcompany.com',
          password: 'password123',
          confirmPassword: 'password123'
        })
      })
    })

    it('should show link to switch to sign in', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('should switch to login when sign in link is clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      // Click sign in link
      const signInButton = screen.getByRole('button', { name: 'Sign in' })
      fireEvent.click(signInButton)
      
      // Should be on password tab
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    })

    it('should disable create account button when terms not accepted', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable create account button when terms accepted', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      fireEvent.click(signUpTab)
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox')
      fireEvent.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const closeButton = screen.getByRole('button').closest('button')
      fireEvent.click(closeButton!)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const backdrop = screen.getByText('Dashboard Link').closest('.fixed')
      fireEvent.click(backdrop!)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should disable all buttons when loading', () => {
      render(<MagicLinkAuth {...defaultProps} isLoading={true} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('should disable form inputs when loading', () => {
      render(<MagicLinkAuth {...defaultProps} isLoading={true} />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message in all tabs', () => {
      render(<MagicLinkAuth {...defaultProps} error="Network error" />)
      
      expect(screen.getByText('Network error')).toBeInTheDocument()
      
      // Switch tabs and verify error persists
      fireEvent.click(screen.getByRole('tab', { name: 'Password' }))
      expect(screen.getByText('Network error')).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }))
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper tab navigation', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
      
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
    })

    it('should update aria-selected when tab changes', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      const tabs = screen.getAllByRole('tab')
      
      // Click password tab
      fireEvent.click(tabs[1])
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
      
      // Click sign up tab
      fireEvent.click(tabs[2])
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('should have proper form labels', () => {
      render(<MagicLinkAuth {...defaultProps} />)
      
      // Magic link tab
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      
      // Switch to password tab
      fireEvent.click(screen.getByRole('tab', { name: 'Password' }))
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      
      // Switch to sign up tab
      fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }))
      expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })
  })
})
