# Error Handling Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing comprehensive error handling throughout the Dashboard Link SaaS application. The implementation includes React error boundaries, API error handling, toast notifications, and proper error logging.

## Prerequisites
- All previous tasks completed
- Project structure is in place (apps/admin, apps/worker, apps/api)
- TanStack Query is installed for data fetching

## Implementation Order
Follow these steps in order to ensure proper dependency management:

### Step 1: Create Shared Error Types and Utilities

#### File: `apps/api/src/utils/errors.ts`
```typescript
import { HTTPException } from 'hono/http-exception';

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Error codes mapping for user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again',
  AUTHENTICATION_ERROR: 'Please sign in to continue',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'This resource already exists',
  RATE_LIMITED: 'Too many requests. Please try again later',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INTERNAL_ERROR: 'Something went wrong. Please try again',
  SMS_FAILED: 'Failed to send SMS. Please try again',
  PLUGIN_ERROR: 'Plugin configuration error',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again',
  TOKEN_INVALID: 'Invalid access token',
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }
  
  if (error instanceof HTTPException) {
    const code = error.status === 400 ? 'VALIDATION_ERROR' :
                 error.status === 401 ? 'AUTHENTICATION_ERROR' :
                 error.status === 403 ? 'AUTHORIZATION_ERROR' :
                 error.status === 404 ? 'NOT_FOUND' :
                 error.status === 409 ? 'CONFLICT' :
                 error.status === 429 ? 'RATE_LIMITED' :
                 'INTERNAL_ERROR';
    return ERROR_MESSAGES[code] || 'An error occurred';
  }
  
  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('jwt')) {
      return ERROR_MESSAGES.TOKEN_INVALID;
    }
  }
  
  return ERROR_MESSAGES.INTERNAL_ERROR;
};

/**
 * Check if error is recoverable (can be retried)
 */
export const isRecoverableError = (error: unknown): boolean => {
  if (error instanceof RateLimitError || error instanceof ConflictError) {
    return true;
  }
  
  if (error instanceof Error) {
    return error.message.includes('timeout') || 
           error.message.includes('network') ||
           error.message.includes('fetch');
  }
  
  return false;
};
```

### Step 2: Update API Error Handler Middleware

#### File: `apps/api/src/middleware/error-handler.ts` (Update existing)
```typescript
import { logger, type ErrorContext } from '@dashboard-link/shared';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppError, getErrorMessage } from '../utils/errors';

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent response format
 */
export const errorHandler = (error: unknown, c: Context) => {
  // Get request context for logging
  const requestId = c.get('requestId') || 'unknown';
  const userId = c.get('userId');
  const organizationId = c.get('organizationId');

  const errorContext: ErrorContext = {
    requestId,
    userId,
    organizationId,
    action: c.req.method + ' ' + c.req.path,
    resource: c.req.param('id') || undefined
  };

  // Handle AppErrors (our custom errors)
  if (error instanceof AppError) {
    logger.warn('App Error', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: error.code,
        message: getErrorMessage(error),
        ...(error.details && { details: error.details }),
        requestId
      }
    };
    
    return c.json(errorResponse, error.statusCode);
  }

  // Handle HTTPExceptions (thrown by Hono and our code)
  if (error instanceof HTTPException) {
    const status = error.status;
    const message = error.message || 'An error occurred';
    
    logger.warn('HTTP Exception', error, errorContext);
    
    // Use the custom response if provided
    if (error.res) {
      return error.res;
    }
    
    const errorResponse = {
      success: false,
      error: {
        code: status === 400 ? 'VALIDATION_ERROR' : 
              status === 401 ? 'AUTHENTICATION_ERROR' :
              status === 403 ? 'AUTHORIZATION_ERROR' :
              status === 404 ? 'NOT_FOUND' :
              status === 409 ? 'CONFLICT' :
              status === 429 ? 'RATE_LIMITED' :
              'INTERNAL_ERROR',
        message: getErrorMessage(error),
        requestId
      }
    };
    
    return c.json(errorResponse, status);
  }

  // Handle validation errors (Zod)
  if (error.name === 'ZodError') {
    logger.warn('Validation error', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: getErrorMessage('VALIDATION_ERROR'),
        details: (error as { issues?: unknown[] }).issues?.map((issue: { path?: unknown[]; message: string }) => ({
          field: issue.path?.join('.'),
          message: issue.message
        })),
        requestId
      }
    };
    
    return c.json(errorResponse, 400);
  }

  // Handle JWT errors
  if (error.name === 'JwtError' || error.message.includes('jwt')) {
    logger.warn('JWT error', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: getErrorMessage('TOKEN_INVALID'),
        requestId
      }
    };
    
    return c.json(errorResponse, 401);
  }

  // Handle database errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    logger.warn('Duplicate entry error', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'CONFLICT',
        message: getErrorMessage('CONFLICT'),
        requestId
      }
    };
    
    return c.json(errorResponse, 409);
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit')) {
    logger.warn('Rate limit exceeded', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: getErrorMessage('RATE_LIMITED'),
        requestId
      }
    };
    
    return c.json(errorResponse, 429);
  }

  // Handle network errors
  if (error instanceof Error && error.message.includes('fetch')) {
    logger.warn('Network error', error, errorContext);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: getErrorMessage('NETWORK_ERROR'),
        requestId
      }
    };
    
    return c.json(errorResponse, 503);
  }

  // Handle all other errors
  logger.error('Unhandled error', error, errorContext);
  
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: getErrorMessage('INTERNAL_ERROR'),
      requestId,
      ...(process.env.NODE_ENV === 'development' && { 
        details: { 
          message: (error as Error).message,
          stack: (error as Error).stack 
        } 
      })
    }
  };
  
  return c.json(errorResponse, 500);
};

// ... (keep existing helper functions)
```

