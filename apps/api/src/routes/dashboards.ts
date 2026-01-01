import { createTokenManager } from '@dashboard-link/tokens';
import { Hono } from 'hono';
import { PluginManagerService } from '../services/plugin-manager';
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

const dashboards = new Hono()

/**
 * Public endpoint - validate token and return dashboard data
 * This is accessed by workers via the SMS link
 */
dashboards.get('/:token', async (c) => {
  const token = c.req.param('token')

  try {
    // Validate token
    const validation = await tokenManager.validateToken(token)

    if (!validation.valid || !validation.payload) {
      return c.json(
        {
          error: 'Invalid or expired link',
          reason: validation.error || 'not_found',
        },
        401
      )
    }

    // Get worker ID from token metadata
    const workerId = validation.payload.metadata?.workerId || validation.payload.userId

    // Get dashboard data from all configured plugins
    const dashboardData = await PluginManagerService.getDashboardData(workerId)

    return c.json({
      worker: validation.payload,
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
