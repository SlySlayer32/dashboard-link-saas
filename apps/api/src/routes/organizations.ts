/**
 * Organizations Route (Repository-Based)
 * 
 * API endpoints for organization management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { getOrganizationRepository } from '@dashboard-link/database';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { OrganizationService } from '../services/OrganizationService';

const organizations = new Hono();

// Initialize service with repository
const organizationService = new OrganizationService(getOrganizationRepository());

// All routes require authentication
organizations.use('*', authMiddleware);

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').optional(),
  settings: z.object({
    timezone: z.string().optional(),
    currency: z.string().optional(),
    dateFormat: z.string().optional(),
    smsProvider: z.string().optional(),
    smsSettings: z.object({
      senderId: z.string().optional(),
      enableScheduling: z.boolean().optional(),
      maxDailySends: z.number().optional()
    }).optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Get current organization details
 */
organizations.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization (this would typically use AdminRepository)
    // For now, we'll use a placeholder implementation
    const organizationId = await getOrganizationId(userId);
    
    const organization = await organizationService.getOrganization(organizationId);
    
    if (!organization) {
      return c.json({
        success: false,
        error: 'Organization not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve organization'
    }, 500);
  }
});

/**
 * Update organization details
 */
organizations.put('/', zValidator('json', updateOrganizationSchema), async (c) => {
  const userId = c.get('userId');
  const updateData = c.req.valid('json');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    const updatedOrganization = await organizationService.updateOrganization(
      organizationId,
      updateData
    );

    return c.json({
      success: true,
      data: updatedOrganization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    return c.json({
      success: false,
      error: 'Failed to update organization'
    }, 500);
  }
});

/**
 * Get organization statistics
 */
organizations.get('/stats', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    const stats = await organizationService.getOrganizationStats(organizationId);

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve organization statistics'
    }, 500);
  }
});

/**
 * Search organizations (admin only)
 */
organizations.get('/search', async (c) => {
  const query = c.req.query('q');
  const limit = parseInt(c.req.query('limit') || '10');
  
  try {
    // This would typically require admin privileges
    // For now, we'll implement basic search
    const results = await organizationService.searchOrganizations(query || '', limit);

    return c.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search organizations error:', error);
    return c.json({
      success: false,
      error: 'Failed to search organizations'
    }, 500);
  }
});

/**
 * Get organization health status
 */
organizations.get('/health', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    const health = await organizationService.getOrganizationHealth(organizationId);

    return c.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Get organization health error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve organization health'
    }, 500);
  }
});

/**
 * Update organization settings
 */
organizations.patch('/settings', zValidator('json', updateOrganizationSchema.partial()), async (c) => {
  const userId = c.get('userId');
  const settingsUpdate = c.req.valid('json');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    const updatedOrganization = await organizationService.updateOrganizationSettings(
      organizationId,
      settingsUpdate
    );

    return c.json({
      success: true,
      data: updatedOrganization
    });
  } catch (error) {
    console.error('Update organization settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to update organization settings'
    }, 500);
  }
});

/**
 * Get organization members (admin only)
 */
organizations.get('/members', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    // This would typically use AdminRepository to get members
    // For now, we'll return a placeholder
    const members = await organizationService.getOrganizationMembers(organizationId);

    return c.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get organization members error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve organization members'
    }, 500);
  }
});

/**
 * Delete organization (admin only)
 */
organizations.delete('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    // Get user's organization
    const organizationId = await getOrganizationId(userId);
    
    // This would require additional validation and confirmation
    const result = await organizationService.deleteOrganization(organizationId);

    return c.json({
      success: result,
      message: result ? 'Organization deleted successfully' : 'Failed to delete organization'
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete organization'
    }, 500);
  }
});

// Helper function to get organization ID from user ID
// In a real implementation, this would use the AdminRepository
async function getOrganizationId(userId: string): Promise<string> {
  // This is a placeholder - in reality, you'd query the admins table
  // or use the AdminRepository to get the organization ID
  return 'org-placeholder'; // This would be dynamically determined
}

export default organizations;
