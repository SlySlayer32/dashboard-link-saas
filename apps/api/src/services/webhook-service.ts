import { createHash, createHmac } from 'node:crypto'
import { logger } from '../utils/logger.js'

interface WebhookProcessingResult {
  processed: boolean
  eventType?: string
  data?: unknown
  duplicate?: boolean
}

export class WebhookService {
  // redis would be injected or accessed via context

  // Store webhook secrets per provider
  private readonly webhookSecrets: Record<string, string> = {
    google_calendar: process.env.WEBHOOK_SECRET_GOOGLE || '',
    airtable: process.env.WEBHOOK_SECRET_AIRTABLE || '',
    notion: process.env.WEBHOOK_SECRET_NOTION || '',
    custom: process.env.WEBHOOK_SECRET_CUSTOM || '',
  }

  constructor() {
    // redis would be injected or accessed via context
  }

  /**
   * Verify webhook signature
   */
  async verifySignature(provider: string, body: string, signature: string): Promise<boolean> {
    const secret = this.webhookSecrets[provider]
    if (!secret) {
      logger.error(
        `No webhook secret configured for provider: ${provider}`,
        new Error('Missing webhook secret'),
        { provider }
      )
      return false
    }

    try {
      // Different providers use different signature formats
      switch (provider) {
        case 'google_calendar':
          return this.verifyGoogleSignature(body, signature, secret)
        case 'airtable':
          return this.verifyAirtableSignature(body, signature, secret)
        case 'notion':
          return this.verifyNotionSignature(body, signature, secret)
        default:
          return this.verifyGenericSignature(body, signature, secret)
      }
    } catch (error) {
      logger.error(
        'Signature verification error',
        error instanceof Error ? error : new Error(String(error)),
        { provider }
      )
      return false
    }
  }

  /**
   * Process webhook with idempotency
   */
  async processWebhook(
    provider: string,
    body: string,
    idempotencyKey: string
  ): Promise<WebhookProcessingResult> {
    try {
      // Check for duplicate using idempotency key
      const isDuplicate = await this.checkDuplicate(idempotencyKey)
      if (isDuplicate) {
        return {
          processed: false,
          duplicate: true,
        }
      }

      // Parse webhook payload
      const payload = JSON.parse(body)

      // Process based on provider
      let result: WebhookProcessingResult

      switch (provider) {
        case 'google_calendar':
          result = await this.processGoogleCalendarWebhook(payload)
          break
        case 'airtable':
          result = await this.processAirtableWebhook(payload)
          break
        case 'notion':
          result = await this.processNotionWebhook(payload)
          break
        default:
          result = await this.processGenericWebhook(provider, payload)
      }

      // Store idempotency key to prevent duplicates
      await this.storeIdempotencyKey(idempotencyKey, provider)

      // Enqueue processing job
      if (result.processed) {
        await this.enqueueWebhookJob(provider, payload, result.eventType || 'unknown')
      }

      return result
    } catch (error) {
      logger.error(
        'Webhook processing error',
        error instanceof Error ? error : new Error(String(error)),
        { provider }
      )
      return {
        processed: false,
      }
    }
  }

  /**
   * Verify Google Calendar webhook signature
   */
  private verifyGoogleSignature(body: string, signature: string, secret: string): boolean {
    // Google uses HMAC-SHA256
    const expectedSignature = createHmac('sha256', secret).update(body).digest('hex')

    // Remove any prefix from signature (e.g., 'sha256=')
    const receivedSignature = signature.replace(/^sha256=/, '')

    return (
      createHash('sha256').update(receivedSignature).digest('hex') ===
      createHash('sha256').update(expectedSignature).digest('hex')
    )
  }

  /**
   * Verify Airtable webhook signature
   */
  private verifyAirtableSignature(body: string, signature: string, secret: string): boolean {
    // Airtable uses HMAC-SHA256
    const expectedSignature = createHmac('sha256', secret).update(body).digest('base64')

    return signature === expectedSignature
  }

