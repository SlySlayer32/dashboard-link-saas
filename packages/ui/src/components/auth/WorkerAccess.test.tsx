import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkerAccess } from './WorkerAccess'

describe('WorkerAccess', () => {
  const defaultProps = {
    token: 'valid-worker-token-123',
    onValidateToken: vi.fn(),
    isLoading: false,
    error: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render worker access page with valid token', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      expect(screen.getByText('Dashboard Access')).toBeInTheDocument()
      expect(screen.getByText('Access your work dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Access Dashboard' })).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<WorkerAccess {...defaultProps} isLoading={true} />)
      
      expect(screen.getByText('Dashboard Access')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Access Dashboard' })).toBeDisabled()
    })

    it('should show expired token state', () => {
      render(<WorkerAccess {...defaultProps} error="Token has expired" />)
      
      expect(screen.getByText('Link Expired')).toBeInTheDocument()
      expect(screen.getByText('This dashboard link has expired')).toBeInTheDocument()
      expect(screen.getByText('Please contact your manager to get a new link')).toBeInTheDocument()
    })

    it('should show invalid token state', () => {
      render(<WorkerAccess {...defaultProps} error="Invalid token" />)
      
      expect(screen.getByText('Invalid Link')).toBeInTheDocument()
      expect(screen.getByText('This dashboard link is not valid')).toBeInTheDocument()
      expect(screen.getByText('Please check the link or contact your manager')).toBeInTheDocument()
    })

    it('should show general error state', () => {
      render(<WorkerAccess {...defaultProps} error="Network error" />)
      
      expect(screen.getByText('Access Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to access dashboard')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  describe('Token Validation', () => {
    it('should call onValidateToken with token when component mounts', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      expect(defaultProps.onValidateToken).toHaveBeenCalledWith('valid-worker-token-123')
    })

    it('should call onValidateToken when access button is clicked', async () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      fireEvent.click(accessButton)
      
      await waitFor(() => {
        expect(defaultProps.onValidateToken).toHaveBeenCalledWith('valid-worker-token-123')
      })
    })

    it('should handle successful token validation', async () => {
      defaultProps.onValidateToken.mockResolvedValue({ success: true })
      
      render(<WorkerAccess {...defaultProps} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      fireEvent.click(accessButton)
      
      await waitFor(() => {
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument()
      })
    })

    it('should handle token validation failure', async () => {
      defaultProps.onValidateToken.mockResolvedValue({ success: false, error: 'Token expired' })
      
      render(<WorkerAccess {...defaultProps} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      fireEvent.click(accessButton)
      
      await waitFor(() => {
        expect(screen.getByText('Link Expired')).toBeInTheDocument()
      })
    })
  })

  describe('Error States', () => {
    it('should detect expired token from error message', () => {
      render(<WorkerAccess {...defaultProps} error="Token expired" />)
      
      expect(screen.getByText('Link Expired')).toBeInTheDocument()
      expect(screen.getByText('This dashboard link has expired')).toBeInTheDocument()
    })

    it('should detect invalid token from error message', () => {
      render(<WorkerAccess {...defaultProps} error="Invalid token provided" />)
      
      expect(screen.getByText('Invalid Link')).toBeInTheDocument()
      expect(screen.getByText('This dashboard link is not valid')).toBeInTheDocument()
    })

    it('should show general error for unknown errors', () => {
      render(<WorkerAccess {...defaultProps} error="Unknown error occurred" />)
      
      expect(screen.getByText('Access Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to access dashboard')).toBeInTheDocument()
    })

    it('should show contact manager message in error states', () => {
      render(<WorkerAccess {...defaultProps} error="Token expired" />)
      
      expect(screen.getByText('Please contact your manager to get a new link')).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('should show proper icons for different states', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show warning icon for expired token', () => {
      render(<WorkerAccess {...defaultProps} error="Token expired" />)
      
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show error icon for invalid token', () => {
      render(<WorkerAccess {...defaultProps} error="Invalid token" />)
      
      const icons = document.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show success icon during redirect', async () => {
      defaultProps.onValidateToken.mockResolvedValue({ success: true })
      
      render(<WorkerAccess {...defaultProps} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      fireEvent.click(accessButton)
      
      await waitFor(() => {
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument()
      })
    })
  })

  describe('Button Interactions', () => {
    it('should disable access button when loading', () => {
      render(<WorkerAccess {...defaultProps} isLoading={true} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      expect(accessButton).toBeDisabled()
    })

    it('should show loading spinner when loading', () => {
      render(<WorkerAccess {...defaultProps} isLoading={true} />)
      
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should enable access button when not loading', () => {
      render(<WorkerAccess {...defaultProps} isLoading={false} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      expect(accessButton).not.toBeDisabled()
    })
  })

  describe('Responsive Design', () => {
    it('should be mobile responsive', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const container = screen.getByText('Dashboard Access').closest('.min-h-screen')
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'p-4')
    })

    it('should have proper card sizing', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const card = screen.getByText('Dashboard Access').closest('.w-full')
      expect(card).toHaveClass('max-w-md', 'mx-4')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: 'Access Dashboard' })).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: 'Access Dashboard' })
      expect(button).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<WorkerAccess {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: 'Access Dashboard' })
      button.focus()
      expect(button).toHaveFocus()
    })
  })

  describe('Content Messages', () => {
    it('should show appropriate success message', async () => {
      defaultProps.onValidateToken.mockResolvedValue({ success: true })
      
      render(<WorkerAccess {...defaultProps} />)
      
      const accessButton = screen.getByRole('button', { name: 'Access Dashboard' })
      fireEvent.click(accessButton)
      
      await waitFor(() => {
        expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument()
        expect(screen.getByText('You will be redirected shortly')).toBeInTheDocument()
      })
    })

    it('should show appropriate expired message', () => {
      render(<WorkerAccess {...defaultProps} error="Token expired" />)
      
      expect(screen.getByText('This dashboard link has expired')).toBeInTheDocument()
      expect(screen.getByText('Dashboard links expire after a certain time for security')).toBeInTheDocument()
    })

    it('should show appropriate invalid message', () => {
      render(<WorkerAccess {...defaultProps} error="Invalid token" />)
      
      expect(screen.getByText('This dashboard link is not valid')).toBeInTheDocument()
      expect(screen.getByText('Please check the link or contact your manager')).toBeInTheDocument()
    })

    it('should show helpful error context', () => {
      render(<WorkerAccess {...defaultProps} error="Token expired" />)
      
      expect(screen.getByText('Dashboard links expire after a certain time for security')).toBeInTheDocument()
      expect(screen.getByText('Please contact your manager to get a new link')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('should handle error state changes', () => {
      const { rerender } = render(<WorkerAccess {...defaultProps} />)
      
      // Initial state - no error
      expect(screen.getByText('Dashboard Access')).toBeInTheDocument()
      
      // Change to error state
      rerender(<WorkerAccess {...defaultProps} error="Token expired" />)
      expect(screen.getByText('Link Expired')).toBeInTheDocument()
    })

    it('should handle loading state changes', () => {
      const { rerender } = render(<WorkerAccess {...defaultProps} />)
      
      // Initial state - not loading
      expect(screen.getByRole('button', { name: 'Access Dashboard' })).not.toBeDisabled()
      
      // Change to loading state
      rerender(<WorkerAccess {...defaultProps} isLoading={true} />)
      expect(screen.getByRole('button', { name: 'Access Dashboard' })).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty token', () => {
      render(<WorkerAccess {...defaultProps} token="" />)
      
      expect(screen.getByText('Dashboard Access')).toBeInTheDocument()
      expect(defaultProps.onValidateToken).toHaveBeenCalledWith('')
    })

    it('should handle null token', () => {
      render(<WorkerAccess {...defaultProps} token={null as any} />)
      
      expect(screen.getByText('Dashboard Access')).toBeInTheDocument()
      expect(defaultProps.onValidateToken).toHaveBeenCalledWith(null)
    })

    it('should handle very long error messages', () => {
      const longError = 'This is a very long error message that should still be displayed properly in the UI without breaking the layout or causing any visual issues'
      render(<WorkerAccess {...defaultProps} error={longError} />)
      
      expect(screen.getByText('Access Error')).toBeInTheDocument()
      expect(screen.getByText(longError)).toBeInTheDocument()
    })
  })
})
