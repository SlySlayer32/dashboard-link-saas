import { createTokenManager } from '@dashboard-link/tokens'
import type { AppContext } from '../types.js'
import { logger } from '../utils/logger.js'

// Initialize token manager with database configuration for dashboard_tokens
const tokenManager = createTokenManager({
  provider: 'database',
  databaseConfig: {
    tableName: 'dashboard_tokens',
    hashTokens: true,
    cleanupExpired: true,
  },
  defaultExpiry: 28800, // 8 hours for worker tokens
  refreshExpiry: 86400, // 24 hours
})

/**
 * Middleware to handle worker dashboard authentication via tokens
 */
export const workerAuthMiddleware = async (c: AppContext, next: () => Promise<void>) => {
  try {
    // Check for token in URL params
    const token = c.req.param('token')

    if (!token) {
      return c.json({ success: false, error: 'No token provided' }, 401)
    }

    // Validate token
    const tokenValidation = await tokenManager.validateToken(token)

    if (!tokenValidation.valid || !tokenValidation.payload) {
      const errorMap: Record<string, string> = {
        NOT_FOUND: 'Invalid token',
        EXPIRED: 'Token has expired',
        INVALID: 'Invalid token',
        REVOKED: 'Token has been revoked',
      }

      return c.json(
        {
          success: false,
          error: errorMap[tokenValidation.error || 'NOT_FOUND'],
        },
        401
      )
    }

    // Token is valid, extract worker and organization info from metadata
    const workerId = tokenValidation.payload.metadata?.workerId || tokenValidation.payload.userId
    const organizationId = tokenValidation.payload.organizationId

    if (!workerId || !organizationId) {
      return c.json(
        {
          success: false,
          error: 'Invalid token structure',
        },
        401
      )
    }

    // Set worker data in context
    c.set('workerId', workerId as string)
    c.set('organizationId', organizationId as string)

    return next()
  } catch (error) {
    logger.error('Worker auth middleware error', error as Error)
    return c.json({ success: false, error: 'Authentication failed' }, 500)
  }
}
