import { HTTPException } from 'hono/http-exception'

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
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMITED', 429)
    this.name = 'RateLimitError'
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
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message
  }

  if (error instanceof HTTPException) {
    const code =
      error.status === 400
        ? 'VALIDATION_ERROR'
        : error.status === 401
          ? 'AUTHENTICATION_ERROR'
          : error.status === 403
            ? 'AUTHORIZATION_ERROR'
            : error.status === 404
              ? 'NOT_FOUND'
              : error.status === 409
                ? 'CONFLICT'
                : error.status === 429
                  ? 'RATE_LIMITED'
                  : 'INTERNAL_ERROR'
    return ERROR_MESSAGES[code] || 'An error occurred'
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
    if (error.message.includes('jwt')) {
      return ERROR_MESSAGES.TOKEN_INVALID
    }
  }

  return ERROR_MESSAGES.INTERNAL_ERROR
}

/**
 * Check if error is recoverable (can be retried)
 */
export const isRecoverableError = (error: unknown): boolean => {
  if (error instanceof RateLimitError || error instanceof ConflictError) {
    return true
  }

  if (error instanceof Error) {
    return (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('fetch')
    )
  }

  return false
}
