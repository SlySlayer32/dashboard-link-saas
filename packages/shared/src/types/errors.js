export class AppError extends Error {
  constructor(message, code, statusCode = 500, details) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }
}
export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMITED', 429)
    this.name = 'RateLimitError'
  }
}
export const ERROR_MESSAGES = {
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
export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message
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
export const isRecoverableError = (error) => {
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
//# sourceMappingURL=errors.js.map
