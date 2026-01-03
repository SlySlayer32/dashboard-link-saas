/**
 * Logging Middleware
 * Provides structured logging for SMS operations
 */

import { SMSMessage, SMSResult } from '@dashboard-link/shared';
import { SMSLogger, LogMetadata, smsLogger } from '../utils/logger';

/**
 * Logging options
 */
export interface LoggingOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logPerformance?: boolean;
  maskPhoneNumbers?: boolean;
  includeMessageBody?: boolean;
}

/**
 * Logging Middleware
 */
export class LoggingMiddleware {
  private logger: SMSLogger;
  private options: LoggingOptions;

  constructor(logger?: SMSLogger, options?: LoggingOptions) {
    this.logger = logger || smsLogger;
    this.options = {
      logRequests: true,
      logResponses: true,
      logErrors: true,
      logPerformance: true,
      maskPhoneNumbers: true,
      includeMessageBody: false,
      ...options
    };
  }

  /**
   * Log SMS request
   */
  logRequest(message: SMSMessage, provider: string): void {
    if (!this.options.logRequests) return;

    const metadata: LogMetadata = {
      operation: 'send',
      provider,
      to: this.options.maskPhoneNumbers ? this.maskPhone(message.to) : message.to,
      from: message.from ? (this.options.maskPhoneNumbers ? this.maskPhone(message.from) : message.from) : undefined,
      priority: message.priority,
      scheduled: message.scheduledFor ? true : false
    };

    if (this.options.includeMessageBody) {
      metadata.bodyLength = message.body.length;
      metadata.bodyPreview = message.body.substring(0, 50);
    }

    this.logger.info('SMS request', metadata);
  }

  /**
   * Log SMS response
   */
  logResponse(result: SMSResult, duration?: number): void {
    if (!this.options.logResponses) return;

    const metadata: LogMetadata = {
      operation: 'send',
      provider: result.provider,
      messageId: result.messageId,
      success: result.success,
      cost: result.cost,
      duration
    };

    if (result.success) {
      this.logger.info('SMS sent successfully', metadata);
    } else {
      this.logger.warn('SMS send failed', metadata);
    }
  }

  /**
   * Log SMS error
   */
  logError(error: Error, provider: string, message?: SMSMessage): void {
    if (!this.options.logErrors) return;

    const metadata: LogMetadata = {
      operation: 'send',
      provider,
      to: message ? (this.options.maskPhoneNumbers ? this.maskPhone(message.to) : message.to) : undefined
    };

    this.logger.error('SMS operation error', error, metadata);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void {
    if (!this.options.logPerformance) return;

    this.logger.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...metadata
    });
  }

  /**
   * Middleware function for logging
   */
  middleware() {
    return async (
      message: SMSMessage,
      provider: string,
      operation: () => Promise<SMSResult>
    ): Promise<SMSResult> => {
      const startTime = Date.now();

      try {
        // Log request
        this.logRequest(message, provider);

        // Execute operation
        const result = await operation();

        // Log response
        const duration = Date.now() - startTime;
        this.logResponse(result, duration);

        if (this.options.logPerformance) {
          this.logPerformance('SMS send', duration, {
            provider,
            success: result.success
          });
        }

        return result;
      } catch (error) {
        // Log error
        this.logError(error as Error, provider, message);

        // Re-throw
        throw error;
      }
    };
  }

  /**
   * Mask phone number for privacy
   */
  private maskPhone(phone: string): string {
    if (phone.length < 4) {
      return '****';
    }
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  /**
   * Update logging options
   */
  setOptions(options: Partial<LoggingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get logger instance
   */
  getLogger(): SMSLogger {
    return this.logger;
  }
}

/**
 * Decorator for logged operations
 */
export function logged(middleware: LoggingMiddleware) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: SMSMessage, ...args: unknown[]) {
      const startTime = Date.now();

      try {
        middleware.getLogger().info(`Starting operation: ${propertyKey}`, {
          operation: propertyKey
        });

        const result = await originalMethod.call(this, message, ...args);

        const duration = Date.now() - startTime;
        middleware.logPerformance(propertyKey, duration);

        return result;
      } catch (error) {
        middleware.logError(error as Error, 'unknown', message);
        throw error;
      }
    };

    return descriptor;
  };
}
