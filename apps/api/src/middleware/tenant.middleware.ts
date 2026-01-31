import type { Context, Next } from 'hono';
import { clearTenantContext, setTenantContext } from '../lib/db';
import { logger } from '../lib/logger';

/**
 * Tenant middleware - ensures organization context is set
 * Must run after auth middleware
 */
export async function tenantMiddleware(c: Context, next: Next) {
    const organizationId = c.get('organizationId');

    if (!organizationId) {
        logger.error('Tenant middleware: Missing organization context');
        return c.json(
            {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Organization context required',
                },
            },
            403
        );
    }

    // CRITICAL: Set PostgreSQL RLS session variable for tenant isolation
    await setTenantContext(organizationId);

    // Set logger context for this request
    logger.setContext({
        organizationId,
        userId: c.get('userId'),
    });

    try {
        await next();
    } finally {
        // CRITICAL: Clear RLS context after request
        await clearTenantContext();

        // Clear logger context after request
        logger.clearContext();
    }
}
