import { createContainerFromEnvironment } from '@dashboard-link/database'
import { serve } from '@hono/node-server'
import dotenv from 'dotenv'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'

// Import middleware and config
import { validateRuntimeDependencies } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import type { AppContextVariables } from './types'
import { logger } from './utils/logger.js'

// Initialize SMS system
import { initializeSMSSystem } from '@dashboard-link/sms'

// Load environment variables
dotenv.config()

// Validate critical environment variables
validateRuntimeDependencies()

// R02: Initialize DI container BEFORE importing routes (workers.ts calls getWorkerRepository at module level)
try {
  await createContainerFromEnvironment()
  logger.info('DI container initialized')
} catch (error) {
  logger.error(
    'Failed to initialize DI container',
    error instanceof Error ? error : new Error(String(error))
  )
  process.exit(1)
}

// Import routes AFTER container is initialized
const { default: v1 } = await import('./v1.js')

// Initialize SMS system with providers
try {
  initializeSMSSystem()
} catch (error) {
  logger.error(
    'Failed to initialize SMS system',
    error instanceof Error ? error : new Error(String(error))
  )
  // Continue startup - SMS will be unavailable
}

const APP_VERSION = '0.1.0'

const app = new Hono<{
  Variables: AppContextVariables
}>()

// Middleware
app.use('*', honoLogger())

// R18: Only include localhost origins in development
const corsOrigins = [process.env.APP_URL || 'http://localhost:5173']
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push('http://localhost:5173', 'http://localhost:5174')
}
app.use(
  '*',
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)

// Cache middleware is now applied inside v1.ts AFTER auth+tenant middleware (R07)

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'Dashboard Link SaaS API',
    version: APP_VERSION,
    status: 'ok',
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
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