### Step 3: Create Toast Notification System

#### File: `packages/shared/src/types/toast.ts`
```typescript
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastState {
  toasts: Toast[];
}
```

#### File: `apps/admin/src/components/ui/Toast.tsx`
```typescript
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast } from '@dashboard-link/shared';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto-dismiss after duration
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          max-w-sm w-full rounded-lg border p-4 shadow-lg
          ${backgrounds[toast.type]}
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[toast.type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss(toast.id), 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
```

#### File: `apps/admin/src/hooks/useToast.ts`
```typescript
import { useCallback, useState } from 'react';
import { Toast, ToastState } from '@dashboard-link/shared';

let toastIdCounter = 0;

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }));

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message, duration: 0 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  const clear = useCallback(() => {
    setState({ toasts: [] });
  }, []);

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };
};
```

### Step 4: Create Toast Context Provider

#### File: `apps/admin/src/contexts/ToastContext.tsx`
```typescript
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastState } from '@dashboard-link/shared';

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    setState((prev) => ({
      toasts: [...prev.toasts, newToast],
    }));

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== id),
    }));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message, duration: 0 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  const clear = useCallback(() => {
    setState({ toasts: [] });
  }, []);

  const value: ToastContextType = {
    toasts: state.toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
```

### Step 5: Update Admin App Error Boundary

#### File: `apps/admin/src/components/common/ErrorBoundary.tsx` (Update existing)
```typescript
import { logger } from '@dashboard-link/shared';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    // Log the error with context
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo, tags: { errorId } });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We're sorry - something's gone wrong. Our team has been notified.
              </p>
              {this.state.errorId && (
                <p className="mt-1 text-center text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
            <div className="mt-8 space-y-3">
              <button
                type="button"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                type="button"
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-700 overflow-auto whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 6: Update Admin App with Toast Provider

#### File: `apps/admin/src/App.tsx` (Update existing)
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
// ... other imports

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppWithToast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                {/* ... other routes */}
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <AppWithToast />
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
```

### Step 7: Create Worker App Error Boundary

