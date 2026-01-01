import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPassword } from './ResetPassword'

describe('ResetPassword', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    error: undefined,
    token: 'valid-token-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<ResetPassword {...defaultProps} />)
      
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByText('Create new password')).toBeInTheDocument()
      expect(screen.getByText('Enter your new password below. Make sure it\'s secure.')).toBeInTheDocument()
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<ResetPassword {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
    })

    it('should show close button', () => {
      render(<ResetPassword {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      // Should have at least 2 buttons (close and submit)
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should show back to login link', () => {
      render(<ResetPassword {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Back to login' })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid passwords', async () => {
      render(<ResetPassword {...defaultProps} />)
      
      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })
      
      fireEvent.change(passwordInput, { target: { value: 'newPassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          token: 'valid-token-123',
          password: 'newPassword123',
          confirmPassword: 'newPassword123'
        })
      })
    })

    it('should show loading state during submission', () => {
      render(<ResetPassword {...defaultProps} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Reset Password' })
      expect(submitButton).toBeDisabled()
    })

    it('should disable form inputs when loading', () => {
      render(<ResetPassword {...defaultProps} isLoading={true} />)
      
      const passwordInput = screen.getByLabelText('New Password')
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password')
      expect(passwordInput).toBeDisabled()
      expect(confirmPasswordInput).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<ResetPassword {...defaultProps} error="Invalid token" />)
      
      expect(screen.getByText('Invalid token')).toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ResetPassword {...defaultProps} />)
      
      // Find the close button (first button without specific name)
      const closeButton = screen.getByRole('button', { name: '' })
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when back to login is clicked', () => {
      render(<ResetPassword {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: 'Back to login' })
      fireEvent.click(backButton)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ResetPassword {...defaultProps} />)
      
      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByText('Reset Password').tagName).toBe('H3')
    })

    it('should have proper form labels', () => {
      render(<ResetPassword {...defaultProps} />)
      
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<ResetPassword {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to login' })).toBeInTheDocument()
    })
  })
})