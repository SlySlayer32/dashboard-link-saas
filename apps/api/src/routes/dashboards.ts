import { Hono } from 'hono'
import { rateLimit } from '../middleware/rate-limit'
import { workerAuthMiddleware } from '../middleware/workerAuth'
import { dataSourceService } from '../services/data-source.service.js'
import { pluginManager as pluginManagerService } from '../services/plugin-manager.js'
import { tokenService } from '../services/token.service'
import type { AppContextVariables } from '../types.js'
import { logger } from '../utils/logger.js'

const dashboards = new Hono<{ Variables: AppContextVariables }>()

// Apply rate limiting to public endpoints
dashboards.use(
  '/*',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes per IP
    message: 'Too many dashboard access attempts, please try again later.',
  })
)

/**
 * Public endpoint - validate token and return dashboard data
 * This is accessed by workers via the SMS link
 * GET /dashboards/:token
 */
dashboards.get('/:token', accessLoggerMiddleware, workerAuthMiddleware, async (c) => {
  const ipAddress = c.get('ipAddress')
  const userAgent = c.get('userAgent')

  try {
    // Get worker details from token service (includes validation)
    const validation = await tokenService.validateToken(c.req.param('token'))

    if (!validation.valid || !validation.worker) {
      const errorReason = validation.error || 'not_found'
      let errorMessage = 'Invalid or expired link'
      let statusCode = 401

      // Log failed access attempt
      if (validation.worker) {
        await logDashboardAccess(
          validation.worker.organization_id,
          validation.worker.id,
          null, // tokenId not available in validation response
          errorReason as 'expired' | 'invalid' | 'revoked',
          ipAddress,
          userAgent
        )
      }

      // Provide user-friendly error messages based on the error type
      switch (errorReason) {
        case 'expired':
          errorMessage = 'This link has expired. Please ask your administrator for a new link.'
          break
        case 'revoked':
          errorMessage = 'This link has been revoked. Please ask your administrator for a new link.'
          break
        case 'not_found':
          errorMessage =
            'Invalid link. Please check the URL or ask your administrator for a new link.'
          break
        case 'invalid':
          errorMessage =
            'Invalid link format. Please check the URL or ask your administrator for a new link.'
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
        statusCode as 400 | 401
      )
    }

    // Log successful access
    await logDashboardAccess(
      validation.worker.organization_id,
      validation.worker.id,
      null, // tokenId not available in validation response
      'success',
      ipAddress,
      userAgent
    )

    // Get dashboard data from all configured plugins
    const pluginConfigs = await dataSourceService.getPluginConfigs(
      validation.worker.organization_id
    )
    const dashboardData = await pluginManagerService.getDashboardData(
      validation.worker.id,
      validation.worker.organization_id,
      pluginConfigs
    )

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
    logger.error(
      'Dashboard access error',
      error instanceof Error ? error : new Error(String(error))
    )

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