#### File: `apps/worker/src/components/ErrorBoundary.tsx`
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in worker app (simplified)
    console.error('Worker Error Boundary caught an error:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-sm w-full p-6 bg-white rounded-lg shadow-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Dashboard Error
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Unable to load your dashboard. Please try again or contact support.
            </p>
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 6: Create API Error Hook for Frontend

#### File: `apps/admin/src/hooks/useApiError.ts`
```typescript
import { useCallback } from 'react';
import { useToast } from './useToast';

interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export const useApiError = () => {
  const toast = useToast();

  const handleError = useCallback((error: unknown) => {
    console.error('API Error:', error);

    // Check if it's a fetch/network error
    if (error instanceof Error && error.message.includes('fetch')) {
      toast.error('Network Error', 'Please check your internet connection');
      return;
    }

    // Check if it's our API error format
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error as ApiError;
      
      // Handle specific error codes
      switch (apiError.error.code) {
        case 'VALIDATION_ERROR':
          toast.error('Validation Error', apiError.error.message);
          break;
        
        case 'AUTHENTICATION_ERROR':
        case 'TOKEN_EXPIRED':
          toast.error('Session Expired', 'Please sign in again');
          // Redirect to login after a delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          break;
        
        case 'AUTHORIZATION_ERROR':
          toast.error('Access Denied', apiError.error.message);
          break;
        
        case 'NOT_FOUND':
          toast.error('Not Found', apiError.error.message);
          break;
        
        case 'CONFLICT':
          toast.error('Conflict', apiError.error.message);
          break;
        
        case 'RATE_LIMITED':
          toast.error('Rate Limited', 'Please wait before trying again');
          break;
        
        case 'NETWORK_ERROR':
          toast.error('Network Error', 'Please check your connection');
          break;
        
        case 'SMS_FAILED':
          toast.error('SMS Failed', apiError.error.message);
          break;
        
        default:
          toast.error('Error', apiError.error.message || 'Something went wrong');
      }
    } else {
      // Generic error
      toast.error('Error', 'An unexpected error occurred');
    }
  }, [toast]);

  return { handleError };
};
```

### Step 7: Update TanStack Query Error Handling

#### File: `apps/admin/src/lib/api.ts` (Update existing)
```typescript
import { createClient } from '@dashboard-link/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiError } from '../hooks/useApiError';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create API client with error handling
const apiClient = createClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Transform error to our standard format
    if (error.response?.data) {
      throw error.response.data;
    } else if (error.request) {
      throw { error: { code: 'NETWORK_ERROR', message: 'Network error' } };
    } else {
      throw { error: { code: 'INTERNAL_ERROR', message: error.message } };
    }
  }
);

// Custom hook for queries with error handling
export const useApiQuery = (queryKey: string[], queryFn: () => Promise<any>, options = {}) => {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey,
    queryFn,
    onError: handleError,
    retry: (failureCount, error) => {
      // Don't retry on certain errors
      if (error?.error?.code === 'VALIDATION_ERROR' || 
          error?.error?.code === 'AUTHENTICATION_ERROR' ||
          error?.error?.code === 'AUTHORIZATION_ERROR') {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    ...options,
  });
};

// Custom hook for mutations with error handling
export const useApiMutation = (mutationFn: (variables: any) => Promise<any>, options = {}) => {
  const { handleError } = useApiError();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onError: handleError,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries();
    },
    ...options,
  });
};

export { apiClient };
```

### Step 8: Add Toast Container to Admin App

#### File: `apps/admin/src/App.tsx` (Update existing)
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
// ... other imports

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppWithToast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                {/* ... other routes */}
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppWithToast />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
```

### Step 9: Add Error Boundary to Worker App

#### File: `apps/worker/src/App.tsx` (Update existing)
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/ToastProvider';
import { DashboardPage } from './pages/DashboardPage';
import { InvalidTokenPage } from './pages/InvalidTokenPage';
import { ExpiredTokenPage } from './pages/ExpiredTokenPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes for worker app
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/invalid" element={<InvalidTokenPage />} />
              <Route path="/expired" element={<ExpiredTokenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
```

### Step 10: Update Form Components with Error Handling

#### File: `apps/admin/src/components/WorkerForm.tsx` (Update existing)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApiMutation } from '../lib/api';
import { useToast } from '../hooks/useToast';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').refine(validatePhone, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerFormProps {
  initialData?: Partial<WorkerFormData>;
  onSubmit: (data: WorkerFormData) => void;
}

