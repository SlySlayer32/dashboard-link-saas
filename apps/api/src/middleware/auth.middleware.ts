import type { Context, Next } from 'hono';
import { supabase } from '../lib/db';
import { logger } from '../lib/logger';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(
            {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid authorization header',
                },
            },
            401
        );
    }

    const token = authHeader.substring(7);

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            logger.warn('Invalid token', { error: error?.message });
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid or expired token',
                    },
                },
                401
            );
        }

        // Get user's organization from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', data.user.id)
            .single();

        if (userError || !userData) {
            logger.error('Failed to fetch user data', { userId: data.user.id, error: userError });
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not found',
                    },
                },
                401
            );
        }

        // Set context variables
        c.set('userId', data.user.id);
        c.set('organizationId', userData.organization_id);
        c.set('userRole', userData.role);

        await next();
    } catch (error) {
        logger.error('Auth middleware error', { error });
        return c.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Authentication failed',
                },
            },
            500
        );
    }
}
