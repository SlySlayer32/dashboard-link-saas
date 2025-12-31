import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from '../utils/logger.js';

interface ErrorContext extends Record<string, unknown> {
  requestId: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource?: string;
}

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

  // Handle HTTPExceptions (thrown by Hono and our code)
  if (error instanceof HTTPException) {
    const status = error.status;
    const message = error.message || 'An error occurred';
    
    logger.warn('HTTP Exception', { error, ...errorContext });
    
    // Use the custom response if provided
    if (error.res) {
      return error.res;
    }
    
    const errorResponse = {
      success: false,
      error: {
        code: status === 400 ? 'BAD_REQUEST' : 
              status === 401 ? 'UNAUTHORIZED' :
              status === 403 ? 'FORBIDDEN' :
              status === 404 ? 'NOT_FOUND' :
              status === 409 ? 'CONFLICT' :
              status === 429 ? 'RATE_LIMITED' :
              'HTTP_ERROR',
        message,
        requestId
      }
    };
    
    return c.json(errorResponse, status);
  }

  // Handle validation errors (Zod)
  if (error.name === 'ZodError') {
    logger.warn('Validation error', { error, ...errorContext });
    
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
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
    logger.warn('JWT error', { error, ...errorContext });
    
    const errorResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        requestId
      }
    };
    
    return c.json(errorResponse, 401);
  }

  // Handle database errors
  if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
    logger.warn('Duplicate entry error', { error, ...errorContext });
    
    const errorResponse = {
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this data already exists',
        requestId
      }
    };
    
    return c.json(errorResponse, 409);
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit')) {
    logger.warn('Rate limit exceeded', { error, ...errorContext });
    
    const errorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        requestId
      }
    };
    
    return c.json(errorResponse, 429);
  }

  // Handle all other errors
  logger.error('Unhandled error', error as Error, errorContext);
  
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : (error as Error).message,
      requestId
    }
  };
  
  return c.json(errorResponse, 500);
};

/**
 * Async error handler wrapper
 * Wraps route handlers to catch async errors
 */
export const asyncHandler = (fn: (c: Context) => Promise<Response>) => {
  return (c: Context) => {
    return fn(c).catch((error) => {
      throw error;
    });
  };
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  code: string, 
  message: string, 
  _status: number = 400,
  details?: Record<string, unknown>
) => {
  return {
    success: false,
    error: {
      code,
      message,
      ...details
    }
  };
};

/**
 * Common error creators
 */
export const createNotFoundResponse = (resource: string = 'Resource') => 
  createErrorResponse('NOT_FOUND', `${resource} not found`, 404);

export const createUnauthorizedResponse = (message: string = 'Unauthorized') => 
  createErrorResponse('UNAUTHORIZED', message, 401);

export const createForbiddenResponse = (message: string = 'Access denied') => 
  createErrorResponse('FORBIDDEN', message, 403);

export const createValidationErrorResponse = (message: string = 'Invalid input') => 
  createErrorResponse('VALIDATION_ERROR', message, 400);

export const createConflictResponse = (message: string = 'Resource already exists') => 
  createErrorResponse('CONFLICT', message, 409);

export const createRateLimitResponse = (message: string = 'Rate limit exceeded') => 
  createErrorResponse('RATE_LIMITED', message, 429);

export const createInternalErrorResponse = (message?: string) => 
  createErrorResponse(
    'INTERNAL_ERROR', 
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : (message || 'Internal server error'), 
    500
  );
