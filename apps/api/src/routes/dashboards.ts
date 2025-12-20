import { Hono } from 'hono';
import { TokenService } from '../services/token.service';
import { PluginManagerService } from '../services/plugin-manager';

const dashboards = new Hono();

/**
 * Public endpoint - validate token and return dashboard data
 * This is accessed by workers via the SMS link
 */
dashboards.get('/:token', async (c) => {
  const token = c.req.param('token');

  try {
    // Validate token
    const validation = await TokenService.validateToken(token);

    if (!validation.valid || !validation.workerId) {
      return c.json({ error: 'Invalid or expired link' }, 401);
    }

    // Get dashboard data from all configured plugins
    const dashboardData = await PluginManagerService.getDashboardData(
      validation.workerId
    );

    return c.json({
      worker: validation.workerData,
      schedule: dashboardData.schedule,
      tasks: dashboardData.tasks,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to load dashboard' 
    }, 500);
  }
});

export default dashboards;
