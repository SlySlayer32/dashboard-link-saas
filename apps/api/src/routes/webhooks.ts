import { PluginRegistry } from '@dashboard-link/plugins';
import { Hono } from 'hono';
import { logger } from '../utils/logger';

const webhooks = new Hono();

/**
 * Generic webhook endpoint for plugins
 * Plugins can register webhooks at /webhooks/:pluginId
 */
webhooks.post('/:pluginId', async (c) => {
  const pluginId = c.req.param('pluginId');
  const payload = await c.req.json();

  try {
    const plugin = PluginRegistry.get(pluginId);

    if (!plugin) {
      return c.json({ error: 'Plugin not found' }, 404);
    }

    if (!plugin.handleWebhook) {
      return c.json({ error: 'Plugin does not support webhooks' }, 400);
    }

    // TODO: Get plugin config from database based on organization
    // For now, passing empty config
    await plugin.handleWebhook(payload, {});

    return c.json({ success: true });
  } catch (error) {
    logger.error('Webhook error', error as Error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    }, 500);
  }
});

export default webhooks;
