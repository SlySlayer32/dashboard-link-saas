/**
 * Validation Middleware
 * Provides middleware for validating SMS operations
 */

import { SMSMessage } from '@dashboard-link/shared';
import { SMSValidationService, ValidationResult } from '../services/SMSValidationService';

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validation Middleware
 */
export class ValidationMiddleware {
  private validator: SMSValidationService;
  private strictMode: boolean;

  constructor(validator?: SMSValidationService, strictMode: boolean = true) {
    this.validator = validator || new SMSValidationService();
    this.strictMode = strictMode;
  }

  /**
   * Validate a single message
   */
  async validateMessage(message: SMSMessage): Promise<ValidationResult> {
    return this.validator.validateMessage(message);
  }

  /**
   * Validate and sanitize message
   */
  async validateAndSanitize(message: SMSMessage): Promise<{
    valid: boolean;
    sanitized: SMSMessage;
    errors: string[];
    warnings: string[];
  }> {
    const validation = this.validator.validateMessage(message);
    const sanitized = this.validator.sanitizeMessage(message);

    return {
      valid: validation.valid,
      sanitized,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  /**
   * Validate batch of messages
   */
  async validateBatch(messages: SMSMessage[]): Promise<{
    valid: boolean;
    results: ValidationResult[];
    validMessages: SMSMessage[];
    invalidMessages: SMSMessage[];
  }> {
    const batchResult = this.validator.validateBatch(messages);
    
    const validMessages: SMSMessage[] = [];
    const invalidMessages: SMSMessage[] = [];

    batchResult.results.forEach((result, index) => {
      if (result.valid) {
        validMessages.push(messages[index]);
      } else {
        invalidMessages.push(messages[index]);
      }
    });

    return {
      valid: batchResult.valid,
      results: batchResult.results,
      validMessages,
      invalidMessages
    };
  }

  /**
   * Middleware function for request validation
   */
  middleware() {
    return async (message: SMSMessage, next: () => Promise<unknown>) => {
      const result = await this.validateMessage(message);

      if (!result.valid) {
        if (this.strictMode) {
          throw new ValidationError(
            'Message validation failed',
            result.errors
          );
        } else {
          // Log warnings but continue
          console.warn('Validation warnings:', result.warnings);
        }
      }

      return next();
    };
  }

  /**
   * Enable/disable strict mode
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * Get validator instance
   */
  getValidator(): SMSValidationService {
    return this.validator;
  }
}

/**
 * Decorator for validated operations
 */
export function validated(middleware: ValidationMiddleware) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (message: SMSMessage, ...args: unknown[]) {
      const result = await middleware.validateMessage(message);
      
      if (!result.valid) {
        throw new ValidationError(
          'Message validation failed',
          result.errors
        );
      }

      // Sanitize message before proceeding
      const sanitized = middleware.getValidator().sanitizeMessage(message);
      
      return originalMethod.call(this, sanitized, ...args);
    };

    return descriptor;
  };
}
