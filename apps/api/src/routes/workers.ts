/**
 * Workers Route (Refactored)
 *
 * API endpoints for worker management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getWorkerRepository } from '@dashboard-link/database'
import { createWorkerSchema, updateWorkerSchema } from '@dashboard-link/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rate-limit'
import { tenantMiddleware } from '../middleware/tenant'
import { WorkerService } from '../services/WorkerService'
import type { AppContextVariables } from '../types'
import { logger } from '../utils/logger.js'

const workers = new Hono<{ Variables: AppContextVariables }>()

// Initialize service with repository
const workerRepository = getWorkerRepository()
const workerService = new WorkerService(workerRepository)

const listWorkersQuerySchema = z.object({
  include_deleted: z.coerce.boolean().optional().default(false),
  search: z.string().trim().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
})

const createValidationErrorBody = (issues: Array<{ field: string; message: string }>) => ({
  error: 'Validation failed',
  details: issues,
})

const createFieldValidationError = (field: string, message: string) =>
  createValidationErrorBody([{ field, message }])

// All routes require authentication
workers.use('*', authMiddleware)
workers.use('*', tenantMiddleware)
workers.use('*', rateLimit({ windowMs: 60_000, maxRequests: 100 }))

// List workers
workers.get(
  '/',
  zValidator('query', listWorkersQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        createValidationErrorBody(
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        ),
        400
      )
    }
  }),
  async (c) => {
    const organizationId = c.get('organizationId')
    const query = c.req.valid('query')

    if (!organizationId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const workerList = query.search
        ? query.include_deleted
          ? await workerService.searchWorkersIncludingDeleted(
              organizationId,
              query.search,
              query.limit
            )
          : await workerService.searchWorkers(organizationId, query.search, query.limit)
        : query.include_deleted
          ? await workerService.getWorkersIncludingDeleted(organizationId, query.limit)
          : (await workerService.getWorkers(organizationId)).slice(0, query.limit)
      return c.json({ workers: workerList, total: workerList.length })
    } catch (error) {
      logger.error(
        'Failed to retrieve workers',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'list_workers',
          success: false,
          organization_id: organizationId,
          error_type: 'unknown',
        }
      )
      return c.json({ error: 'Failed to retrieve workers' }, 500)
    }
  }
)

// Get worker by ID with SMS statistics
workers.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const stats = await workerService.getWorkerStats(id, organizationId)
    return c.json(stats)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to retrieve worker statistics' }, 500)
  }
})

// Get worker by ID
workers.get('/:id', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const worker = await workerService.getWorkerById(id, organizationId)

    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ worker })
  } catch (error) {
    logger.error(
      'Failed to retrieve worker',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve worker' }, 500)
  }
})

// Create worker
workers.post('/', zValidator('json', createWorkerSchema), async (c) => {
  const organizationId = c.get('organizationId')
  const body = c.req.valid('json')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const worker = await workerService.createWorker(body, organizationId)
    return c.json({ worker }, 201)
  } catch (error) {
    if (error instanceof Error) {
      // Duplicate phone number (FR-016)
      if (error.message.includes('already in use')) {
        return c.json(
          {
            error: 'Phone number already in use by an active worker',
          },
          409
        )
      }
      // Validation errors (FR-020)
      if (
        error.message.includes('name') ||
        error.message.includes('phone') ||
        error.message.includes('email')
      ) {
        return c.json(
          createFieldValidationError(
            error.message.toLowerCase().includes('name')
              ? 'name'
              : error.message.toLowerCase().includes('phone')
                ? 'phone'
                : 'email',
            error.message
          ),
          400
        )
      }
    }

    logger.error(
      'Failed to create worker',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to create worker' }, 500)
  }
})

// Update worker (changed from PATCH to PUT per spec)
workers.put(
  '/:id',
  zValidator('json', updateWorkerSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        createValidationErrorBody(
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        ),
        400
      )
    }
  }),
  async (c) => {
    const id = c.req.param('id')
    const organizationId = c.get('organizationId')
    const body = c.req.valid('json')

    if (!organizationId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const worker = await workerService.updateWorker(id, body, organizationId)
      return c.json({ worker })
    } catch (error) {
      if (error instanceof Error) {
        // Worker not found
        if (error.message === 'Worker not found') {
          return c.json({ error: 'Worker not found' }, 404)
        }

        // Concurrent edit conflict (FR-019, U1)
        if (
          'statusCode' in error &&
          error.statusCode === 409 &&
          error.message.includes('updated by another user')
        ) {
          return c.json(
            {
              error: 'Worker was updated by another user. Please refresh and try again.',
            },
            409
          )
        }

        // Duplicate phone number (FR-016)
        if (error.message.includes('already in use')) {
          return c.json(
            createFieldValidationError('phone', 'Phone number already in use by an active worker'),
            409
          )
        }

        // Validation errors (FR-020)
        if (
          error.message.includes('name') ||
          error.message.includes('phone') ||
          error.message.includes('email')
        ) {
          return c.json(
            createFieldValidationError(
              error.message.toLowerCase().includes('name')
                ? 'name'
                : error.message.toLowerCase().includes('phone')
                  ? 'phone'
                  : 'email',
              error.message
            ),
            400
          )
        }
      }

      logger.error(
        'Failed to update worker',
        error instanceof Error ? error : new Error(String(error))
      )
      return c.json({ error: 'Failed to update worker' }, 500)
    }
  }
)

// Delete worker (soft delete)
workers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await workerService.deleteWorker(id, organizationId)
    return c.json({ success: true, message: 'Worker deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to delete worker',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to delete worker' }, 500)
  }
})

// Additional endpoints for enhanced functionality

// Search workers
workers.get('/search/:query', async (c) => {
  const query = c.req.param('query')
  const organizationId = c.get('organizationId')
  const limit = parseInt(c.req.query('limit') || '10')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const workers = await workerService.searchWorkers(organizationId, query, limit)
    return c.json(workers)
  } catch (error) {
    logger.error(
      'Failed to search workers',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to search workers' }, 500)
  }
})

// Get active workers
workers.get('/active/list', async (c) => {
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const workers = await workerService.getActiveWorkers(organizationId)
    return c.json(workers)
  } catch (error) {
    logger.error(
      'Failed to retrieve active workers',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve active workers' }, 500)
  }
})

// Activate worker
workers.post('/:id/activate', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const worker = await workerService.activateWorker(id, organizationId)
    return c.json(worker)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to activate worker' }, 500)
  }
})

// Deactivate worker
workers.post('/:id/deactivate', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const worker = await workerService.deactivateWorker(id, organizationId)
    return c.json(worker)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to deactivate worker' }, 500)
  }
})

export { workers }
