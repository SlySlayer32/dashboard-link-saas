import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type {
  CreateScheduleItemRequest,
  CreateTaskItemRequest,
  UpdateScheduleItemRequest,
  UpdateTaskItemRequest,
} from '../types/manual-data'

const manualData = new Hono()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// All routes require authentication
manualData.use('*', authMiddleware)

// Middleware to validate worker belongs to organization
const validateWorker = async (workerId: string, organizationId: string) => {
  const { data: worker, error } = await supabase
    .from('workers')
    .select('id')
    .eq('id', workerId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !worker) {
    return null
  }

  return worker
}

// SCHEDULE ITEMS ENDPOINTS

// Create schedule item for worker
manualData.post('/workers/:id/schedule-items', async (c) => {
  const workerId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const body = (await c.req.json()) as CreateScheduleItemRequest

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Validate worker belongs to organization
  const worker = await validateWorker(workerId, admin.organization_id)
  if (!worker) {
    return c.json({ error: 'Worker not found' }, 404)
  }

  // Validate required fields
  if (!body.title || !body.startTime || !body.endTime) {
    return c.json({ error: 'Missing required fields: title, startTime, endTime' }, 400)
  }

  // Validate time range
  const startTime = new Date(body.startTime)
  const endTime = new Date(body.endTime)
  if (startTime >= endTime) {
    return c.json({ error: 'startTime must be before endTime' }, 400)
  }

  try {
    const { data, error } = await supabase
      .from('manual_schedule_items')
      .insert({
        organization_id: admin.organization_id,
        worker_id: workerId,
        title: body.title,
        start_time: body.startTime,
        end_time: body.endTime,
        location: body.location,
        description: body.description,
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json(data, 201)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create schedule item',
      },
      500
    )
  }
})

// Get schedule items for worker with date filtering
manualData.get('/workers/:id/schedule-items', async (c) => {
  const workerId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Validate worker belongs to organization
  const worker = await validateWorker(workerId, admin.organization_id)
  if (!worker) {
    return c.json({ error: 'Worker not found' }, 404)
  }

  // Build query
  let query = supabase
    .from('manual_schedule_items')
    .select('*', { count: 'exact' })
    .eq('organization_id', admin.organization_id)
    .eq('worker_id', workerId)
    .order('start_time', { ascending: true })

  // Apply date filtering if provided
  if (startDate) {
    query = query.gte('start_time', startDate)
  }
  if (endDate) {
    query = query.lte('start_time', endDate)
  }

  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
    },
  })
})

// Update schedule item
manualData.put('/schedule-items/:id', async (c) => {
  const itemId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const body = (await c.req.json()) as UpdateScheduleItemRequest

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // First check if item exists and belongs to organization
  const { data: existingItem } = await supabase
    .from('manual_schedule_items')
    .select('id')
    .eq('id', itemId)
    .eq('organization_id', admin.organization_id)
    .single()

  if (!existingItem) {
    return c.json({ error: 'Schedule item not found' }, 404)
  }

  // Build update object
  const updateData: any = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.startTime !== undefined) updateData.start_time = body.startTime
  if (body.endTime !== undefined) updateData.end_time = body.endTime
  if (body.location !== undefined) updateData.location = body.location
  if (body.description !== undefined) updateData.description = body.description

  // Validate time range if both times are provided
  if (body.startTime && body.endTime) {
    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)
    if (startTime >= endTime) {
      return c.json({ error: 'startTime must be before endTime' }, 400)
    }
  }

  try {
    const { data, error } = await supabase
      .from('manual_schedule_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('organization_id', admin.organization_id)
      .select()
      .single()

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json(data)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update schedule item',
      },
      500
    )
  }
})

// Delete schedule item
manualData.delete('/schedule-items/:id', async (c) => {
  const itemId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const { error } = await supabase
    .from('manual_schedule_items')
    .delete()
    .eq('id', itemId)
    .eq('organization_id', admin.organization_id)

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.body(null, 204)
})

// TASK ITEMS ENDPOINTS

// Create task item for worker
manualData.post('/workers/:id/task-items', async (c) => {
  const workerId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const body = (await c.req.json()) as CreateTaskItemRequest

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Validate worker belongs to organization
  const worker = await validateWorker(workerId, admin.organization_id)
  if (!worker) {
    return c.json({ error: 'Worker not found' }, 404)
  }

  // Validate required fields
  if (!body.title || !body.priority || !body.status) {
    return c.json({ error: 'Missing required fields: title, priority, status' }, 400)
  }

  // Validate priority and status values
  if (!['low', 'medium', 'high'].includes(body.priority)) {
    return c.json({ error: 'Invalid priority. Must be: low, medium, or high' }, 400)
  }
  if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
    return c.json({ error: 'Invalid status. Must be: pending, in_progress, or completed' }, 400)
  }

  try {
    const { data, error } = await supabase
      .from('manual_task_items')
      .insert({
        organization_id: admin.organization_id,
        worker_id: workerId,
        title: body.title,
        description: body.description,
        due_date: body.dueDate,
        priority: body.priority,
        status: body.status,
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json(data, 201)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create task item',
      },
      500
    )
  }
})

// Get task items for worker with date filtering
manualData.get('/workers/:id/task-items', async (c) => {
  const workerId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // Validate worker belongs to organization
  const worker = await validateWorker(workerId, admin.organization_id)
  if (!worker) {
    return c.json({ error: 'Worker not found' }, 404)
  }

  // Build query
  let query = supabase
    .from('manual_task_items')
    .select('*', { count: 'exact' })
    .eq('organization_id', admin.organization_id)
    .eq('worker_id', workerId)
    .order('priority', { ascending: false }) // High priority first
    .order('due_date', { ascending: true }) // Earlier due dates first

  // Apply date filtering if provided
  if (startDate) {
    query = query.gte('due_date', startDate)
  }
  if (endDate) {
    query = query.lte('due_date', endDate)
  }

  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return c.json({ error: error.message }, 500)
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages,
    },
  })
})

// Update task item
manualData.put('/task-items/:id', async (c) => {
  const itemId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')
  const body = (await c.req.json()) as UpdateTaskItemRequest

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  // First check if item exists and belongs to organization
  const { data: existingItem } = await supabase
    .from('manual_task_items')
    .select('id')
    .eq('id', itemId)
    .eq('organization_id', admin.organization_id)
    .single()

  if (!existingItem) {
    return c.json({ error: 'Task item not found' }, 404)
  }

  // Build update object
  const updateData: any = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.dueDate !== undefined) updateData.due_date = body.dueDate
  if (body.priority !== undefined) {
    if (!['low', 'medium', 'high'].includes(body.priority)) {
      return c.json({ error: 'Invalid priority. Must be: low, medium, or high' }, 400)
    }
    updateData.priority = body.priority
  }
  if (body.status !== undefined) {
    if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
      return c.json({ error: 'Invalid status. Must be: pending, in_progress, or completed' }, 400)
    }
    updateData.status = body.status
  }

  try {
    const { data, error } = await supabase
      .from('manual_task_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('organization_id', admin.organization_id)
      .select()
      .single()

    if (error) {
      return c.json({ error: error.message }, 400)
    }

    return c.json(data)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update task item',
      },
      500
    )
  }
})

// Delete task item
manualData.delete('/task-items/:id', async (c) => {
  const itemId = c.req.param('id')
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId')

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('organization_id')
    .eq('auth_user_id', userId)
    .single()

  if (!admin) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const { error } = await supabase
    .from('manual_task_items')
    .delete()
    .eq('id', itemId)
    .eq('organization_id', admin.organization_id)

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.body(null, 204)
})

export default manualData