  /**
   * Verify Notion webhook signature
   */
  private verifyNotionSignature(body: string, signature: string, secret: string): boolean {
    // Notion uses HMAC-SHA256 with 'sha256=' prefix
    const expectedSignature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')

    return signature === expectedSignature
  }

  /**
   * Verify generic webhook signature
   */
  private verifyGenericSignature(body: string, signature: string, secret: string): boolean {
    // Default to HMAC-SHA256
    const expectedSignature = createHmac('sha256', secret).update(body).digest('hex')

    return signature === expectedSignature
  }

  /**
   * Process Google Calendar webhook
   */
  private processGoogleCalendarWebhook(payload: unknown): WebhookProcessingResult {
    // Type assertion for Google Calendar payload
    const googlePayload = payload as Record<string, unknown>

    // Google Calendar webhooks notify of changes
    if (googlePayload.channelId && googlePayload.resourceId) {
      return {
        processed: true,
        eventType: 'calendar.changed',
        data: {
          channelId: googlePayload.channelId,
          resourceId: googlePayload.resourceId,
        },
      }
    }

    return { processed: false }
  }

  /**
   * Process Airtable webhook
   */
  private processAirtableWebhook(payload: unknown): WebhookProcessingResult {
    // Type assertion for Airtable payload
    const airtablePayload = payload as Record<string, unknown>

    // Airtable sends record changes
    if (airtablePayload.base && airtablePayload.table && airtablePayload.record) {
      return {
        processed: true,
        eventType: 'record.changed',
        data: {
          baseId: (airtablePayload.base as Record<string, unknown>).id,
          tableId: (airtablePayload.table as Record<string, unknown>).id,
          recordId: (airtablePayload.record as Record<string, unknown>).id,
          changeType: airtablePayload.action, // create, update, delete
        },
      }
    }

    return { processed: false }
  }

  /**
   * Process Notion webhook
   */
  private processNotionWebhook(payload: unknown): WebhookProcessingResult {
    // Type assertion for Notion payload
    const notionPayload = payload as Record<string, unknown>

    // Notion sends page/database changes
    if (notionPayload.type === 'page' || notionPayload.type === 'database') {
      return {
        processed: true,
        eventType: `${notionPayload.type}.changed`,
        data: {
          id: notionPayload.id,
          type: notionPayload.type,
          timestamp: notionPayload.created_time,
        },
      }
    }

    return { processed: false }
  }

  /**
   * Process generic webhook
   */
  private processGenericWebhook(_provider: string, payload: unknown): WebhookProcessingResult {
    // Type assertion for generic payload
    const genericPayload = payload as Record<string, unknown>

    // Try to extract common event patterns
    if (genericPayload.event || genericPayload.type) {
      return {
        processed: true,
        eventType: (genericPayload.event as string) || (genericPayload.type as string),
        data: genericPayload,
      }
    }

    return { processed: false }
  }

  /**
   * Check for duplicate webhook using idempotency key
   */
  private async checkDuplicate(_idempotencyKey: string): Promise<boolean> {
    // const _stmt = `
    //     SELECT 1 FROM webhook_idempotency
    //     WHERE idempotency_key = ?
    //     LIMIT 1
    // `;

    // Execute query and return true if exists
    return false // Placeholder
  }

  /**
   * Store idempotency key
   */
  private async storeIdempotencyKey(_idempotencyKey: string, _provider: string): Promise<void> {
    // const _stmt = `
    //     INSERT INTO webhook_idempotency (idempotency_key, provider, created_at)
    //     VALUES (?, ?, NOW())
    // `;
    // Execute insert
  }

  /**
   * Enqueue webhook processing job
   */
  private async enqueueWebhookJob(
    _provider: string,
    _payload: unknown,
    _eventType: string
  ): Promise<void> {
    // const _job = {
    //     id: crypto.randomUUID(),
    //     provider: _provider,
    //     eventType,
    //     payload,
    //     createdAt: new Date(),
    // };
    // In production, this would enqueue to BullMQ
    // const _stmt = `
    //     INSERT INTO webhook_jobs (id, provider, event_type, payload, created_at, status)
    //     VALUES (?, ?, ?, ?, ?, 'pending')
    // `;
    // Execute insert
  }
}
