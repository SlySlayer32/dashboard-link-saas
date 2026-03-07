/**
 * MSW Server Setup for Node.js Tests
 * 
 * This sets up the Mock Service Worker server for intercepting
 * HTTP requests in Node.js test environment (Vitest).
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Create MSW server with default handlers
 * 
 * Usage in tests:
 * 
 * import { server } from '@/test/mocks/server'
 * 
 * // Override handlers for specific test
 * server.use(
 *   http.post('https://api.mobilemessage.com.au/v1/send', () => {
 *     return HttpResponse.json({ error: 'Service unavailable' }, { status: 503 })
 *   })
 * )
 */
export const server = setupServer(...handlers)
