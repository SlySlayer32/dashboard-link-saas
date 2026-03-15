/**
 * Access Logger Middleware
 *
 * Logs dashboard access attempts for analytics and read confirmation tracking
 * Captures IP address, user agent, and validation status
 */

import type { Context, Next } from 'hono'
import type { AppContextVariables } from '../types.js'
import { logger } from '../utils/logger.js'

/**
 * Extract IP address from request headers
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP, etc.)
 */
function extractIpAddress(c: Context): string | null {
  // Check common proxy headers first
  const forwardedFor = c.req.header('x-forwarded-for')
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = c.req.header('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to connection remote address (if available)
  // Note: Hono doesn't expose raw connection info, so this may be null
  return null
}

/**
 * Extract user agent from request headers
 */
function extractUserAgent(c: Context): string | null {
  const userAgent = c.req.header('user-agent')
  return userAgent || null
}

/**
 * Log dashboard access attempt
 * Should be called after token validation
 */
export async function logDashboardAccess(
  organizationId: string,
  workerId: string,
  tokenId: string | null,
  validationStatus: 'success' | 'expired' | 'invalid' | 'revoked',
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    const accessLogRepo = getAccessLogRepository()
    await accessLogRepo.create({
      organizationId,
      workerId,
      tokenId,
      validationStatus,
      ipAddress,
      userAgent,
    })
  } catch (error) {
    // Log error but don't throw - access logging should not break dashboard access
    logger.error(
      'Failed to log dashboard access',
      error instanceof Error ? error : new Error(String(error))
    )
  }
}

/**
 * Middleware to automatically log dashboard access
 * Should be applied after workerAuthMiddleware
 */
export async function accessLoggerMiddleware(
  c: Context<{ Variables: AppContextVariables }>,
  next: Next
) {
  const ipAddress = extractIpAddress(c)
  const userAgent = extractUserAgent(c)

  // Store in context for use in route handler
  c.set('ipAddress', ipAddress)
  c.set('userAgent', userAgent)

  await next()
}
