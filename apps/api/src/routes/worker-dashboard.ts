import { dashboardTokenMiddleware } from '@cleanconnect/shared/tenant-middleware'
import { DashboardTokenService } from '@cleanconnect/tokens/dashboard-token'
import { Hono } from 'hono'

export const workerDashboardRoutes = new Hono()

const tokenService = new DashboardTokenService()

// GET /worker/d/:token - Worker dashboard access
workerDashboardRoutes.get('/d/:token', dashboardTokenMiddleware, async (c) => {
  const tenant = c.get('tenant')
  const workerName = c.get('workerName')

  // Fetch worker's dashboard data
  const { results: dashboardData } = await c.env.DB.prepare(
    `
    SELECT 
      d.layout_json,
      w.name as worker_name,
      w.phone_e164,
      o.name as org_name
    FROM dashboards d
    JOIN workers w ON d.worker_id = w.id
    JOIN organizations o ON d.org_id = o.id
    WHERE d.worker_id = ? AND d.org_id = ?
  `
  )
    .bind(tenant.userId, tenant.orgId)
    .all()

  if (dashboardData.length === 0) {
    return c.json({ error: 'Dashboard not found' }, 404)
  }

  const dashboard = dashboardData[0] as any

  // Fetch dashboard sources and their data
  const { results: sources } = await c.env.DB.prepare(
    `
    SELECT 
      ds.id,
      ds.mapping_json,
      ac.adapter_id,
      ac.config_json
    FROM dashboard_sources ds
    JOIN adapter_configs ac ON ds.adapter_config_id = ac.id
    WHERE ds.dashboard_id = (SELECT id FROM dashboards WHERE worker_id = ?)
    AND ac.status = 'active'
  `
  )
    .bind(tenant.userId)
    .all()

  // Fetch data from each adapter
  const adapterData = []
  for (const source of sources as any[]) {
    try {
      // This would use the plugin registry to fetch data
      // For now, return the source configuration
      adapterData.push({
        id: source.id,
        adapter: source.adapter_id,
        mapping: source.mapping_json,
        config: source.config_json,
      })
    } catch (error) {
      logger.error(
        `Failed to fetch data from adapter ${source.adapter_id}`,
        error instanceof Error ? error : new Error(String(error)),
        { adapterId: source.adapter_id }
      )
    }
  }

  return c.json({
    worker: {
      name: dashboard.worker_name,
      phone: dashboard.phone_e164,
    },
    organization: {
      name: dashboard.org_name,
    },
    layout: dashboard.layout_json,
    sources: adapterData,
    timestamp: new Date().toISOString(),
  })
})

// GET /worker/d/:token/print - Print-friendly version
workerDashboardRoutes.get('/d/:token/print', dashboardTokenMiddleware, async (c) => {
  const tenant = c.get('tenant')
  const workerName = c.get('workerName')

  // Fetch same data as regular dashboard
  const dashboardResponse = await fetch(`${c.req.url.replace('/print', '')}`, {
    headers: c.req.header(),
  })

  const data = await dashboardResponse.json()

  // Return HTML for printing
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard for ${data.worker.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .task { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
          .event { border-left: 4px solid #007bff; padding-left: 10px; margin-bottom: 10px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dashboard for ${data.worker.name}</h1>
          <p>Organization: ${data.organization.name}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2>Today's Schedule</h2>
          <!-- Render schedule data here -->
        </div>
        
        <div class="section">
          <h2>Tasks</h2>
          <!-- Render task data here -->
        </div>
        
        <div class="no-print">
          <p>Generated on ${new Date().toISOString()}</p>
        </div>
      </body>
    </html>
  `)
})
