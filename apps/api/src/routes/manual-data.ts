/**
 * Manual Data Route (Repository-Based)
 * 
 * API endpoints for manual data management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getDashboardRepository, getWorkerRepository } from '@dashboard-link/database';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { WorkerService } from '../services/WorkerService';

const manualData = new Hono();

// Initialize repositories and services
const workerRepository = getWorkerRepository();
const dashboardRepository = getDashboardRepository();
const workerService = new WorkerService(workerRepository);

// All routes require authentication
manualData.use('*', authMiddleware);

// Validation schemas
const createScheduleItemSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  startTime: z.string().datetime('Start time must be a valid datetime'),
  endTime: z.string().datetime('End time must be a valid datetime'),
  type: z.enum(['shift', 'break', 'meeting', 'training']),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const createTaskItemSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().datetime('Due date must be a valid datetime').optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  assignedBy: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const updateScheduleItemSchema = createScheduleItemSchema.partial();
const updateTaskItemSchema = createTaskItemSchema.partial();

/**
 * Get all schedule items for organization
 */
manualData.get('/schedule', async (c) => {
  const organizationId = c.get('organizationId');
  const { startDate, endDate, workerId } = c.req.query();
  
  try {
    // This would typically use a ScheduleRepository
    // For now, we'll use the worker repository to get schedule data
    const scheduleItems = await workerRepository.getScheduleItems(organizationId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      workerId
    });

    return c.json({
      success: true,
      data: scheduleItems
    });
  } catch (error) {
    console.error('Get schedule items error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve schedule items'
    }, 500);
  }
});

/**
 * Create a new schedule item
 */
manualData.post('/schedule', zValidator('json', createScheduleItemSchema), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const scheduleData = c.req.valid('json');
  
  try {
    // Validate that the worker belongs to the organization
    const worker = await workerRepository.findById(scheduleData.workerId);
    
    if (!worker || worker.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Worker not found or access denied'
      }, 404);
    }

    const newScheduleItem = await workerRepository.createScheduleItem({
      ...scheduleData,
      organizationId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: newScheduleItem
    }, 201);
  } catch (error) {
    console.error('Create schedule item error:', error);
    return c.json({
      success: false,
      error: 'Failed to create schedule item'
    }, 500);
  }
});

/**
 * Update a schedule item
 */
