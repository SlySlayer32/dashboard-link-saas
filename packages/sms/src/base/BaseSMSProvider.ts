import {
    SMSConfigValidationResult,
    SMSDeliveryReport,
    SMSError,
    SMSHealthResult,
    SMSMessage,
    SMSProvider,
    SMSProviderConfig,
    SMSResult,
    SMSStatus
} from '@dashboard-link/shared';

/**
 * Base SMS Provider Adapter
 * Provides standardized implementation for all SMS providers
 * Following Zapier's adapter pattern
 */
export abstract class BaseSMSProvider implements SMSProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description?: string;

  // Abstract methods that each provider must implement
  abstract send(message: SMSMessage): Promise<SMSResult>;
  abstract getStatus(messageId: string): Promise<SMSStatus>;
  abstract validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult>;
  abstract getHealthCheck(): Promise<SMSHealthResult>;

  // Optional capabilities with default implementations
  supportsDeliveryReports(): boolean {
    return false;
  }

  supportsScheduledMessages(): boolean {
    return false;
  }

  supportsMMS(): boolean {
    return false;
  }

  // Common utility methods
  protected createSuccessResult(
    messageId: string,
    providerData?: Record<string, unknown>,
    cost?: number,
    deliveryReport?: SMSDeliveryReport
  ): SMSResult {
    return {
      success: true,
      messageId,
      provider: this.id,
      timestamp: new Date().toISOString(),
      cost,
      deliveryReport,
      metadata: providerData
    };
  }

  protected createErrorResult(
    error: string,
    errorType: SMSError['type'] = 'temporary',
    providerData?: Record<string, unknown>,
    retryable: boolean = true
  ): SMSResult {
    return {
      success: false,
      messageId: '', // No message ID for failed sends
      provider: this.id,
      timestamp: new Date().toISOString(),
      error,
      errorType: errorType as 'temporary' | 'permanent' | 'rate_limit' | 'invalid_number',
      metadata: providerData
    };
  }

  protected createHealthResult(
    healthy: boolean,
    responseTime?: number,
    error?: string,
    metadata?: Record<string, unknown>
  ): SMSHealthResult {
    return {
      healthy,
      responseTime,
      error,
      lastChecked: new Date().toISOString(),
      metadata
    };
  }

  protected createValidationResult(
    valid: boolean,
    errors?: string[],
    warnings?: string[]
  ): SMSConfigValidationResult {
    return {
      valid,
      errors,
      warnings
    };
  }

  protected createStatus(
    messageId: string,
    status: SMSStatus['status'],
    deliveredAt?: string,
    errorReason?: string,
    cost?: number,
    metadata?: Record<string, unknown>
  ): SMSStatus {
    return {
      messageId,
      status,
      timestamp: new Date().toISOString(),
      deliveredAt,
      errorReason,
      cost,
      metadata
    };
  }

  // Common validation logic
  protected validatePhoneNumber(phone: string): boolean {
    // Basic E.164 validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  protected validateMessage(message: SMSMessage): string[] {
    const errors: string[] = [];

    if (!message.to) {
      errors.push('Recipient phone number is required');
    } else if (!this.validatePhoneNumber(message.to)) {
      errors.push('Invalid phone number format (must be E.164)');
    }

    if (!message.body) {
      errors.push('Message body is required');
    } else if (message.body.length > 1600) {
      errors.push('Message body too long (max 1600 characters)');
    }

    return errors;
  }

  // Rate limiting helper
  protected async checkRateLimit(
    config: SMSProviderConfig,
    currentUsage: number
  ): Promise<boolean> {
    const rateLimit = config.rateLimits;
    if (!rateLimit) return true;

    // Check per-second limit
    if (rateLimit.messagesPerSecond && currentUsage >= rateLimit.messagesPerSecond) {
      return false;
    }

    // Check per-day limit (would need to track daily usage)
    if (rateLimit.messagesPerDay) {
      // This would require a database or cache to track daily usage
      // For now, we'll assume it's not exceeded
    }

    return true;
  }

  // Retry logic helper
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Transform helper for provider-specific formats
  protected transformToProviderFormat(message: SMSMessage): Record<string, unknown> {
    return {
      to: message.to,
      body: message.body,
      from: message.from,
      // Add provider-specific transformations in subclasses
    };
  }

  // Transform helper for provider responses
  protected transformFromProviderResponse(
    response: Record<string, unknown>,
    messageId: string
  ): SMSResult {
    // Default transformation - override in subclasses
    return this.createSuccessResult(messageId, response);
  }
}
