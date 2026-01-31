/**
 * Workers Route (Refactored)
 *
 * API endpoints for worker management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getWorkerRepository } from '@dashboard-link/database'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { WorkerService } from '../services/WorkerService'
import type { AppContext } from '../types'
import { logger } from '../utils/logger.js'

const workers = new Hono<AppContext>()

// Initialize service with repository
const workerService = new WorkerService(getWorkerRepository())

// All routes require authentication
workers.use('*', authMiddleware)

// List workers
workers.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    // Get user's organization (this would typically use AdminRepository)
    // For now, we'll use a placeholder implementation
    const organizationId = await getOrganizationId(userId)

    const workers = await workerService.getWorkers(organizationId)
    return c.json(workers)
  } catch (error) {
    logger.error(
      'Failed to retrieve workers',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve workers' }, 500)
  }
})

// Get worker by ID with SMS statistics
workers.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
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
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
    const worker = await workerService.getWorkerById(id, organizationId)

    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json(worker)
  } catch (error) {
    logger.error(
      'Failed to retrieve worker',
      error instanceof Error ? error : new Error(String(error))
    )
    return c.json({ error: 'Failed to retrieve worker' }, 500)
  }
})

// Create worker
workers.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
    const worker = await workerService.createWorker(body, organizationId)

    // Create default dashboard for worker (this would use DashboardService)
    // For now, we'll include a placeholder
    const dashboard = await createDefaultDashboard(worker.id, organizationId)

    return c.json({ worker, dashboard }, 201)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('name')) {
        return c.json({ error: error.message }, 400)
      }
      if (error.message.includes('phone')) {
        return c.json({ error: error.message }, 400)
      }
      if (error.message.includes('email')) {
        return c.json({ error: error.message }, 400)
      }
    }

    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create worker',
      },
      400
    )
  }
})

// Update worker
workers.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  const body = await c.req.json()

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
    const worker = await workerService.updateWorker(id, body, organizationId)
    return c.json(worker)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    if (error instanceof Error) {
      if (error.message.includes('name')) {
        return c.json({ error: error.message }, 400)
      }
      if (error.message.includes('phone')) {
        return c.json({ error: error.message }, 400)
      }
      if (error.message.includes('email')) {
        return c.json({ error: error.message }, 400)
      }
    }

    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update worker',
      },
      400
    )
  }
})

// Delete worker
workers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
    await workerService.deleteWorker(id, organizationId)
    return c.json({ message: 'Worker deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to delete worker' }, 400)
  }
})

// Additional endpoints for enhanced functionality

// Search workers
workers.get('/search/:query', async (c) => {
  const query = c.req.param('query')
  const userId = c.get('userId')
  const limit = parseInt(c.req.query('limit') || '10')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
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
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
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
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
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
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error: 'Not authorized' }, 401)
  }

  try {
    const organizationId = await getOrganizationId(userId)
    const worker = await workerService.deactivateWorker(id, organizationId)
    return c.json(worker)
  } catch (error) {
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404)
    }

    return c.json({ error: 'Failed to deactivate worker' }, 500)
  }
})

// Helper functions - using direct Supabase queries per spec T042 (MVP approach)

async function getOrganizationId(userId: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  )

  const { data, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('User not found or not authorized')
  }

  return data.organization_id
}

async function createDefaultDashboard(workerId: string, organizationId: string) {
  // This would typically use DashboardService
  // For now, we'll return a placeholder
  return {
    id: 'dashboard-placeholder',
    name: 'Default Dashboard',
    workerId,
    organizationId,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export { workers }

