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
 * Twilio SMS Provider Adapter
 * Global SMS provider implementation
 */
export class TwilioProvider extends BaseSMSProvider {
  readonly id = 'twilio';
  readonly name = 'Twilio';
  readonly version = '1.0.0';
  readonly description = 'Global SMS and MMS provider with extensive reach';

  private accountSid: string;
  private authToken: string;
  private defaultFrom: string;

  constructor(config: { accountSid: string; authToken: string; defaultFrom: string }) {
    super();
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.defaultFrom = config.defaultFrom;
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

      // Transform to Twilio format
      const payload = {
        To: message.to,
        Body: message.body,
        From: message.from || this.defaultFrom,
        StatusCallback: `${process.env.API_BASE_URL}/webhooks/sms/twilio/status`,
      };

      // Make API request
      const response = await this.makeAPIRequest('POST', 'Messages.json', payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.createErrorResult(
          `Twilio API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
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
        result.sid,
        result,
        parseFloat(result.price) || undefined,
        deliveryReport
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(errorMessage, 'temporary');
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await this.makeAPIRequest('GET', `Messages/${messageId}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data = await response.json();

      // Map Twilio status to standard format
      let status: SMSStatus['status'] = 'unknown';
      if (data.status === 'delivered') {
        status = 'delivered';
      } else if (data.status === 'sent') {
        status = 'sent';
      } else if (data.status === 'failed') {
        status = 'failed';
      } else if (data.status === 'queued' || data.status === 'sending') {
        status = 'pending';
      }

      return this.createStatus(
        messageId,
        status,
        data.date_updated,
        data.error_message,
        parseFloat(data.price) || undefined,
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

    if (!settings.accountSid) {
      errors.push('Twilio Account SID is required');
    } else if (!settings.accountSid.startsWith('AC')) {
      errors.push('Invalid Account SID format (should start with AC)');
    }

    if (!settings.authToken) {
      errors.push('Twilio Auth Token is required');
    }

    if (!settings.defaultFrom) {
      errors.push('Default From number is required');
    } else if (!settings.defaultFrom.startsWith('+')) {
      warnings.push('From number should be in E.164 format (e.g., +1234567890)');
    }

    // Test API connection if credentials are provided
    if (settings.accountSid && settings.authToken) {
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
      const response = await this.makeAPIRequest('GET', 'Accounts.json');

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

  supportsMMS(): boolean {
    return true;
  }

  // Private helper methods
  private async makeAPIRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    payload?: Record<string, unknown>
  ): Promise<Response> {
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    
    const url = `https://api.twilio.com/2010-04-01/${endpoint}`;

    const body = method === 'POST' ? 
      new URLSearchParams(payload as Record<string, string>).toString() : 
      undefined;

    return fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }
}
