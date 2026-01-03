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
 * AWS SNS SMS Provider Adapter
 * Amazon Simple Notification Service implementation
 */
export class AWSSNSProvider extends BaseSMSProvider {
  readonly id = 'aws-sns';
  readonly name = 'AWS SNS';
  readonly version = '1.0.0';
  readonly description = 'Amazon Simple Notification Service SMS provider';

  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private defaultSenderId?: string;

  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    defaultSenderId?: string;
  }) {
    super();
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.region = config.region;
    this.defaultSenderId = config.defaultSenderId;
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

      // Build SNS request
      const payload = {
        Message: message.body,
        PhoneNumber: message.to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: message.priority === 'high' ? 'Transactional' : 'Promotional'
          }
        }
      };

      if (this.defaultSenderId) {
        payload.MessageAttributes['AWS.SNS.SMS.SenderID'] = {
          DataType: 'String',
          StringValue: this.defaultSenderId
        };
      }

      // Make API request (simplified - in production use AWS SDK)
      const response = await this.makeAPIRequest('Publish', payload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return this.createErrorResult(
          `AWS SNS error: ${response.status} ${response.statusText}`,
          'temporary',
          errorData
        );
      }

      const result = await response.json();

      return this.createSuccessResult(
        result.MessageId || `sns-${Date.now()}`,
        result,
        0.01 // AWS SNS pricing varies by region
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(errorMessage, 'temporary');
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    // AWS SNS doesn't provide direct message status queries
    // Would need to use CloudWatch or SNS delivery status logging
    return this.createStatus(
      messageId,
      'unknown',
      undefined,
      'Status tracking not available for AWS SNS'
    );
  }

  async validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const settings = config.settings as any;

    if (!settings.accessKeyId) {
      errors.push('AWS Access Key ID is required');
    }

    if (!settings.secretAccessKey) {
      errors.push('AWS Secret Access Key is required');
    }

    if (!settings.region) {
      errors.push('AWS Region is required');
    } else {
      // Basic region format validation
      const regionRegex = /^[a-z]{2}-[a-z]+-\d{1}$/;
      if (!regionRegex.test(settings.region)) {
        warnings.push('AWS Region format may be invalid (expected format: us-east-1)');
      }
    }

    // Test connection if credentials provided
    if (settings.accessKeyId && settings.secretAccessKey && settings.region) {
      try {
        const health = await this.getHealthCheck();
        if (!health.healthy) {
          errors.push('AWS SNS connection failed: ' + health.error);
        }
      } catch (error) {
        errors.push('AWS SNS connection test failed');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  async getHealthCheck(): Promise<SMSHealthResult> {
    const startTime = Date.now();

    try {
      // Make a simple API request to check connectivity
      // In production, use AWS SDK's health check or list phone numbers
      const response = await this.makeAPIRequest('GetSMSAttributes', {
        attributes: ['MonthlySpendLimit']
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
    return true; // Via SNS delivery status logging
  }

  /**
   * Send to multiple numbers (SNS batch publish)
   */
  async sendToMultipleNumbers(message: SMSMessage, numbers: string[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];

    // AWS SNS doesn't have native batch sending
    // Send individually
    for (const number of numbers) {
      const result = await this.send({ ...message, to: number });
      results.push(result);
    }

    return results;
  }

  /**
   * Make API request to AWS SNS
   * Note: This is a simplified version - in production, use AWS SDK
   */
  private async makeAPIRequest(action: string, params: Record<string, any>): Promise<Response> {
    // This is a placeholder - in production, use AWS SDK for JavaScript
    // AWS SNS uses AWS Signature Version 4 for authentication
    
    const endpoint = `https://sns.${this.region}.amazonaws.com/`;
    
    const body = new URLSearchParams({
      Action: action,
      Version: '2010-03-31',
      ...this.flattenParams(params)
    }).toString();

    // In production, implement AWS Signature V4
    // For now, this is a placeholder
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': new Date().toISOString(),
        // Would need proper AWS Signature V4 headers
      },
      body
    });
  }

  /**
   * Flatten nested parameters for AWS API
   */
  private flattenParams(params: Record<string, any>, prefix: string = ''): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenParams(value, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(flattened, this.flattenParams(item, `${fullKey}.${index + 1}`));
          } else {
            flattened[`${fullKey}.${index + 1}`] = String(item);
          }
        });
      } else {
        flattened[fullKey] = String(value);
      }
    }

    return flattened;
  }
}
