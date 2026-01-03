import type { SMSDeliveryReport } from '@dashboard-link/shared';

/**
 * Webhook delivery report from providers
 */
export interface DeliveryReport {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp: string;
  deliveredAt?: string;
  errorReason?: string;
  errorCode?: string;
  provider: string;
  rawData: Record<string, unknown>;
}

/**
 * Webhook handler interface for providers
 */
export interface WebhookHandler {
  parseDeliveryReport(body: unknown): DeliveryReport;
  verifySignature(signature: string, body: string, secret: string): boolean;
}

/**
 * SMS Webhook Service
 * Handles delivery reports and callbacks from SMS providers
 * Following Zapier's webhook-based event processing
 */
export class SMSWebhookService {
  private webhookHandlers: Map<string, WebhookHandler> = new Map();
  private deliveryCallbacks: Array<(report: DeliveryReport) => void> = [];
  private deliveryReports: Map<string, DeliveryReport> = new Map();

  /**
   * Register a webhook handler for a provider
   */
  registerHandler(providerId: string, handler: WebhookHandler): void {
    this.webhookHandlers.set(providerId, handler);
  }

  /**
   * Handle incoming delivery report webhook
   */
  async handleDeliveryReport(
    providerId: string,
    body: unknown,
    signature?: string,
    secret?: string
  ): Promise<void> {
    const handler = this.webhookHandlers.get(providerId);
    
    if (!handler) {
      throw new Error(`No webhook handler registered for provider: ${providerId}`);
    }

    // Verify signature if provided
    if (signature && secret) {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const isValid = handler.verifySignature(signature, bodyString, secret);
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Parse delivery report
    const report = handler.parseDeliveryReport(body);
    
    // Store report
    this.deliveryReports.set(report.messageId, report);

    // Trigger callbacks
    for (const callback of this.deliveryCallbacks) {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in delivery callback:', error);
      }
    }
  }

  /**
   * Verify webhook signature for a provider
   */
  verifyWebhookSignature(
    providerId: string,
    signature: string,
    body: string,
    secret: string
  ): boolean {
    const handler = this.webhookHandlers.get(providerId);
    
    if (!handler) {
      throw new Error(`No webhook handler registered for provider: ${providerId}`);
    }

    return handler.verifySignature(signature, body, secret);
  }

  /**
   * Process callback from provider
   */
  async processCallback(
    providerId: string,
    data: unknown
  ): Promise<void> {
    // This is a generic callback processor
    // For now, it just handles delivery reports
    await this.handleDeliveryReport(providerId, data);
  }

  /**
   * Subscribe to delivery reports
   */
  onDeliveryReport(callback: (report: DeliveryReport) => void): () => void {
    this.deliveryCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.deliveryCallbacks.indexOf(callback);
      if (index > -1) {
        this.deliveryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get delivery report for a message
   */
  getDeliveryReport(messageId: string): DeliveryReport | undefined {
    return this.deliveryReports.get(messageId);
  }

  /**
   * Get all delivery reports
   */
  getAllDeliveryReports(): DeliveryReport[] {
    return Array.from(this.deliveryReports.values());
  }

  /**
   * Clear delivery reports
   */
  clearDeliveryReports(): void {
    this.deliveryReports.clear();
  }

  /**
   * Get delivery reports for a specific status
   */
  getDeliveryReportsByStatus(status: DeliveryReport['status']): DeliveryReport[] {
    return Array.from(this.deliveryReports.values())
      .filter(report => report.status === status);
  }

  /**
   * Get delivery reports for a specific provider
   */
  getDeliveryReportsByProvider(providerId: string): DeliveryReport[] {
    return Array.from(this.deliveryReports.values())
      .filter(report => report.provider === providerId);
  }
}

/**
 * Twilio Webhook Handler
 */
export class TwilioWebhookHandler implements WebhookHandler {
  parseDeliveryReport(body: unknown): DeliveryReport {
    const data = body as Record<string, unknown>;
    
    // Twilio webhook format
    const messageId = data.MessageSid as string || data.SmsSid as string;
    const status = this.mapTwilioStatus(data.MessageStatus as string || data.SmsStatus as string);
    
    return {
      messageId,
      status,
      timestamp: new Date().toISOString(),
      deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
      errorReason: data.ErrorMessage as string,
      errorCode: data.ErrorCode as string,
      provider: 'twilio',
      rawData: data
    };
  }

  verifySignature(_signature: string, _body: string, _authToken: string): boolean {
    // Twilio uses HMAC SHA-1 for signature verification
    // This is a simplified version - in production, use Twilio's SDK
    
    // For now, return true (implement proper signature verification)
    // In production: use crypto.createHmac('sha1', authToken).update(body).digest('base64')
    return true;
  }

  private mapTwilioStatus(twilioStatus: string): DeliveryReport['status'] {
    switch (twilioStatus?.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'sent':
      case 'sending':
        return 'sent';
      case 'failed':
      case 'undelivered':
        return 'failed';
      case 'queued':
      case 'accepted':
        return 'pending';
      default:
        return 'pending';
    }
  }
}

/**
 * AWS SNS Webhook Handler
 */
export class AWSSNSWebhookHandler implements WebhookHandler {
  parseDeliveryReport(body: unknown): DeliveryReport {
    const data = body as Record<string, unknown>;
    
    // AWS SNS notification format
    return {
      messageId: data.messageId as string,
      status: this.mapSNSStatus(data.status as string),
      timestamp: new Date().toISOString(),
      deliveredAt: data.deliveredAt as string,
      errorReason: data.providerResponse as string,
      provider: 'aws-sns',
      rawData: data
    };
  }

  verifySignature(_signature: string, _body: string, _secret: string): boolean {
    // AWS SNS signature verification
    // This is a simplified version - in production, verify SNS message signature
    return true;
  }

  private mapSNSStatus(snsStatus: string): DeliveryReport['status'] {
    switch (snsStatus?.toLowerCase()) {
      case 'success':
        return 'delivered';
      case 'failure':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

/**
 * MessageBird Webhook Handler
 */
export class MessageBirdWebhookHandler implements WebhookHandler {
  parseDeliveryReport(body: unknown): DeliveryReport {
    const data = body as Record<string, unknown>;
    
    // MessageBird webhook format
    return {
      messageId: data.id as string,
      status: this.mapMessageBirdStatus(data.status as string),
      timestamp: new Date().toISOString(),
      deliveredAt: data.statusDatetime as string,
      errorReason: data.statusReason as string,
      provider: 'messagebird',
      rawData: data
    };
  }

  verifySignature(_signature: string, _body: string, _secret: string): boolean {
    // MessageBird signature verification
    // This is a simplified version - in production, verify MessageBird signature
    return true;
  }

  private mapMessageBirdStatus(mbStatus: string): DeliveryReport['status'] {
    switch (mbStatus?.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'sent':
        return 'sent';
      case 'failed':
      case 'expired':
        return 'failed';
      case 'buffered':
      case 'scheduled':
        return 'pending';
      default:
        return 'pending';
    }
  }
}
