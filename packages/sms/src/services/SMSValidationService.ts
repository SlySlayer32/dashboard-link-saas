import { SMSMessage } from '@dashboard-link/shared';

/**
 * Validation result for individual messages
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result for batch operations
 */
export interface BatchValidationResult {
  valid: boolean;
  results: ValidationResult[];
  totalErrors: number;
  totalWarnings: number;
}

/**
 * Phone number validation result with details
 */
export interface PhoneNumberValidationResult {
  valid: boolean;
  formatted?: string; // E.164 format
  country?: string;
  carrier?: string;
  type?: 'mobile' | 'landline' | 'voip' | 'unknown';
  errors: string[];
}

/**
 * SMS Validation Service
 * Provides comprehensive validation for SMS messages and phone numbers
 * Following Zapier's validation-first approach
 */
export class SMSValidationService {
  private readonly MAX_SMS_LENGTH = 160;
  private readonly MAX_CONCATENATED_LENGTH = 1600;
  private readonly E164_REGEX = /^\+[1-9]\d{1,14}$/;

  /**
   * Validate a single SMS message
   */
  validateMessage(message: SMSMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate phone number
    if (!message.to) {
      errors.push('Recipient phone number is required');
    } else {
      const phoneValidation = this.validatePhoneNumber(message.to);
      if (!phoneValidation.valid) {
        errors.push(...phoneValidation.errors);
      }
    }

    // Validate message body
    if (!message.body) {
      errors.push('Message body is required');
    } else if (message.body.trim().length === 0) {
      errors.push('Message body cannot be empty');
    } else {
      // Check length and add warnings
      if (message.body.length > this.MAX_SMS_LENGTH) {
        warnings.push(
          `Message exceeds ${this.MAX_SMS_LENGTH} characters and will be sent as ${Math.ceil(message.body.length / this.MAX_SMS_LENGTH)} segments`
        );
      }

      if (message.body.length > this.MAX_CONCATENATED_LENGTH) {
        errors.push(`Message too long (max ${this.MAX_CONCATENATED_LENGTH} characters)`);
      }

      // Check for special characters that might cause encoding issues
      const specialChars = /[^\x00-\x7F]/g;
      if (specialChars.test(message.body)) {
        warnings.push('Message contains special characters which may reduce max length to 70 characters per segment');
      }
    }

    // Validate sender ID (optional but important)
    if (message.from) {
      const fromValidation = this.validatePhoneNumber(message.from);
      if (!fromValidation.valid) {
        // Check if it's an alphanumeric sender ID (allowed in some regions)
        if (!/^[a-zA-Z0-9]{1,11}$/.test(message.from)) {
          warnings.push('Sender ID should be a valid phone number or alphanumeric (max 11 characters)');
        }
      }
    }

    // Validate priority
    if (message.priority && !['low', 'normal', 'high'].includes(message.priority)) {
      errors.push('Priority must be low, normal, or high');
    }

    // Validate scheduled time
    if (message.scheduledFor) {
      const scheduledDate = new Date(message.scheduledFor);
      const now = new Date();
      
      if (isNaN(scheduledDate.getTime())) {
        errors.push('Invalid scheduled date format');
      } else if (scheduledDate < now) {
        errors.push('Scheduled time must be in the future');
      } else if (scheduledDate.getTime() - now.getTime() > 7 * 24 * 60 * 60 * 1000) {
        warnings.push('Messages scheduled more than 7 days in advance may not be supported by all providers');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate phone number format and details
   */
  validatePhoneNumber(phone: string): PhoneNumberValidationResult {
    const errors: string[] = [];

    if (!phone) {
      errors.push('Phone number is required');
      return { valid: false, errors };
    }

    // Trim whitespace
    const cleanPhone = phone.trim();

    // Check E.164 format
    if (!this.E164_REGEX.test(cleanPhone)) {
      errors.push('Phone number must be in E.164 format (e.g., +61412345678)');
      
      // Provide helpful suggestions
      if (!cleanPhone.startsWith('+')) {
        errors.push('Phone number must start with + followed by country code');
      }
      
      return { valid: false, errors };
    }

    // Extract country code (basic detection)
    const countryCode = this.extractCountryCode(cleanPhone);

    return {
      valid: true,
      formatted: cleanPhone,
      country: countryCode,
      type: 'mobile', // Would need external service for accurate detection
      errors: []
    };
  }

  /**
   * Validate a batch of messages
   */
  validateBatch(messages: SMSMessage[]): BatchValidationResult {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        valid: false,
        results: [],
        totalErrors: 1,
        totalWarnings: 0
      };
    }

    const results = messages.map(msg => this.validateMessage(msg));
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      valid: totalErrors === 0,
      results,
      totalErrors,
      totalWarnings
    };
  }

  /**
   * Sanitize message to remove potentially harmful content
   */
  sanitizeMessage(message: SMSMessage): SMSMessage {
    return {
      ...message,
      to: message.to?.trim() || '',
      body: this.sanitizeBody(message.body || ''),
      from: message.from?.trim(),
      metadata: this.sanitizeMetadata(message.metadata)
    };
  }

  /**
   * Sanitize message body
   */
  private sanitizeBody(body: string): string {
    // Remove control characters except newline and carriage return
    let sanitized = body.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Remove potential injection attempts (basic protection)
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/<script/gi, '');
    
    return sanitized;
  }

  /**
   * Sanitize metadata object
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Only allow safe data types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.filter(v => 
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );
      }
    }

    return sanitized;
  }

  /**
   * Extract country code from E.164 phone number
   */
  private extractCountryCode(phone: string): string {
    // Basic country code extraction
    // In production, use a library like libphonenumber
    const code = phone.substring(1, 4);
    
    // Common country codes
    const countryCodes: Record<string, string> = {
      '1': 'US/CA',
      '44': 'GB',
      '61': 'AU',
      '64': 'NZ',
      '91': 'IN',
      '86': 'CN',
      '81': 'JP',
      '82': 'KR',
      '49': 'DE',
      '33': 'FR'
    };

    // Try 1-3 digit codes
    for (let i = 3; i >= 1; i--) {
      const substr = code.substring(0, i);
      if (countryCodes[substr]) {
        return countryCodes[substr];
      }
    }

    return 'Unknown';
  }

  /**
   * Estimate message segments for cost calculation
   */
  estimateSegments(message: string): number {
    // GSM-7 encoding (standard)
    const gsmRegex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà\^{}\\\[~\]\|€]*$/;
    
    if (gsmRegex.test(message)) {
      // GSM-7 encoding: 160 chars per segment
      return Math.ceil(message.length / 160);
    } else {
      // UCS-2 encoding (Unicode): 70 chars per segment
      return Math.ceil(message.length / 70);
    }
  }

  /**
   * Check if message contains URLs
   */
  containsURL(message: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(message);
  }

  /**
   * Extract URLs from message
   */
  extractURLs(message: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.match(urlRegex) || [];
  }
}
