/**
 * Access Logs API Routes
 *
 * Endpoints for viewing access logs and analytics
 * Admin-only endpoints for tracking worker dashboard access
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware'
import { logger } from '../utils/logger.js'
import type { AppContextVariables } from '../types.js'

const accessLogs = new Hono<{ Variables: AppContextVariables }>()

// Apply authentication middleware to all routes
accessLogs.use('*', authMiddleware)

// Lazy-load repository to avoid circular dependency issues
let accessLogRepo: any = null
async function getAccessLogRepo() {
  if (!accessLogRepo) {
    const { getAccessLogRepository } = await import('@dashboard-link/database')
    accessLogRepo = getAccessLogRepository()
  }
  return accessLogRepo
}

// Query schema for list endpoint
const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
})

/**
 * GET /api/v1/access-logs
 * List all access logs for the authenticated organization
 */
accessLogs.get('/', zValidator('query', listQuerySchema), async (c) => {
  try {
    const organizationId = c.get('organizationId')
    if (!organizationId) {
      return c.json({ success: false, error: 'Organization ID not found' }, 401)
    }

    const { limit, offset } = c.req.valid('query')
    const repo = await getAccessLogRepo()

    const logs = await repo.findByOrganizationId(organizationId, limit, offset)

    return c.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        total: logs.length,
      },
    })
  } catch (error) {
    logger.error(
      'Failed to fetch access logs',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json(
      {
        success: false,
        error: 'Failed to fetch access logs',
      },
      500
    )
  }
})

/**
 * GET /api/v1/access-logs/worker/:workerId
 * Get access logs for a specific worker
 */
accessLogs.get('/worker/:workerId', zValidator('query', listQuerySchema), async (c) => {
  try {
    const organizationId = c.get('organizationId')
    if (!organizationId) {
      return c.json({ success: false, error: 'Organization ID not found' }, 401)
    }

    const workerId = c.req.param('workerId')
    const { limit, offset } = c.req.valid('query')
    const repo = await getAccessLogRepo()

    const logs = await repo.findByWorkerId(workerId, limit, offset)

    // Verify logs belong to the organization (security check)
    if (logs.length > 0 && logs[0].organizationId !== organizationId) {
      return c.json(
        {
          success: false,
          error: 'Access denied',
        },
        403
      )
    }

    return c.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        total: logs.length,
      },
    })
  } catch (error) {
    logger.error(
      'Failed to fetch worker access logs',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json(
      {
        success: false,
        error: 'Failed to fetch worker access logs',
      },
      500
    )
  }
})

/**
 * GET /api/v1/access-logs/stats
 * Get access statistics and analytics for the organization
 */
accessLogs.get('/stats', async (c) => {
  try {
    const organizationId = c.get('organizationId')
    if (!organizationId) {
      return c.json({ success: false, error: 'Organization ID not found' }, 401)
    }

    const repo = await getAccessLogRepo()

    // Get overall organization stats
    const stats = await repo.getOrganizationStats(organizationId)

    // Get per-worker stats
    const workerStats = await repo.getWorkerAccessStats(organizationId)

    return c.json({
      success: true,
      data: {
        overall: stats,
        workers: workerStats,
      },
    })
  } catch (error) {
    logger.error(
      'Failed to fetch access statistics',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json(
      {
        success: false,
        error: 'Failed to fetch access statistics',
      },
      500
    )
  }
})

/**
 * GET /api/v1/access-logs/worker/:workerId/last
 * Get the last successful access for a specific worker
 */
accessLogs.get('/worker/:workerId/last', async (c) => {
  try {
    const organizationId = c.get('organizationId')
    if (!organizationId) {
      return c.json({ success: false, error: 'Organization ID not found' }, 401)
    }

    const workerId = c.req.param('workerId')
    const repo = await getAccessLogRepo()

    const lastAccess = await repo.findLastAccessByWorkerId(workerId)

    // Verify access log belongs to the organization (security check)
    if (lastAccess && lastAccess.organizationId !== organizationId) {
      return c.json(
        {
          success: false,
          error: 'Access denied',
        },
        403
      )
    }

    return c.json({
      success: true,
      data: lastAccess,
    })
  } catch (error) {
    logger.error(
      'Failed to fetch last access',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json(
      {
        success: false,
        error: 'Failed to fetch last access',
      },
      500
    )
  }
})

export default accessLogs
