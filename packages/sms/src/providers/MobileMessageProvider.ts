import {
    SMSConfigValidationResult,
    SMSDeliveryReport,
    SMSHealthResult,
    SMSMessage,
    SMSProviderConfig,
    SMSResult,
    SMSStatus
} from '@dashboard-link/shared';
import { BaseSMSProvider } from '../base/BaseSMSProvider';

/**
 * MobileMessage.com.au Provider Adapter
 * Australian SMS provider implementation
 */
export class MobileMessageProvider extends BaseSMSProvider {
  readonly id = 'mobile-message';
  readonly name = 'Mobile Message';
  readonly version = '1.0.0';
  readonly description = 'Australian SMS provider for business messaging';

  private static readonly API_URL = 'https://api.mobilemessage.com.au/v1/messages';
  private username: string;
  private password: string;
  private defaultSenderId: string;

  constructor(config: { username: string; password: string; defaultSenderId?: string }) {
    super();
    this.username = config.username;
    this.password = config.password;
    this.defaultSenderId = config.defaultSenderId || 'DashLink';
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

      // Transform to MobileMessage format
      const payload = {
        to: message.to,
        message: message.body,
        from: message.from || this.defaultSenderId,
      };

      // Make API request
      const response = await this.makeAPIRequest('POST', payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.createErrorResult(
          `MobileMessage API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`,
          'temporary',
          errorData
        );
      }

      const result = await response.json();

      // Transform response to standard format
      const deliveryReport: SMSDeliveryReport = {
        status: 'sent',
        attempts: 1
      };

      return this.createSuccessResult(
        result.message_id,
        result,
        result.cost,
        deliveryReport
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(errorMessage, 'temporary');
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await this.makeAPIRequest('GET', null, messageId);

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data = await response.json();

      // Map MobileMessage status to standard format
      let status: SMSStatus['status'] = 'unknown';
      if (data.status === 'delivered') {
        status = 'delivered';
      } else if (data.status === 'sent') {
        status = 'sent';
      } else if (data.status === 'failed') {
        status = 'failed';
      } else if (data.status === 'pending') {
        status = 'pending';
      }

      return this.createStatus(
        messageId,
        status,
        data.delivered_at,
        data.error_reason,
        data.cost,
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

    if (!settings.username) {
      errors.push('MobileMessage username is required');
    }

    if (!settings.password) {
      errors.push('MobileMessage password is required');
    }

    if (settings.defaultSenderId && settings.defaultSenderId.length > 11) {
      warnings.push('Sender ID should be 11 characters or less');
    }

    // Test API connection if credentials are provided
    if (settings.username && settings.password) {
      try {
        const healthResult = await this.getHealthCheck();
        if (!healthResult.healthy) {
          errors.push('API connection failed: ' + healthResult.error);
        }
      } catch (error) {
        errors.push('API connection test failed');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  async getHealthCheck(): Promise<SMSHealthResult> {
    const startTime = Date.now();

    try {
      // Make a simple API request to check connectivity
      const response = await fetch(`${MobileMessageProvider.API_URL}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return this.createHealthResult(true, responseTime);
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

  // Private helper methods
  private async makeAPIRequest(
    method: 'GET' | 'POST',
    payload?: Record<string, unknown>,
    messageId?: string
  ): Promise<Response> {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
    let url = MobileMessageProvider.API_URL;
    if (messageId) {
      url += `/${messageId}`;
    }

    return fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined,
    });
  }
}
