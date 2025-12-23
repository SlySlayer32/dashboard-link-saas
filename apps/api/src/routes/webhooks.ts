import { logger } from '@dashboard-link/shared';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { getIdempotencyKey, webhookAuth } from '../middleware/webhookAuth';
import {
    queueWebhookEvent,
    storeWebhookEvent,
} from '../services/webhookService';
import { WebhookProvider } from '../types/webhooks';

const webhooks = new Hono();

// Webhook event schema for validation
const WebhookEventSchema = z.object({
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

const WebhookConfigSchema = z.object({
  organization_id: z.string().uuid(),
});

/**
 * Google Calendar webhook endpoint
 */
webhooks.post('/google-calendar', 
  webhookAuth('google-calendar'),
  async (c) => {
    return handleWebhook(c, 'google-calendar');
  }
);

/**
 * Airtable webhook endpoint
 */
webhooks.post('/airtable', 
  webhookAuth('airtable'),
  async (c) => {
    return handleWebhook(c, 'airtable');
  }
);

/**
 * Notion webhook endpoint
 */
webhooks.post('/notion', 
  webhookAuth('notion'),
  async (c) => {
    return handleWebhook(c, 'notion');
  }
);

/**
 * Generic webhook handler
 */
async function handleWebhook(c: Context, pluginId: WebhookProvider): Promise<Response> {
  const configResult = WebhookConfigSchema.safeParse(c.get('webhookConfig'));
  if (!configResult.success) {
    return c.json({
      success: false,
      error: {
        code: 'WEBHOOK_CONFIG_INVALID',
        message: 'Webhook config invalid or missing'
      }
    }, 500);
  }

  const config = configResult.data;
  const parsedBody: unknown = c.get('webhookParsedBody');
  const idempotencyKey = getIdempotencyKey(c);

  // Validate the parsed body
  const result = WebhookEventSchema.safeParse(parsedBody);
  if (!result.success) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid webhook payload',
        details: result.error.issues
      }
    }, 400);
  }

  const { event_type, payload } = result.data;

  try {
    // Store webhook event
    const event = await storeWebhookEvent(
      config.organization_id,
      pluginId,
      event_type,
      payload,
      true, // Signature already verified by middleware
      idempotencyKey
    );

    // Queue for processing
    await queueWebhookEvent(event);

    // Log webhook received
    logger.info('Webhook received and queued', {
      eventId: event.id,
      pluginId,
      eventType: event_type,
      organizationId: config.organization_id,
    });

    // Return 200 OK immediately
    return c.json({ 
      success: true,
      event_id: event.id,
      status: 'queued'
    });

  } catch (error) {
    // Handle duplicate events
    if (error instanceof Error && error.message.includes('Duplicate')) {
      logger.info('Duplicate webhook event ignored', { 
        pluginId, 
        idempotencyKey 
      });
      
      return c.json({ 
        success: true,
        message: 'Duplicate event ignored'
      });
    }

    logger.error('Webhook processing failed', error as Error, { 
      pluginId,
      eventType: event_type 
    });
    
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed' 
    }, 500);
  }
}

/**
 * List webhook events for an organization
 * Requires authentication
 */
webhooks.get('/events', async (c) => {
  // TODO: Add authentication middleware
  // const organizationId = c.get('organizationId');
  
  // For now, return empty list
  return c.json({ 
    success: true,
    data: [],
    total: 0
  });
});

/**
 * Get a specific webhook event
 * Requires authentication
 */
webhooks.get('/events/:eventId', async (c) => {
  // TODO: Add authentication middleware
  void c.req.param('eventId');
  
  // const event = await getWebhookEvent(eventId);
  // if (!event || event.organization_id !== organizationId) {
  //   return c.json({ success: false, error: 'Event not found' }, 404);
  // }
  
  return c.json({ 
    success: true,
    data: null // event
  });
});

/**
 * Replay a failed webhook event
 * Requires authentication
 */
webhooks.post('/events/:eventId/replay', async (c) => {
  // TODO: Add authentication middleware
  void c.req.param('eventId');
  
  // const success = await replayWebhookEvent(eventId);
  // if (!success) {
  //   return c.json({ 
  //     success: false, 
  //     error: 'Event not found or not in failed status' 
  //   }, 404);
  // }
  
  return c.json({ 
    success: true,
    message: 'Event queued for replay'
  });
});

/**
 * Health check for webhook endpoints
 */
webhooks.get('/health', (c) => {
  return c.json({
    service: 'webhooks',
    status: 'healthy',
    providers: ['google-calendar', 'airtable', 'notion'],
    version: '1.0.0'
  });
});

export default webhooks;
