import { serve } from '@hono/node-server'
import dotenv from 'dotenv'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import type { AppContext } from './types'
import v1 from './v1' // Import versioned API

// Import middleware and config
import { validateRuntimeDependencies } from './config/env'
import { cacheMiddleware, createCacheConfig } from './middleware/cache'
import { errorHandler } from './middleware/error-handler'

// Initialize SMS system
// TODO(sms-integration): Replace legacy SMSService with new SMS system from packages/sms

// Import routes
// import dashboards from './routes/dashboards'
// import plugins from './routes/plugins'
// import tokens from './routes/tokens' // Temporarily disabled

// Load environment variables
dotenv.config()

// Validate critical environment variables
validateRuntimeDependencies()

// Initialize SMS system with providers
try {
  initializeSMSSystem()
} catch (error) {
  console.error('Failed to initialize SMS system:', error)
  // Continue startup - SMS will be unavailable
}

const app = new Hono<{
  Variables: AppContext['Variables']
}>()

// Middleware
app.use('*', honoLogger())
app.use(
  '*',
  cors({
    origin: [
      process.env.APP_URL || 'http://localhost:5173',
      'http://localhost:5173', // Admin
      'http://localhost:5174', // Worker
    ],
    credentials: true,
  })
)

// Apply cache middleware to routes under /api/v1/
app.use('/api/v1/workers', cacheMiddleware(createCacheConfig('workers')))
app.use('/api/v1/dashboard', cacheMiddleware(createCacheConfig('dashboard')))
app.use('/api/v1/dashboards/*', cacheMiddleware(createCacheConfig('dashboard')))

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'Dashboard Link SaaS API',
    version: '0.1.0',
    status: 'ok',
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// Mount versioned API routes
app.route('/api/v1', v1)

// Support header versioning
app.use('/api/*', async (c, next) => {
  const version = c.req.header('API-Version')
  if (version && c.req.path.startsWith('/api/')) {
    // For now, default to v1 for any version header
    // In production, you'd map versions to actual route handlers
    const newPath = c.req.path.replace('/api/', '/api/v1/')

    // Create a new request with the updated path
    const url = new URL(c.req.url)
    url.pathname = newPath

    const newReq = new Request(url.toString(), {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.raw.body,
    })

    return await app.fetch(newReq)
  }
  await next()
})

// All routes are mounted under /api/v1/ (see line 75)
// Do not mount routes at root level per spec T047

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
