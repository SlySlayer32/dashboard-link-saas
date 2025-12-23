import { logger, type HonoEnv } from '@dashboard-link/shared';
import { createClient } from '@supabase/supabase-js';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Authentication middleware
 * Validates Supabase JWT token from Authorization header
 */
export const authMiddleware = createMiddleware<{ Variables: HonoEnv['Variables'] }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Authorization token required' });
    }

    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        logger.warn('Authentication failed', { 
          error: error?.message,
          token: token.substring(0, 10) + '...' 
        });
        throw new HTTPException(401, { message: 'Invalid token' });
      }

      // Get user's organization from user_metadata
      const organizationId = user.user_metadata?.organization_id;
      if (!organizationId) {
        logger.error('User missing organization_id', { userId: user.id });
        throw new HTTPException(403, { message: 'User not associated with an organization' });
      }

      // Set user context
      c.set('userId', user.id);
      c.set('userRole', user.user_metadata?.role || 'worker');
      c.set('organizationId', organizationId);

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      logger.error('Authentication error', error as Error);
      throw new HTTPException(500, { message: 'Authentication failed' });
    }
  }
);

/**
 * Optional auth middleware
 * Doesn't fail if no token, but validates if present
 */
export const optionalAuthMiddleware = createMiddleware<{ Variables: HonoEnv['Variables'] }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const organizationId = user.user_metadata?.organization_id;
          if (organizationId) {
            c.set('userId', user.id);
            c.set('userRole', user.user_metadata?.role || 'worker');
            c.set('organizationId', organizationId);
          }
        }
      } catch (error) {
        logger.warn('Optional auth failed', { error: (error as Error).message });
      }
    }

    await next();
  }
);

/**
 * Role-based access control middleware
 */
export const requireRole = (role: 'admin' | 'worker') =>
  createMiddleware<{ Variables: HonoEnv['Variables'] }>(async (c, next) => {
    const userRole = c.get('userRole');
    
    if (!userRole || (userRole !== role && userRole !== 'admin')) {
      throw new HTTPException(403, { 
        message: `Access denied. Required role: ${role}` 
      });
    }

    await next();
  });

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');
