import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPassword } from './ForgotPassword'

describe('ForgotPassword', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText('No problem. Enter your email and we\'ll send you a reset link.')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<ForgotPassword {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Forgot your password?')).not.toBeInTheDocument()
    })

    it('should show close button', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      // Should have at least 2 buttons (close and submit)
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should show back to login link', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Back to login' })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      render(<ForgotPassword {...defaultProps} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('should show loading state during submission', () => {
      render(<ForgotPassword {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' })
      expect(submitButton).toBeDisabled()
    })

    it('should disable form inputs when loading', () => {
      render(<ForgotPassword {...defaultProps} isLoading={true} />)
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<ForgotPassword {...defaultProps} error="Email not found" />)
      
      expect(screen.getByText('Email not found')).toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      // Find the close button by looking for the X icon
      const closeButton = screen.getByRole('button', { name: '' })
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when back to login is clicked', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: 'Back to login' })
      fireEvent.click(backButton)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText('Forgot your password?').tagName).toBe('H3')
    })

    it('should have proper form labels', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<ForgotPassword {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to login' })).toBeInTheDocument()
    })
  })
})
