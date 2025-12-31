import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Context, Next } from 'hono';
import { WebhookProvider, WebhookSignatureVerifier } from '../types/webhooks';

/**
 * Google Calendar webhook signature verifier
 */
class GoogleCalendarVerifier implements WebhookSignatureVerifier {
  verifySignature(_payload: string, _signature: string, _secret: string): boolean {
    // Google Calendar uses channel-based notifications with no signature
    // Verification is done by checking the channel exists in our system
    return true; // We'll verify at the plugin level
  }
}

/**
 * Airtable webhook signature verifier
 */
class AirtableVerifier implements WebhookSignatureVerifier {
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Airtable uses HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');
    
    return signature === expectedSignature;
  }
}

/**
 * Notion webhook signature verifier
 */
class NotionVerifier implements WebhookSignatureVerifier {
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // Notion uses HMAC-SHA256 signature with 'sha256=' prefix
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

/**
 * Get signature verifier for provider
 */
function getVerifier(provider: WebhookProvider): WebhookSignatureVerifier {
  switch (provider) {
    case 'google-calendar':
      return new GoogleCalendarVerifier();
    case 'airtable':
      return new AirtableVerifier();
    case 'notion':
      return new NotionVerifier();
    default:
      throw new Error(`No signature verifier for provider: ${provider}`);
  }
}

/**
 * Rate limiting store for webhooks
 */
class WebhookRateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>();

  static isAllowed(
    organizationId: string, 
    pluginId: string, 
    limitPerMinute: number
  ): boolean {
    const key = `${organizationId}:${pluginId}`;
    const now = Date.now();

    const record = this.store.get(key);
    
    if (!record || now > record.resetTime) {
      // New window or expired
      this.store.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (record.count >= limitPerMinute) {
      return false;
    }

    record.count++;
    return true;
  }
}

/**
 * Webhook authentication middleware
 * Verifies signatures and applies rate limiting
 */
export const webhookAuth = (provider: WebhookProvider) => {
  return async (c: Context, next: Next) => {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Get webhook configuration
    const { data: config, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('plugin_id', provider)
      .eq('active', true)
      .single();

    if (configError || !config) {
      logger.warn('Webhook config not found', { provider, error: configError });
      return c.json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_CONFIGURED',
          message: 'Webhook not configured for this provider'
        }
      }, 404);
    }

    // Rate limiting check
    if (!WebhookRateLimiter.isAllowed(config.organization_id, provider, config.rate_limit_per_minute)) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Webhook rate limit exceeded'
        }
      }, 429);
    }

    // Get raw body for signature verification
    const body = await c.req.text();
    const signature = c.req.header('webhook-signature') || 
                     c.req.header('x-airtable-content-signature') ||
                     c.req.header('x-notion-signature') ||
                     '';

    // Verify signature
    const verifier = getVerifier(provider);
    const isValid = verifier.verifySignature(body, signature, config.secret);

    if (!isValid) {
      logger.warn('Invalid webhook signature', { 
        provider, 
        organizationId: config.organization_id,
        signature 
      });
      
      return c.json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed'
        }
      }, 401);
    }

    // Parse JSON body for route handler
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in webhook payload'
        }
      }, 400);
    }

    // Store config and validated body in context
    c.set('webhookConfig', config);
    c.set('webhookBody', body);
    c.set('webhookParsedBody', parsedBody);

    await next();
  };
};

/**
 * Get idempotency key from request headers
 */
export function getIdempotencyKey(c: Context): string | undefined {
  return c.req.header('idempotency-key') || 
         c.req.header('x-idempotency-key') ||
         undefined;
}
