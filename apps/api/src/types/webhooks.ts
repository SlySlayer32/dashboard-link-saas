import { z } from 'zod';

// Webhook event status types
export const WebhookEventStatusSchema = z.enum(['pending', 'processing', 'processed', 'failed']);
export type WebhookEventStatus = z.infer<typeof WebhookEventStatusSchema>;

// Webhook provider types
export const WebhookProviderSchema = z.enum(['google-calendar', 'airtable', 'notion']);
export type WebhookProvider = z.infer<typeof WebhookProviderSchema>;

// Base webhook event schema
export const WebhookEventSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  plugin_id: WebhookProviderSchema,
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  signature_valid: z.boolean(),
  status: WebhookEventStatusSchema,
  idempotency_key: z.string().optional(),
  retry_count: z.number().default(0),
  created_at: z.string().datetime(),
  processed_at: z.string().datetime().optional(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Webhook processing result
export const WebhookProcessingResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  processed_at: z.string().datetime(),
});

export type WebhookProcessingResult = z.infer<typeof WebhookProcessingResultSchema>;

// Webhook signature verification interface
export interface WebhookSignatureVerifier {
  verifySignature(payload: string, signature: string, secret: string): boolean;
}

// Google Calendar webhook types
export interface GoogleCalendarWebhookPayload {
  kind: string;
  id: string;
  resource: {
    kind: string;
    id: string;
    etag: string;
    title: string;
    updated: string;
  };
  channel: {
    id: string;
    resourceUri: string;
    expiration: number;
  };
}

// Airtable webhook types
export interface AirtableWebhookPayload {
  base: {
    id: string;
  };
  webhook: {
    id: string;
    metadata: {
      base: {
        id: string;
        name: string;
        tables: Array<{
          id: string;
          name: string;
          primaryFieldId: string;
        }>;
      };
    };
  };
  changedTablesById: Record<string, {
    createdRecordsById?: Record<string, unknown>;
    updatedRecordsById?: Record<string, unknown>;
    destroyedRecordsById?: Record<string, unknown>;
  }>;
}

// Notion webhook types
export interface NotionWebhookPayload {
  type: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  database_id: string;
  timestamp: string;
  details: {
    type: string;
    parent: {
      type: string;
      [key: string]: unknown;
    };
    properties: Record<string, unknown>;
  };
}

// Webhook configuration interface
export interface WebhookConfig {
  provider: WebhookProvider;
  secret: string;
  rateLimitPerMinute: number;
  retryAttempts: number;
  retryDelay: number;
}

// Webhook queue job interface
export interface WebhookJob {
  eventId: string;
  pluginId: string;
  payload: unknown;
  retryCount: number;
  maxRetries: number;
}
