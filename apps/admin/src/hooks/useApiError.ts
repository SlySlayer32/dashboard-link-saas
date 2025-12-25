import { AppError } from '@dashboard-link/shared'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast/ToastProvider'

export const useApiError = () => {
  const toast = useToast()
  const navigate = useNavigate()

  const handleError = useCallback(
    (error: unknown) => {
      console.error('API Error:', error)

      if (error instanceof AppError) {
        // Handle specific error types
        switch (error.statusCode) {
          case 401:
            // Unauthorized - redirect to login
            navigate('/auth/login')
            break
          case 403:
            // Forbidden - show access denied
            toast.addToast({
              type: 'error',
              title: 'Access Denied',
              message: 'You do not have permission to perform this action',
            })
            break
          case 404:
            // Not found - show not found message
            toast.addToast({
              type: 'error',
              title: 'Not Found',
              message: 'The requested resource was not found',
            })
            break
          case 422:
            // Validation error - show validation messages
            toast.addToast({
              type: 'error',
              title: 'Validation Error',
              message: 'Please check your input and try again',
            })
            break
          default:
            // Generic error
            toast.addToast({
              type: 'error',
              title: 'Error',
              message: error.message || 'An error occurred',
            })
        }
      } else if (error instanceof Error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch')) {
          toast.addToast({
            type: 'error',
            title: 'Network Error',
            message: 'Unable to connect to the server. Please check your connection.',
          })
        } else {
          // Other unexpected errors
          toast.addToast({
            type: 'error',
            title: 'Error',
            message: error.message || 'An unexpected error occurred',
          })
        }
      } else {
        // Unknown error type
        toast.addToast({
          type: 'error',
          title: 'Error',
          message: 'An unknown error occurred',
        })
      }
    },
    [navigate, toast]
  )

  return { handleError }
}
