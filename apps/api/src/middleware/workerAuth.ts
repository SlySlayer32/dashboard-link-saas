import { createTokenManager } from '@dashboard-link/tokens';
import { Context } from 'hono';
import { SessionService } from '../services/session.service';
import { logger } from '../utils/logger.js';

// Initialize token manager with environment configuration
const tokenManager = createTokenManager({
  provider: 'database',
  tableName: 'worker_tokens',
  hashTokens: true,
  cleanupExpired: true,
  defaultExpiry: 86400, // 1 day for worker tokens
  refreshExpiry: 2592000 // 30 days
});

/**
 * Middleware to handle worker dashboard authentication via tokens and sessions
 */
export const workerAuthMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    // First, check for existing session
    const sessionId = SessionService.getSessionIdFromCookie(c)
    
    if (sessionId) {
      const sessionValidation = await SessionService.validateSession(sessionId)
      
      if (sessionValidation.valid && sessionValidation.sessionData) {
        // Valid session found, refresh it and continue
        await SessionService.refreshSession(sessionId)
        
        // Set session data in context
        c.set('workerId', sessionValidation.sessionData.workerId)
        c.set('organizationId', sessionValidation.sessionData.organizationId)
        c.set('sessionId', sessionId)
        
        return next()
      }
    }

    // No valid session, check for token in URL params
    const token = c.req.param('token')
    
    if (!token) {
      return c.json(
        { success: false, error: 'No token provided' },
        401
      )
    }

    // Validate token
    const tokenValidation = await tokenManager.validateToken(token)
    
    if (!tokenValidation.valid || !tokenValidation.payload) {
      const errorMap: Record<string, string> = {
        'NOT_FOUND': 'Invalid token',
        'EXPIRED': 'Token has expired',
        'INVALID': 'Invalid token',
        'REVOKED': 'Token has been revoked'
      }
      
      return c.json(
        { 
          success: false, 
          error: errorMap[tokenValidation.error || 'NOT_FOUND'] 
        },
        401
      )
    }

    // Token is valid, create session
    const workerId = tokenValidation.payload.metadata?.workerId || tokenValidation.payload.userId
    const organizationId = tokenValidation.payload.organizationId || 'org-placeholder'
    
    const sessionData = await SessionService.createSession(
      workerId,
      organizationId
    )

    // Set session cookie
    SessionService.setSessionCookie(c, sessionData.sessionId)

    // Set session data in context
    c.set('workerId', workerId)
    c.set('organizationId', organizationId)
    c.set('sessionId', sessionData.sessionId)

    return next()
  } catch (error) {
    logger.error('Worker auth middleware error', error as Error)
    return c.json(
      { success: false, error: 'Authentication failed' },
      500
    )
  }
}
