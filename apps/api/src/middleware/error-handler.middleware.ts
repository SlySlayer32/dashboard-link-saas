import type { Context } from 'hono';
import { logger } from '../lib/logger';

export async function errorHandler(err: Error, c: Context) {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method,
    });

    // Check for known error types
    if (err.name === 'ValidationError') {
        return c.json(
            {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: err.message,
                },
            },
            400
        );
    }

    if (err.name === 'UnauthorizedError') {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            },
            401
        );
    }

    if (err.name === 'ForbiddenError') {
        return c.json(
            {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                },
            },
            403
        );
    }

    // Default 500 error
    return c.json(
        {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
            },
        },
        500
    );
}
