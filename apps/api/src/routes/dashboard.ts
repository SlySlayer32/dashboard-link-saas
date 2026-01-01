/**
 * Dashboard Route (Repository-Based)
 * 
 * API endpoints for dashboard management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { createContainerFromEnvironment, getDashboardRepository, initializeContainer } from '@dashboard-link/database';
import type { Dashboard } from '@dashboard-link/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, type AuthContext } from '../middleware/auth';

// Initialize container if not already done
if (!process.env.DB_INITIALIZED) {
  initializeContainer(createContainerFromEnvironment());
  process.env.DB_INITIALIZED = 'true';
}

const dashboard = new Hono<AuthContext>();

// Initialize repository
const dashboardRepository = getDashboardRepository();

// All routes require authentication
dashboard.use('*', authMiddleware);

// Validation schemas
const createDashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  config: z.object({
    layout: z.string().optional(),
    theme: z.string().optional(),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      }),
      config: z.record(z.string(), z.any()).optional()
    })).optional()
  }).optional()
});

const updateDashboardSchema = createDashboardSchema.partial().extend({
  active: z.boolean().optional()
});

/**
 * Get dashboard statistics
 */
dashboard.get('/stats', async (c) => {
  const organizationId = c.get('organizationId');
  
  try {
    // Get dashboard count for the organization
    const dashboards = await dashboardRepository.findMany({
      where: { organizationId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });

    const stats = {
      totalDashboards: dashboards.length,
      activeDashboards: dashboards.filter((d: Dashboard) => d.active).length,
      inactiveDashboards: dashboards.filter((d: Dashboard) => !d.active).length
    };

    return c.json({
      success: true,
      data: stats
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    }, 500);
  }
});

/**
 * List all dashboards for the organization
 */
dashboard.get('/', async (c) => {
  const organizationId = c.get('organizationId');
  
  try {
    const dashboards = await dashboardRepository.findMany({
      where: { organizationId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });

    return c.json({
      success: true,
      data: dashboards
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboards'
    }, 500);
  }
});

/**
 * Get a specific dashboard by ID
 */
dashboard.get('/:id', async (c) => {
  const dashboardId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const dashboard = await dashboardRepository.findById(dashboardId);

    if (!dashboard) {
      return c.json({
        success: false,
        error: 'Dashboard not found'
      }, 404);
    }

    // Ensure the dashboard belongs to the user's organization
    if (dashboard.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    return c.json({
      success: true,
      data: dashboard
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard'
    }, 500);
  }
});

/**
 * Create a new dashboard
 */
dashboard.post('/', zValidator('json', createDashboardSchema), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const dashboardData = c.req.valid('json');
  
  try {
    const newDashboard = await dashboardRepository.create({
      ...dashboardData,
      organizationId,
      workerId: userId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: newDashboard
    }, 201);
  } catch {
    return c.json({
      success: false,
      error: 'Failed to create dashboard'
    }, 500);
  }
});

/**
 * Update a dashboard
 */
dashboard.put('/:id', zValidator('json', updateDashboardSchema), async (c) => {
  const dashboardId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const updateData = c.req.valid('json');
  
  try {
    // First check if dashboard exists and belongs to organization
    const existingDashboard = await dashboardRepository.findById(dashboardId);
    
    if (!existingDashboard) {
      return c.json({
        success: false,
        error: 'Dashboard not found'
      }, 404);
    }

    if (existingDashboard.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    const updatedDashboard = await dashboardRepository.update(dashboardId, {
      ...updateData,
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: updatedDashboard
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to update dashboard'
    }, 500);
  }
});

/**
 * Delete a dashboard
 */
dashboard.delete('/:id', async (c) => {
  const dashboardId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    // First check if dashboard exists and belongs to organization
    const existingDashboard = await dashboardRepository.findById(dashboardId);
    
    if (!existingDashboard) {
      return c.json({
        success: false,
        error: 'Dashboard not found'
      }, 404);
    }

    if (existingDashboard.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    await dashboardRepository.delete(dashboardId);

    return c.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to delete dashboard'
    }, 500);
  }
});

/**
 * Duplicate a dashboard
 */
dashboard.post('/:id/duplicate', async (c) => {
  const dashboardId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const { name } = await c.req.json();
  
  try {
    // First check if dashboard exists and belongs to organization
    const existingDashboard = await dashboardRepository.findById(dashboardId);
    
    if (!existingDashboard) {
      return c.json({
        success: false,
        error: 'Dashboard not found'
      }, 404);
    }

    if (existingDashboard.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    // Create a copy of the dashboard
    const duplicatedDashboard = await dashboardRepository.create({
      name: name || `${existingDashboard.name} (Copy)`,
      description: existingDashboard.description,
      config: existingDashboard.config,
      organizationId,
      workerId: userId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return c.json({
      success: true,
      data: duplicatedDashboard
    }, 201);
  } catch {
    return c.json({
      success: false,
      error: 'Failed to duplicate dashboard'
    }, 500);
  }
});

/**
 * Get dashboard activity logs
 */
dashboard.get('/:id/activity', async (c) => {
  const dashboardId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const limit = parseInt(c.req.query('limit') || '50');
  
  try {
    // First check if dashboard exists and belongs to organization
    const existingDashboard = await dashboardRepository.findById(dashboardId);
    
    if (!existingDashboard) {
      return c.json({
        success: false,
        error: 'Dashboard not found'
      }, 404);
    }

    if (existingDashboard.organizationId !== organizationId) {
      return c.json({
        success: false,
        error: 'Access denied'
      }, 403);
    }

    // Return placeholder activity data for now
    const activity = {
      dashboardId,
      activities: [],
      total: 0,
      limit
    };

    return c.json({
      success: true,
      data: activity
    });
  } catch {
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard activity'
    }, 500);
  }
});

export default dashboard;
