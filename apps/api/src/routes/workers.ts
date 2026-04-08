/**
 * Workers Route (Refactored)
 *
 * API endpoints for worker management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getAccessLogRepository, getWorkerRepository } from '@dashboard-link/database'
import { createWorkerSchema, updateWorkerSchema, type Worker } from '@dashboard-link/shared'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rate-limit.js'
import { tenantContextMiddleware as tenantMiddleware } from '../middleware/tenant.js'
import { WorkerService } from '../services/WorkerService.js'
import type { AppContextVariables } from '../types'
import { logger } from '../utils/logger.js'

const workers = new Hono<{ Variables: AppContextVariables }>()

// Initialize service with repository
const workerRepository = getWorkerRepository()
const accessLogRepository = getAccessLogRepository()
const workerService = new WorkerService(workerRepository)

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

const listWorkersQuerySchema = z.object({
  include_deleted: z.coerce.boolean().optional().default(false),
  active: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
})

const createValidationErrorBody = (issues: Array<{ field: string; message: string }>) => ({
  error: 'Validation failed',
  details: issues,
})

const createFieldValidationError = (field: string, message: string) =>
  createValidationErrorBody([{ field, message }])

const scheduleItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
})

const taskItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'completed']),
})

async function ensureWorkerAccess(workerId: string, organizationId: string) {
  const worker = await workerService.getWorkerById(workerId, organizationId)

  if (!worker) {
    throw new Error('Worker not found')
  }

  return worker
}

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
      let workerList: Worker[]

      if (query.search) {
        workerList = query.include_deleted
          ? await workerService.searchWorkersIncludingDeleted(
              organizationId,
              query.search,
              query.limit
            )
          : await workerService.searchWorkers(organizationId, query.search, query.limit)
      } else if (query.active !== undefined) {
        // Handle active filtering
        workerList = query.include_deleted
          ? await workerService.searchWorkersIncludingDeleted(organizationId, '', query.limit)
          : await workerService.getWorkersByActiveStatus(organizationId, query.active)
        // getWorkersByActiveStatus already filters by active status — no redundant filter needed
      } else if (query.include_deleted) {
        workerList = await workerService.getWorkersIncludingDeleted(organizationId, query.limit)
      } else {
        workerList = await workerService.getWorkers(organizationId)
      }

      // Apply limit
      if (query.limit && workerList.length > query.limit) {
        workerList = workerList.slice(0, query.limit)
      }

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

// Search workers (must be before /:id to avoid Hono matching "search" as :id)
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

// Get active workers (must be before /:id to avoid Hono matching "active" as :id)
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

// Get worker by ID with SMS statistics
workers.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const stats = await workerService.getWorkerStats(id, organizationId)
    const lastAccess = await accessLogRepository.findLastAccessByWorkerId(id)

    return c.json({
      ...stats,
      access: {
        lastOpenedAt: lastAccess?.accessedAt || null,
        totalOpens: await accessLogRepository.count({ where: { workerId: id } }),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to retrieve worker statistics' }, 500)
  }
})

workers.get('/:id/access-logs', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(id, organizationId)

    const accessLogs = await accessLogRepository.findByWorkerId(id, limit)

    return c.json({
      success: true,
      data: accessLogs.map((log) => ({
        id: log.id,
        workerId: log.workerId,
        tokenId: log.tokenId,
        accessedAt: log.accessedAt,
        validationStatus: log.validationStatus,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to retrieve access logs',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve access logs' }, 500)
  }
})

workers.get('/:id/schedule-items', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(id, organizationId)

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('schedule_items')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('worker_id', id)
      .order('start_time', { ascending: true })

    if (startDate) {
      query = query.gte('start_time', `${startDate}T00:00:00`)
    }

    if (endDate) {
      query = query.lte('start_time', `${endDate}T23:59:59`)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) {
      throw error
    }

    return c.json({
      data:
        data?.map((item) => ({
          id: item.id,
          title: item.title,
          startTime: item.start_time,
          endTime: item.end_time,
          location: item.location || undefined,
          description: item.notes || undefined,
          sourceType: 'manual',
          metadata: {},
        })) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to retrieve schedule items',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve schedule items' }, 500)
  }
})

workers.post('/:id/schedule-items', zValidator('json', scheduleItemSchema), async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')
  const payload = c.req.valid('json')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(id, organizationId)

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        organization_id: organizationId,
        worker_id: id,
        title: payload.title,
        start_time: payload.startTime,
        end_time: payload.endTime,
        location: payload.location || null,
        notes: payload.description || null,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw error || new Error('Schedule item could not be created')
    }

    return c.json(
      {
        id: data.id,
        title: data.title,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location || undefined,
        description: data.notes || undefined,
        sourceType: 'manual',
        metadata: {},
      },
      201
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to create schedule item',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to create schedule item' }, 500)
  }
})

workers.put(
  '/:workerId/schedule-items/:itemId',
  zValidator('json', scheduleItemSchema.partial()),
  async (c) => {
    const workerId = c.req.param('workerId')
    const itemId = c.req.param('itemId')
    const organizationId = c.get('organizationId')
    const payload = c.req.valid('json')

    if (!organizationId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      await ensureWorkerAccess(workerId, organizationId)

      const supabase = getSupabaseAdmin()
      const updatePayload: Record<string, unknown> = {}

      if (payload.title !== undefined) updatePayload.title = payload.title
      if (payload.startTime !== undefined) updatePayload.start_time = payload.startTime
      if (payload.endTime !== undefined) updatePayload.end_time = payload.endTime
      if (payload.location !== undefined) updatePayload.location = payload.location || null
      if (payload.description !== undefined) updatePayload.notes = payload.description || null

      const { data, error } = await supabase
        .from('schedule_items')
        .update(updatePayload)
        .eq('id', itemId)
        .eq('organization_id', organizationId)
        .eq('worker_id', workerId)
        .select('*')
        .single()

      if (error || !data) {
        throw error || new Error('Schedule item not found')
      }

      return c.json({
        id: data.id,
        title: data.title,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location || undefined,
        description: data.notes || undefined,
        sourceType: 'manual',
        metadata: {},
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Worker not found') {
        return c.json({ error: 'Worker not found' }, 404)
      }

      logger.error(
        'Failed to update schedule item',
        error instanceof Error ? error : new Error(String(error))
      )
      return c.json({ error: 'Failed to update schedule item' }, 500)
    }
  }
)

workers.delete('/:workerId/schedule-items/:itemId', async (c) => {
  const workerId = c.req.param('workerId')
  const itemId = c.req.param('itemId')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(workerId, organizationId)

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .eq('worker_id', workerId)

    if (error) {
      throw error
    }

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to delete schedule item',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to delete schedule item' }, 500)
  }
})

workers.get('/:id/task-items', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const page = Math.max(parseInt(c.req.query('page') || '1', 10), 1)
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100)

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(id, organizationId)

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('task_items')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('worker_id', id)
      .order('due_date', { ascending: true })

    if (startDate) {
      query = query.gte('due_date', `${startDate}T00:00:00`)
    }

    if (endDate) {
      query = query.lte('due_date', `${endDate}T23:59:59`)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) {
      throw error
    }

    return c.json({
      data:
        data?.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          dueDate: item.due_date || undefined,
          priority: item.priority || 'medium',
          status: item.completed ? 'completed' : 'pending',
          metadata: {},
        })) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to retrieve task items',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve task items' }, 500)
  }
})

workers.post('/:id/task-items', zValidator('json', taskItemSchema), async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')
  const payload = c.req.valid('json')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(id, organizationId)

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('task_items')
      .insert({
        organization_id: organizationId,
        worker_id: id,
        title: payload.title,
        description: payload.description || null,
        due_date: payload.dueDate || null,
        priority: payload.priority,
        completed: payload.status === 'completed',
      })
      .select('*')
      .single()

    if (error || !data) {
      throw error || new Error('Task item could not be created')
    }

    return c.json(
      {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        dueDate: data.due_date || undefined,
        priority: data.priority || 'medium',
        status: data.completed ? 'completed' : 'pending',
        metadata: {},
      },
      201
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to create task item',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to create task item' }, 500)
  }
})

workers.put('/:workerId/task-items/:itemId', zValidator('json', taskItemSchema.partial()), async (c) => {
  const workerId = c.req.param('workerId')
  const itemId = c.req.param('itemId')
  const organizationId = c.get('organizationId')
  const payload = c.req.valid('json')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(workerId, organizationId)

    const supabase = getSupabaseAdmin()
    const updatePayload: Record<string, unknown> = {}

    if (payload.title !== undefined) updatePayload.title = payload.title
    if (payload.description !== undefined) updatePayload.description = payload.description || null
    if (payload.dueDate !== undefined) updatePayload.due_date = payload.dueDate || null
    if (payload.priority !== undefined) updatePayload.priority = payload.priority
    if (payload.status !== undefined) updatePayload.completed = payload.status === 'completed'

    const { data, error } = await supabase
      .from('task_items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .eq('worker_id', workerId)
      .select('*')
      .single()

    if (error || !data) {
      throw error || new Error('Task item not found')
    }

    return c.json({
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      dueDate: data.due_date || undefined,
      priority: data.priority || 'medium',
      status: data.completed ? 'completed' : 'pending',
      metadata: {},
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to update task item',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to update task item' }, 500)
  }
})

workers.delete('/:workerId/task-items/:itemId', async (c) => {
  const workerId = c.req.param('workerId')
  const itemId = c.req.param('itemId')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await ensureWorkerAccess(workerId, organizationId)

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('task_items')
      .delete()
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .eq('worker_id', workerId)

    if (error) {
      throw error
    }

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to delete task item',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to delete task item' }, 500)
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

// Restore worker (undelete)
workers.post('/:id/restore', async (c) => {
  const id = c.req.param('id')
  const organizationId = c.get('organizationId')

  if (!organizationId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const worker = await workerService.updateWorker(
      id,
      { active: true } as Parameters<typeof workerService.updateWorker>[1],
      organizationId
    )
    return c.json({ worker, message: 'Worker restored successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    logger.error(
      'Failed to restore worker',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to restore worker' }, 500)
  }
})

export { workers }
