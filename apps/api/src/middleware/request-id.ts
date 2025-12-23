import { createMiddleware } from 'hono/factory';
import { v4 as uuidv4 } from 'uuid';

export const requestId = createMiddleware(async (c, next) => {
  // Generate or get existing request ID
  const id = c.get('requestId') || uuidv4();
  c.set('requestId', id);
  
  // Add request ID to response headers for debugging
  c.header('X-Request-ID', id);
  
  await next();
});
