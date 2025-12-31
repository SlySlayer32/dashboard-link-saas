import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { authMiddleware, requireAdmin } from '../../middleware/auth'
import { PluginManagerService } from '../../services/plugin-manager'

const dashboards = new Hono()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// Apply auth middleware to all routes
dashboards.use('*', authMiddleware)
dashboards.use('*', requireAdmin)

/**
 * Get dashboard preview for a worker
 * GET /api/admin/dashboards/preview/:workerId?date=2025-12-25
 */
dashboards.get('/preview/:workerId', async (c) => {
  const workerId = c.req.param('workerId')
  const dateParam = c.req.query('date')
  const organizationId = c.get('organizationId')

  try {
    // Verify the worker belongs to the admin's organization
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, phone')
      .eq('id', workerId)
      .eq('organization_id', organizationId)
      .single()

    if (workerError || !worker) {
      return c.json({ error: 'Worker not found or access denied' }, 404)
    }

    // Parse date or use today
    const date = dateParam ? new Date(dateParam) : new Date()

    // Validate date
    if (isNaN(date.getTime())) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
    }

    // Get dashboard data for the specified date
    const dashboardData = await PluginManagerService.getDashboardData(workerId, date)

    return c.json({
      success: true,
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          phone: worker.phone,
        },
        schedule: dashboardData.schedule,
        tasks: dashboardData.tasks,
        metadata: {
          previewDate: date.toISOString().split('T')[0],
          isPreview: true,
        },
      },
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: 'DASHBOARD_PREVIEW_FAILED',
          message: error instanceof Error ? error.message : 'Failed to load dashboard preview',
        },
      },
      500
    )
  }
})

export default dashboards
