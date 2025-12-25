import { Component, ErrorInfo, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from './ui/Alert'
import { Button } from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className='container mx-auto p-4'>
            <Alert variant='destructive'>
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {process.env.NODE_ENV === 'development' ? (
                  <pre>{this.state.error?.toString()}</pre>
                ) : (
                  'An unexpected error occurred. Please try again later.'
                )}
              </AlertDescription>
              <div className='mt-4 space-x-2'>
                <Button variant='outline' onClick={this.handleReset}>
                  Try again
                </Button>
                <Button variant='outline' onClick={() => window.location.reload()}>
                  Reload
                </Button>
              </div>
            </Alert>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Hook to use error boundary
export const useErrorBoundary = () => {
  const navigate = useNavigate()

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error to error reporting service
    console.error('Error boundary caught:', error, errorInfo)

    // Handle specific error types
    if (error.message.includes('401')) {
      navigate('/auth/login')
    }
  }

  return { handleError }
}
