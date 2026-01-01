/**
 * Workers Route (Refactored)
 * 
 * API endpoints for worker management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getWorkerRepository } from '@dashboard-link/database';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { WorkerService } from '../services/WorkerService';

const workers = new Hono();

// Initialize service with repository
const workerService = new WorkerService(getWorkerRepository());

// All routes require authentication
workers.use('*', authMiddleware);

// List workers
workers.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization (this would typically use AdminRepository)
    // For now, we'll use a placeholder implementation
    const organizationId = await getOrganizationId(userId);
    
    const workers = await workerService.getWorkers(organizationId);
    return c.json(workers);
  } catch (error) {
    console.error('Failed to get workers:', error);
    return c.json({ error: 'Failed to retrieve workers' }, 500);
  }
});

// Get worker by ID with SMS statistics
workers.get('/:id/stats', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const stats = await workerService.getWorkerStats(id, organizationId);
    return c.json(stats);
  } catch (error) {
    console.error('Failed to get worker stats:', error);
    
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json({ error: 'Failed to retrieve worker statistics' }, 500);
  }
});

// Get worker by ID
workers.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const worker = await workerService.getWorkerById(id, organizationId);
    
    if (!worker) {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json(worker);
  } catch (error) {
    console.error('Failed to get worker:', error);
    return c.json({ error: 'Failed to retrieve worker' }, 500);
  }
});

// Create worker
workers.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const organizationId = await getOrganizationId(userId);
    const worker = await workerService.createWorker(body, organizationId);
    
    // Create default dashboard for worker (this would use DashboardService)
    // For now, we'll include a placeholder
    const dashboard = await createDefaultDashboard(worker.id, organizationId);
    
    return c.json({ worker, dashboard }, 201);
  } catch (error) {
    console.error('Failed to create worker:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('name')) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes('phone')) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes('email')) {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create worker' 
    }, 400);
  }
});

// Update worker
workers.put('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const organizationId = await getOrganizationId(userId);
    const worker = await workerService.updateWorker(id, body, organizationId);
    return c.json(worker);
  } catch (error) {
    console.error('Failed to update worker:', error);
    
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('name')) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes('phone')) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes('email')) {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to update worker' 
    }, 400);
  }
});

// Delete worker
workers.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    await workerService.deleteWorker(id, organizationId);
    return c.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Failed to delete worker:', error);
    
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json({ error: 'Failed to delete worker' }, 400);
  }
});

// Additional endpoints for enhanced functionality

// Search workers
workers.get('/search/:query', async (c) => {
  const query = c.req.param('query');
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '10');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const workers = await workerService.searchWorkers(organizationId, query, limit);
    return c.json(workers);
  } catch (error) {
    console.error('Failed to search workers:', error);
    return c.json({ error: 'Failed to search workers' }, 500);
  }
});

// Get active workers
workers.get('/active/list', async (c) => {
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const workers = await workerService.getActiveWorkers(organizationId);
    return c.json(workers);
  } catch (error) {
    console.error('Failed to get active workers:', error);
    return c.json({ error: 'Failed to retrieve active workers' }, 500);
  }
});

// Activate worker
workers.post('/:id/activate', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const worker = await workerService.activateWorker(id, organizationId);
    return c.json(worker);
  } catch (error) {
    console.error('Failed to activate worker:', error);
    
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json({ error: 'Failed to activate worker' }, 500);
  }
});

// Deactivate worker
workers.post('/:id/deactivate', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  
  try {
    const organizationId = await getOrganizationId(userId);
    const worker = await workerService.deactivateWorker(id, organizationId);
    return c.json(worker);
  } catch (error) {
    console.error('Failed to deactivate worker:', error);
    
    if (error instanceof Error && error.message === 'Worker not found') {
      return c.json({ error: 'Worker not found' }, 404);
    }
    
    return c.json({ error: 'Failed to deactivate worker' }, 500);
  }
});

// Helper functions (these would typically use other repositories/services)

async function getOrganizationId(userId: string): Promise<string> {
  // This would typically use AdminRepository to get the user's organization
  // For now, we'll return a placeholder
  // In a real implementation, you would:
  // const adminRepo = getAdminRepository();
  // const admin = await adminRepo.findByAuthUserId(userId);
  // return admin.organizationId;
  
  throw new Error('Admin repository not yet implemented');
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
    updatedAt: new Date().toISOString()
  };
}

export { workers };
