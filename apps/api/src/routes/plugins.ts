/**
 * Plugins Route (Repository-Based)
 * 
 * API endpoints for plugin management using the repository pattern
 * Replaces direct Supabase queries with service layer abstraction
 */

import { PluginRegistry } from '@dashboard-link/plugins';
import type { PluginTestResult } from '@dashboard-link/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger.js';

const plugins = new Hono();

// Initialize plugin registry
const pluginRegistry = new PluginRegistry();

// All routes require authentication
plugins.use('*', authMiddleware);

// Admin-only routes
plugins.use(['/', '/:id/config', '/:id/test', '/:id/enable', '/:id/disable'], requireAdmin);

// Validation schemas
const updatePluginConfigSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
  settings: z.object({
    timeout: z.number().optional(),
    retries: z.number().optional(),
    priority: z.number().optional()
  }).optional()
});

const testPluginSchema = z.object({
  testType: z.enum(['connection', 'functionality', 'performance']),
  testData: z.record(z.any()).optional()
});

/**
 * Get all available plugins
 */
plugins.get('/', async (c) => {
  const organizationId = c.get('organizationId');
  
  try {
    const availablePlugins = pluginRegistry.getAvailablePlugins();
    const organizationPlugins = pluginRegistry.getOrganizationPlugins(organizationId);

    return c.json({
      success: true,
      data: {
        available: availablePlugins,
        configured: organizationPlugins
      }
    });
  } catch (error) {
    logger.error('Get plugins error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve plugins'
    }, 500);
  }
});

/**
 * Get plugin by ID
 */
plugins.get('/:id', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const organizationConfig = pluginRegistry.getPluginConfig(organizationId, pluginId);

    return c.json({
      success: true,
      data: {
        plugin,
        config: organizationConfig
      }
    });
  } catch (error) {
    logger.error('Get plugin error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve plugin'
    }, 500);
  }
});

/**
 * Update plugin configuration
 */
plugins.put('/:id/config', zValidator('json', updatePluginConfigSchema), async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const configUpdate = c.req.valid('json');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const updatedConfig = pluginRegistry.updatePluginConfig(
      organizationId,
      pluginId,
      configUpdate
    );

    return c.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    logger.error('Update plugin config error:', error);
    return c.json({
      success: false,
      error: 'Failed to update plugin configuration'
    }, 500);
  }
});

/**
 * Test plugin functionality
 */
plugins.post('/:id/test', zValidator('json', testPluginSchema), async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const testData = c.req.valid('json');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const testResult: PluginTestResult = await pluginRegistry.testPlugin(
      organizationId,
      pluginId,
      testData.testType,
      testData.testData
    );

    return c.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    logger.error('Test plugin error:', error);
    return c.json({
      success: false,
      error: 'Failed to test plugin'
    }, 500);
  }
});

/**
 * Enable plugin for organization
 */
plugins.post('/:id/enable', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    await pluginRegistry.enablePlugin(organizationId, pluginId);

    return c.json({
      success: true,
      message: 'Plugin enabled successfully'
    });
  } catch (error) {
    logger.error('Enable plugin error:', error);
    return c.json({
      success: false,
      error: 'Failed to enable plugin'
    }, 500);
  }
});

/**
 * Disable plugin for organization
 */
plugins.post('/:id/disable', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    await pluginRegistry.disablePlugin(organizationId, pluginId);

    return c.json({
      success: true,
      message: 'Plugin disabled successfully'
    });
  } catch (error) {
    logger.error('Disable plugin error:', error);
    return c.json({
      success: false,
      error: 'Failed to disable plugin'
    }, 500);
  }
});

/**
 * Get plugin execution logs
 */
plugins.get('/:id/logs', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const logs = pluginRegistry.getPluginLogs(organizationId, pluginId, limit, offset);

    return c.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get plugin logs error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve plugin logs'
    }, 500);
  }
});

/**
 * Get plugin statistics
 */
plugins.get('/:id/stats', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const stats = pluginRegistry.getPluginStats(organizationId, pluginId);

    return c.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get plugin stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve plugin statistics'
    }, 500);
  }
});

/**
 * Reset plugin configuration to defaults
 */
plugins.post('/:id/reset', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const defaultConfig = pluginRegistry.resetPluginConfig(organizationId, pluginId);

    return c.json({
      success: true,
      data: defaultConfig,
      message: 'Plugin configuration reset to defaults'
    });
  } catch (error) {
    logger.error('Reset plugin config error:', error);
    return c.json({
      success: false,
      error: 'Failed to reset plugin configuration'
    }, 500);
  }
});

/**
 * Get plugin health status
 */
plugins.get('/:id/health', async (c) => {
  const pluginId = c.req.param('id');
  const organizationId = c.get('organizationId');
  
  try {
    const plugin = pluginRegistry.getPlugin(pluginId);
    
    if (!plugin) {
      return c.json({
        success: false,
        error: 'Plugin not found'
      }, 404);
    }

    const health = pluginRegistry.getPluginHealth(organizationId, pluginId);

    return c.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Get plugin health error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve plugin health'
    }, 500);
  }
});

export default plugins;
