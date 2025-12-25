import { Component, ErrorInfo, ReactNode } from 'react'
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
          <div className='min-h-screen flex items-center justify-center p-4'>
            <div className='max-w-md w-full'>
              <Alert variant='destructive'>
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>
                  {(process.env as { NODE_ENV?: string }).NODE_ENV === 'development' ? (
                    <pre className='mt-2 text-xs overflow-auto'>{this.state.error?.toString()}</pre>
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
          </div>
        )
      )
    }

    return this.props.children
  }
}
