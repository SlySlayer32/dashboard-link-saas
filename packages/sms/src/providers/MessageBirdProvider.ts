import {
  SMSConfigValidationResult,
  SMSHealthResult,
  SMSMessage,
  SMSProviderConfig,
  SMSResult,
  SMSStatus
} from '@dashboard-link/shared';
import { BaseSMSProvider } from '../base/BaseSMSProvider';

/**
 * MessageBird SMS Provider Adapter
 * European SMS provider with global reach
 */
export class MessageBirdProvider extends BaseSMSProvider {
  readonly id = 'messagebird';
  readonly name = 'MessageBird';
  readonly version = '1.0.0';
  readonly description = 'MessageBird SMS and Voice provider with global coverage';

  private accessKey: string;
  private defaultOriginator?: string;

  constructor(config: { accessKey: string; defaultOriginator?: string }) {
    super();
    this.accessKey = config.accessKey;
    this.defaultOriginator = config.defaultOriginator;
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      // Validate message
      const validationErrors = this.validateMessage(message);
      if (validationErrors.length > 0) {
        return this.createErrorResult(
          validationErrors.join(', '),
          'permanent',
          undefined,
          false
        );
      }

      // Build MessageBird request
      const payload = {
        recipients: [message.to],
        originator: message.from || this.defaultOriginator || 'MessageBird',
        body: message.body,
        type: 'sms',
        datacoding: 'auto'
      };

      // Add scheduling if provided
      if (message.scheduledFor) {
        (payload as any).scheduledDatetime = new Date(message.scheduledFor).toISOString();
      }

      // Make API request
      const response = await this.makeAPIRequest('POST', 'messages', payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.createErrorResult(
          `MessageBird error: ${response.status} ${response.statusText} - ${errorData.errors?.[0]?.description || 'Unknown error'}`,
          'temporary',
          errorData
        );
      }

      const result = await response.json();

      return this.createSuccessResult(
        result.id,
        result,
        this.calculateCost(result)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(errorMessage, 'temporary');
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await this.makeAPIRequest('GET', `messages/${messageId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data = await response.json();

      // Map MessageBird status
      let status: SMSStatus['status'] = 'unknown';
      if (data.recipients?.items?.[0]) {
        const recipientStatus = data.recipients.items[0].status;
        status = this.mapMessageBirdStatus(recipientStatus);
      }

      return this.createStatus(
        messageId,
        status,
        data.recipients?.items?.[0]?.statusDatetime,
        data.recipients?.items?.[0]?.statusReason,
        this.calculateCost(data),
        data
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createStatus(messageId, 'unknown', undefined, errorMessage);
    }
  }

  async validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const settings = config.settings as any;

    if (!settings.accessKey) {
      errors.push('MessageBird Access Key is required');
    } else if (settings.accessKey.length < 20) {
      errors.push('Invalid MessageBird Access Key format');
    }

    if (settings.defaultOriginator) {
      if (settings.defaultOriginator.length > 11) {
        warnings.push('Originator should not exceed 11 characters');
      }
    }

    // Test API connection
    if (settings.accessKey) {
      try {
        const health = await this.getHealthCheck();
        if (!health.healthy) {
          errors.push('MessageBird connection failed: ' + health.error);
        }
      } catch (error) {
        errors.push('MessageBird connection test failed');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  async getHealthCheck(): Promise<SMSHealthResult> {
    const startTime = Date.now();

    try {
      // Check balance endpoint
      const response = await this.makeAPIRequest('GET', 'balance');

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const balance = await response.json();
        return this.createHealthResult(true, responseTime, undefined, {
          balance: balance.amount,
          currency: balance.type
        });
      } else {
        return this.createHealthResult(
          false,
          responseTime,
          `Health check failed: ${response.status}`
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createHealthResult(false, responseTime, errorMessage);
    }
  }

  supportsDeliveryReports(): boolean {
    return true;
  }

  supportsScheduledMessages(): boolean {
    return true;
  }

  /**
   * Send Voice message (MessageBird-specific feature)
   */
  async sendVoiceMessage(message: SMSMessage): Promise<SMSResult> {
    try {
      const payload = {
        recipients: [message.to],
        body: message.body,
        language: 'en-us',
        voice: 'male'
      };

      const response = await this.makeAPIRequest('POST', 'voicemessages', payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.createErrorResult(
          `MessageBird Voice error: ${response.status}`,
          'temporary',
          errorData
        );
      }

      const result = await response.json();

      return this.createSuccessResult(
        result.id,
        result,
        this.calculateCost(result)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(errorMessage, 'temporary');
    }
  }

  /**
   * Map MessageBird status to standard format
   */
  private mapMessageBirdStatus(mbStatus: string): SMSStatus['status'] {
    switch (mbStatus?.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'sent':
        return 'sent';
      case 'failed':
      case 'delivery_failed':
      case 'expired':
        return 'failed';
      case 'buffered':
      case 'scheduled':
        return 'pending';
      default:
        return 'unknown';
    }
  }

  /**
   * Calculate cost from MessageBird response
   */
  private calculateCost(data: any): number {
    // MessageBird includes pricing in the response
    if (data.mccmnc && data.pricing) {
      return parseFloat(data.pricing.amount) || 0;
    }
    return 0.01; // Default estimate
  }

  /**
   * Make API request to MessageBird
   */
  private async makeAPIRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    payload?: Record<string, unknown>
  ): Promise<Response> {
    const url = `https://rest.messagebird.com/${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `AccessKey ${this.accessKey}`,
        'Content-Type': 'application/json',
      }
    };

    if (method === 'POST' && payload) {
      options.body = JSON.stringify(payload);
    }

    return fetch(url, options);
  }
}
