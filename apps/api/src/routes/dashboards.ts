import { Hono } from 'hono'
import { rateLimit } from '../middleware/rate-limit'
import { workerAuthMiddleware } from '../middleware/workerAuth'
import { tokenService } from '../services/token.service'
import type { AppContextVariables } from '../types.js'
import { logger } from '../utils/logger.js'

const dashboards = new Hono<{ Variables: AppContextVariables }>()

// Apply rate limiting to public endpoints
dashboards.use('/*', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes per IP
  message: 'Too many dashboard access attempts, please try again later.',
}))

/**
 * Public endpoint - validate token and return dashboard data
 * This is accessed by workers via the SMS link
 * GET /dashboards/:token
 */
dashboards.get('/:token', workerAuthMiddleware, async (c) => {
  try {
    // Get worker details from token service (includes validation)
    const validation = await tokenService.validateToken(c.req.param('token'))

    if (!validation.valid || !validation.worker) {
      const errorReason = validation.error || 'not_found'
      let errorMessage = 'Invalid or expired link'
      let statusCode = 401

      // Provide user-friendly error messages based on the error type
      switch (errorReason) {
        case 'expired':
          errorMessage = 'This link has expired. Please ask your administrator for a new link.'
          break
        case 'revoked':
          errorMessage = 'This link has been revoked. Please ask your administrator for a new link.'
          break
        case 'not_found':
          errorMessage = 'Invalid link. Please check the URL or ask your administrator for a new link.'
          break
        case 'invalid':
          errorMessage = 'Invalid link format. Please check the URL or ask your administrator for a new link.'
          statusCode = 400
          break
      }

      return c.json(
        {
          success: false,
          error: {
            code: errorReason.toUpperCase(),
            message: errorMessage,
            reason: errorReason,
          },
        },
        statusCode as any
      )
    }

    // Get dashboard data from all configured plugins
    // TODO: Implement PluginManagerService.getDashboardData
    const dashboardData = { schedule: [], tasks: [] } // Placeholder

    return c.json({
      success: true,
      data: {
        worker: {
          id: validation.worker.id,
          full_name: validation.worker.full_name,
        },
        schedule: dashboardData.schedule || [],
        tasks: dashboardData.tasks || [],
      },
    })
  } catch (error) {
    logger.error('Dashboard access error', error instanceof Error ? error : new Error(String(error)))

    // Return a generic error to avoid leaking implementation details
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load dashboard. Please try again later.',
        },
      },
      500
    )
  }
})

export default dashboards
