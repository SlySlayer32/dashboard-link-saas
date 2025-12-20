import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';

// Import routes
import auth from './routes/auth';
import workers from './routes/workers';
import organizations from './routes/organizations';
import dashboards from './routes/dashboards';
import sms from './routes/sms';
import webhooks from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'Dashboard Link SaaS API',
    version: '0.1.0',
    status: 'ok',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

// Mount routes
app.route('/auth', auth);
app.route('/workers', workers);
app.route('/organizations', organizations);
app.route('/dashboards', dashboards);
app.route('/sms', sms);
app.route('/webhooks', webhooks);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: err.message || 'Internal server error' 
  }, 500);
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log(`Starting Dashboard Link API on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ API server running at http://localhost:${port}`);

export default app;
