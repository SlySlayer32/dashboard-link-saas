import { createMiddleware } from 'hono/factory'
import { logger } from '../utils/logger.js'

// Simple in-memory rate limiter for development
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
  skipSuccessfulRequests?: boolean
}

/**
 * Rate limiting middleware
 * Protects endpoints from abuse
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, skipSuccessfulRequests = false } = options

  return createMiddleware(async (c, next) => {
    const organizationId = c.get('organizationId')
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'

    const now = Date.now()
    const key = `${organizationId || clientId}:${c.req.path}`

    // Get current rate limit data
    const current = rateLimitStore.get(key)

    if (!current || now > current.resetTime) {
      // New window or expired window
      const nextWindow = {
        count: 1,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(key, nextWindow)
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Remaining', (maxRequests - nextWindow.count).toString())
      c.header('X-RateLimit-Reset', Math.ceil(nextWindow.resetTime / 1000).toString())
      await next()
      return
    }

    // Check if limit exceeded
    if (current.count >= maxRequests) {
      const resetTime = Math.ceil((current.resetTime - now) / 1000)

      logger.warn('Rate limit exceeded', {
        organization_id: organizationId,
        client_id: clientId,
        path: c.req.path,
        count: current.count,
        max_requests: maxRequests,
        retry_after: resetTime,
      })
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Remaining', '0')
      c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())

      return c.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: resetTime,
        },
        429
      )
    }

    // Increment counter
    current.count++

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', (maxRequests - current.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())

    await next()

    // Optionally don't count successful requests
    if (skipSuccessfulRequests && c.res.status < 400) {
      current.count--
    }
  })
}

/**
 * Clean up expired rate limit entries
 * This should be called periodically to prevent memory leaks
 */
export const cleanupRateLimits = () => {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach((key) => rateLimitStore.delete(key))

  if (keysToDelete.length > 0) {
    logger.info('Cleaned up expired rate limit entries', { count: keysToDelete.length })
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
