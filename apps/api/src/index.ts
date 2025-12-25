import { serve } from '@hono/node-server'
import dotenv from 'dotenv'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'

// Import middleware and config
import { validateRuntimeDependencies } from './config/env'
import { cacheMiddleware, createCacheConfig } from './middleware/cache'
import { errorHandler } from './middleware/error-handler'

// Import routes
import admin from './routes/admin'
import auth from './routes/auth'
import dashboard from './routes/dashboard'
import dashboards from './routes/dashboards'
import manualData from './routes/manual-data'
import organizations from './routes/organizations'
import plugins from './routes/plugins'
import sms from './routes/sms'
import webhooks from './routes/webhooks'
import { workers } from './routes/workers'

// Load environment variables
dotenv.config()

// Validate critical environment variables
validateRuntimeDependencies()

const app = new Hono()

// Middleware
app.use('*', honoLogger())
app.use(
  '*',
  cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// Apply caching to GET routes
app.use('/workers', cacheMiddleware(createCacheConfig('workers')))
app.use('/dashboard', cacheMiddleware(createCacheConfig('dashboard')))
app.use('/dashboards/*', cacheMiddleware(createCacheConfig('dashboard')))
app.use('/sms/logs', cacheMiddleware(createCacheConfig('sms-logs')))

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'Dashboard Link SaaS API',
    version: '0.1.0',
    status: 'ok',
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy' })
})

// Mount routes
app.route('/auth', auth)
app.route('/workers', workers)
app.route('/organizations', organizations)
app.route('/plugins', plugins)
app.route('/dashboards', dashboards)
app.route('/dashboard', dashboard)
app.route('/sms', sms)
app.route('/webhooks', webhooks)
app.route('/admin', admin) // Admin routes with admin auth
app.route('', manualData) // Manual data routes don't have a prefix

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    },
    404
  )
})

// Error handler
app.onError(errorHandler)

// Start server
const port = parseInt(process.env.PORT || '3000')

serve({
  fetch: app.fetch,
  port,
})

export default app