export const WorkerForm: React.FC<WorkerFormProps> = ({ initialData, onSubmit }) => {
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: initialData,
  });

  const createWorker = useApiMutation(
    async (data: WorkerFormData) => {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      onSuccess: () => {
        toast.success('Worker Created', 'Worker has been created successfully');
        onSubmit();
      },
    }
  );

  const onFormSubmit = async (data: WorkerFormData) => {
    try {
      await createWorker.mutateAsync(data);
    } catch (error) {
      // Handle validation errors from API
      if (error?.error?.code === 'VALIDATION_ERROR' && error?.error?.details) {
        error.error.details.forEach((err: { field?: string; message: string }) => {
          if (err.field) {
            setError(err.field as keyof WorkerFormData, { message: err.message });
          }
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Form fields with error display */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* ... other fields */}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Worker'}
      </button>
    </form>
  );
};
```

### Step 10: Update Shared Package Exports

#### File: `packages/shared/src/index.ts` (Update existing)
```typescript
export * from './utils/logger';
export * from './utils/phone';
export * from './types/auth';
export * from './types/sms';
export * from './types/plugin';
export * from './types/hono';
export * from './types/toast'; // Add this line
export * from './schemas';
```

## Verification Steps

After completing each major component, run these verification commands:

### 1. Verify API Error Handler
```bash
# Start API server
pnpm dev --filter api

# Test error endpoints
curl -X POST http://localhost:3000/api/workers -H "Content-Type: application/json" -d "{}"
# Should return: { "success": false, "error": { "code": "VALIDATION_ERROR", ... } }
```

### 2. Verify Toast System
```bash
# Start admin app
pnpm dev --filter admin

# In browser console, test toasts:
window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: 'Test Error' } }));
```

### 3. Verify Error Boundaries
```bash
# Add temporary error to a component:
throw new Error('Test error boundary');

# Should see error boundary UI instead of crash
```

### 4. Run Full Test Suite
```bash
# Run all tests
pnpm test

# Check linting
pnpm lint

# Check type checking
pnpm type-check
```

## Testing Checklist

- [ ] React error boundaries prevent app crashes
- [ ] API errors return consistent format
- [ ] Toast notifications appear for all error types
- [ ] Form validation errors display correctly
- [ ] Network errors show user-friendly messages
- [ ] Authentication errors redirect to login
- [ ] 404 errors navigate to not found page
- [ ] 500 errors show generic message in production
- [ ] Error logging works in development
- [ ] Error IDs are generated for tracking
- [ ] Retry logic works for recoverable errors

## Production Considerations

1. **Error Reporting Service Integration**
   - Add Sentry or similar service in production
   - Include error IDs for user support correlation
   - Set up alerts for high error rates

2. **Performance Monitoring**
   - Track error rates by endpoint
   - Monitor toast notification performance
   - Watch error boundary triggers

3. **User Experience**
   - Ensure error messages are actionable
   - Provide retry mechanisms where appropriate
   - Consider offline handling for mobile users

## Troubleshooting

### Common Issues

1. **Toasts not appearing**
   - Check that ToastContainer is rendered in App.tsx
   - Verify useToast hook is properly imported
   - Check console for JavaScript errors

2. **Error boundary not catching errors**
   - Ensure ErrorBoundary wraps components at the right level
   - Check for async errors (need to be caught in promises)
   - Verify error boundary is class component, not functional

3. **API errors not showing toasts**
   - Check API response format matches expected structure
   - Verify useApiError hook is used with queries/mutations
   - Check interceptors in api client

## Completion Checklist

- [ ] All error types implemented in `apps/api/src/utils/errors.ts`
- [ ] Error handler middleware updated
- [ ] Toast components created in admin app
- [ ] Error boundaries updated in both apps
- [ ] API error hook implemented
- [ ] TanStack query error handling configured
- [ ] Toast container added to App.tsx
- [ ] Forms updated with validation error display
- [ ] All verification steps pass
- [ ] Tests pass and linting clean