manualData.put('/schedule/:id', zValidator('json', updateScheduleItemSchema), async (c) => {
  const organizationId = c.get('organizationId');
  const scheduleId = c.req.param('id');
  const updateData = c.req.valid('json');
  
  try {
    // First check if schedule item exists and belongs to organization
    const existingItem = await workerRepository.getScheduleItemById(scheduleId);
    
    if (!existingItem) {
      return c.json({
        success: false,
        error: 'Schedule item not found'
      }, 404);
    }

    if (existingItem.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    const updatedItem = await workerRepository.updateScheduleItem(scheduleId, {
      ...updateData,
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Update schedule item error:', error);
    return c.json({
      success: false,
      error: 'Failed to update schedule item'
    }, 500);
  }
});

/**
 * Delete a schedule item
 */
manualData.delete('/schedule/:id', async (c) => {
  const organizationId = c.get('organizationId');
  const scheduleId = c.req.param('id');
  
  try {
    // First check if schedule item exists and belongs to organization
    const existingItem = await workerRepository.getScheduleItemById(scheduleId);
    
    if (!existingItem) {
      return c.json({
        success: false,
        error: 'Schedule item not found'
      }, 404);
    }

    if (existingItem.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    await workerRepository.deleteScheduleItem(scheduleId);

    return c.json({
      success: true,
      message: 'Schedule item deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule item error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete schedule item'
    }, 500);
  }
});

/**
 * Get all task items for organization
 */
manualData.get('/tasks', async (c) => {
  const organizationId = c.get('organizationId');
  const { status, priority, workerId, dueDate } = c.req.query();
  
  try {
    // This would typically use a TaskRepository
    // For now, we'll use the worker repository to get task data
    const taskItems = await workerRepository.getTaskItems(organizationId, {
      status: status as any,
      priority: priority as any,
      workerId,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    return c.json({
      success: true,
      data: taskItems
    });
  } catch (error) {
    console.error('Get task items error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve task items'
    }, 500);
  }
});

/**
 * Create a new task item
 */
manualData.post('/tasks', zValidator('json', createTaskItemSchema), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const taskData = c.req.valid('json');
  
  try {
    // Validate that the worker belongs to the organization
    const worker = await workerRepository.findById(taskData.workerId);
    
    if (!worker || worker.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Worker not found or access denied'
      }, 404);
    }

    const newTaskItem = await workerRepository.createTaskItem({
      ...taskData,
      organizationId,
      assignedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: newTaskItem
    }, 201);
  } catch (error) {
    console.error('Create task item error:', error);
    return c.json({
      success: false,
      error: 'Failed to create task item'
    }, 500);
  }
});

/**
 * Update a task item
 */
manualData.put('/tasks/:id', zValidator('json', updateTaskItemSchema), async (c) => {
  const organizationId = c.get('organizationId');
  const taskId = c.req.param('id');
  const updateData = c.req.valid('json');
  
  try {
    // First check if task item exists and belongs to organization
    const existingItem = await workerRepository.getTaskItemById(taskId);
    
    if (!existingItem) {
      return c.json({
        success: false,
        error: 'Task item not found'
      }, 404);
    }

    if (existingItem.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    const updatedItem = await workerRepository.updateTaskItem(taskId, {
      ...updateData,
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Update task item error:', error);
    return c.json({
      success: false,
      error: 'Failed to update task item'
    }, 500);
  }
});

/**
 * Delete a task item
 */
manualData.delete('/tasks/:id', async (c) => {
  const organizationId = c.get('organizationId');
  const taskId = c.req.param('id');
  
  try {
    // First check if task item exists and belongs to organization
    const existingItem = await workerRepository.getTaskItemById(taskId);
    
    if (!existingItem) {
      return c.json({
        success: false,
        error: 'Task item not found'
      }, 404);
    }

    if (existingItem.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    await workerRepository.deleteTaskItem(taskId);

    return c.json({
      success: true,
      message: 'Task item deleted successfully'
    });
  } catch (error) {
    console.error('Delete task item error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete task item'
    }, 500);
  }
});

/**
 * Get manual data statistics
 */
manualData.get('/stats', async (c) => {
  const organizationId = c.get('organizationId');
  const { period } = c.req.query();
  
  try {
    const stats = await workerRepository.getManualDataStats(organizationId, {
      period: period as 'day' | 'week' | 'month' | 'year'
    });

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get manual data stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve manual data statistics'
    }, 500);
  }
});

/**
 * Bulk import schedule items
 */
manualData.post('/schedule/bulk', async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const { items } = await c.req.json();
  
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({
        success: false,
        error: 'Invalid or empty items array'
      }, 400);
    }

    const results = await workerRepository.bulkCreateScheduleItems(
      items.map(item => ({
        ...item,
        organizationId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    return c.json({
      success: true,
      data: {
        imported: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Bulk import schedule items error:', error);
    return c.json({
      success: false,
      error: 'Failed to bulk import schedule items'
    }, 500);
  }
});

/**
 * Bulk import task items
 */
manualData.post('/tasks/bulk', async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const { items } = await c.req.json();
  
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({
        success: false,
        error: 'Invalid or empty items array'
      }, 400);
    }

    const results = await workerRepository.bulkCreateTaskItems(
      items.map(item => ({
        ...item,
        organizationId,
        assignedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    return c.json({
      success: true,
      data: {
        imported: results.length,
        items: results
      }
    });
  } catch (error) {
    console.error('Bulk import task items error:', error);
    return c.json({
      success: false,
      error: 'Failed to bulk import task items'
    }, 500);
  }
});

export default manualData;
