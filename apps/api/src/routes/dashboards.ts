import { logger } from '@dashboard-link/shared'
import { Hono } from 'hono'
import { PluginManagerService } from '../services/plugin-manager'
import { TokenService } from '../services/token.service'

const dashboards = new Hono()

/**
 * Public endpoint - validate token and return dashboard data
 * This is accessed by workers via the SMS link
 */
dashboards.get('/:token', async (c) => {
  const token = c.req.param('token')

  try {
    // Validate token
    const validation = await TokenService.validateToken(token)

    if (!validation.valid || !validation.workerId) {
      return c.json(
        {
          error: 'Invalid or expired link',
          reason: validation.reason || 'not_found',
        },
        401
      )
    }

    // Get dashboard data from all configured plugins
    const dashboardData = await PluginManagerService.getDashboardData(validation.workerId)

    return c.json({
      worker: validation.workerData,
      schedule: dashboardData.schedule,
      tasks: dashboardData.tasks,
    })
  } catch (error) {
    logger.error('Dashboard error', error as Error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
      },
      500
    )
  }
})

export default dashboards
