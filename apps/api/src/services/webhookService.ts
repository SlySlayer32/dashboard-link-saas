import { PluginRegistry } from '@dashboard-link/plugins';
import { logger } from '@dashboard-link/shared';
import { createClient } from '@supabase/supabase-js';
import {
    WebhookEvent,
    WebhookEventStatus,
    WebhookJob,
    WebhookProvider
} from '../types/webhooks';

// Queue interface for abstraction
interface JobQueue {
  add(job: WebhookJob): Promise<void>;
  process(): Promise<void>;
}

// In-memory queue implementation
class InMemoryQueue implements JobQueue {
  private queue: WebhookJob[] = [];
  private processing = false;

  async add(job: WebhookJob): Promise<void> {
    this.queue.push(job);
    if (!this.processing) {
      this.process();
    }
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) {
        continue;
      }
      try {
        await processWebhookJob(job);
      } catch (error) {
        logger.error('Failed to process webhook job', error as Error, { 
          eventId: job.eventId,
          pluginId: job.pluginId 
        });
      }
    }

    this.processing = false;
  }
}

// Create queue instance
const webhookQueue: JobQueue = new InMemoryQueue();

/**
 * Store webhook event in database
 */
export async function storeWebhookEvent(
  organizationId: string,
  pluginId: WebhookProvider,
  eventType: string,
  payload: unknown,
  signatureValid: boolean,
  idempotencyKey?: string
): Promise<WebhookEvent> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Check for duplicate using idempotency key
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      throw new Error('Duplicate webhook event detected');
    }
  }

  const { data, error } = await supabase
    .from('webhook_events')
    .insert({
      organization_id: organizationId,
      plugin_id: pluginId,
      event_type: eventType,
      payload,
      signature_valid: signatureValid,
      status: 'pending',
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to store webhook event', error, { 
      organizationId, 
      pluginId, 
      eventType 
    });
    throw error;
  }

  return data as WebhookEvent;
}

/**
 * Queue webhook event for processing
 */
export async function queueWebhookEvent(event: WebhookEvent): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get webhook config for retry settings
  const { data: config } = await supabase
    .from('webhook_configs')
    .select('retry_attempts, retry_delay_seconds')
    .eq('plugin_id', event.plugin_id)
    .eq('organization_id', event.organization_id)
    .single();

  const job: WebhookJob = {
    eventId: event.id,
    pluginId: event.plugin_id,
    payload: event.payload,
    retryCount: event.retry_count,
    maxRetries: config?.retry_attempts || 3,
  };

  await webhookQueue.add(job);
}

/**
 * Process a single webhook job
 */
async function processWebhookJob(job: WebhookJob): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Update status to processing
  await supabase
    .from('webhook_events')
    .update({ 
      status: 'processing',
      processed_at: new Date().toISOString()
    })
    .eq('id', job.eventId);

  try {
    // Get plugin
    const plugin = PluginRegistry.get(job.pluginId);
    
    if (!plugin) {
      // Plugin not implemented yet
      logger.info('Plugin not found, marking as pending', { 
        pluginId: job.pluginId 
      });
      
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'processed',
          error_message: 'Plugin not yet implemented - event stored for future processing'
        })
        .eq('id', job.eventId);
      
      return;
    }

    if (!plugin.handleWebhook) {
      // Plugin doesn't support webhooks
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'failed',
          error_message: 'Plugin does not support webhooks'
        })
        .eq('id', job.eventId);
      
      return;
    }

    // Get plugin config
    const { data: pluginConfig } = await supabase
      .from('plugin_configs')
      .select('config')
      .eq('plugin_id', job.pluginId)
      .eq('organization_id', (
        await supabase
          .from('webhook_events')
          .select('organization_id')
          .eq('id', job.eventId)
          .single()
      ).data?.organization_id)
      .single();

    // Process webhook with plugin
    await plugin.handleWebhook(job.payload, pluginConfig?.config || {});

    // Mark as processed
    await supabase
      .from('webhook_events')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', job.eventId);

    logger.info('Webhook processed successfully', { 
      eventId: job.eventId,
      pluginId: job.pluginId 
    });

  } catch (error) {
    logger.error('Webhook processing failed', error as Error, { 
      eventId: job.eventId,
      pluginId: job.pluginId,
      retryCount: job.retryCount 
    });

    // Handle retry logic
    if (job.retryCount < job.maxRetries) {
      const retryDelay = Math.pow(2, job.retryCount) * 1000; // Exponential backoff
      
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'pending',
          retry_count: job.retryCount + 1,
          error_message: (error as Error).message
        })
        .eq('id', job.eventId);

      // Re-queue with delay
      setTimeout(async () => {
        job.retryCount++;
        await webhookQueue.add(job);
      }, retryDelay);

    } else {
      // Max retries exceeded
      await supabase
        .from('webhook_events')
        .update({ 
          status: 'failed',
          error_message: `Max retries exceeded: ${(error as Error).message}`
        })
        .eq('id', job.eventId);
    }
  }
}

/**
 * Get webhook event by ID
 */
export async function getWebhookEvent(eventId: string): Promise<WebhookEvent | null> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    return null;
  }

  return data as WebhookEvent;
}

/**
 * List webhook events for an organization
 */
export async function listWebhookEvents(
  organizationId: string,
  status?: WebhookEventStatus,
  limit: number = 50,
  offset: number = 0
): Promise<WebhookEvent[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  let query = supabase
    .from('webhook_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to list webhook events', error);
    return [];
  }

  return data as WebhookEvent[];
}

/**
 * Replay a failed webhook event
 */
export async function replayWebhookEvent(eventId: string): Promise<boolean> {
  const event = await getWebhookEvent(eventId);
  
  if (!event) {
    return false;
  }

  if (event.status !== 'failed') {
    return false;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Reset event for retry
  await supabase
    .from('webhook_events')
    .update({ 
      status: 'pending',
      retry_count: 0,
      error_message: null,
      processed_at: null
    })
    .eq('id', eventId);

  // Re-queue
  await queueWebhookEvent(event);

  return true;
}
