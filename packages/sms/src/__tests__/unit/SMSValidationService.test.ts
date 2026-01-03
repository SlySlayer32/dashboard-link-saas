import { describe, it, expect, beforeEach } from 'vitest';
import { SMSValidationService } from '../../services/SMSValidationService';

describe('SMSValidationService', () => {
  let validator: SMSValidationService;

  beforeEach(() => {
    validator = new SMSValidationService();
  });

  describe('validateMessage', () => {
    it('should validate a valid message', () => {
      const message = {
        to: '+61412345678',
        body: 'Test message'
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message without recipient', () => {
      const message = {
        to: '',
        body: 'Test message'
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Recipient phone number is required');
    });

    it('should reject message with invalid phone number', () => {
      const message = {
        to: '1234567890', // Missing country code
        body: 'Test message'
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('E.164 format'))).toBe(true);
    });

    it('should reject message without body', () => {
      const message = {
        to: '+61412345678',
        body: ''
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Message body is required');
    });

    it('should reject message that is too long', () => {
      const message = {
        to: '+61412345678',
        body: 'a'.repeat(1601)
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too long'))).toBe(true);
    });

    it('should warn about multi-segment messages', () => {
      const message = {
        to: '+61412345678',
        body: 'a'.repeat(200)
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('segments'))).toBe(true);
    });

    it('should reject invalid priority', () => {
      const message = {
        to: '+61412345678',
        body: 'Test message',
        priority: 'invalid' as any
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Priority'))).toBe(true);
    });

    it('should reject past scheduled time', () => {
      const pastDate = new Date(Date.now() - 1000);
      const message = {
        to: '+61412345678',
        body: 'Test message',
        scheduledFor: pastDate
      };

      const result = validator.validateMessage(message);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('future'))).toBe(true);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate a valid E.164 phone number', () => {
      const result = validator.validatePhoneNumber('+61412345678');

      expect(result.valid).toBe(true);
      expect(result.formatted).toBe('+61412345678');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject phone number without country code', () => {
      const result = validator.validatePhoneNumber('0412345678');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('E.164'))).toBe(true);
    });

    it('should reject empty phone number', () => {
      const result = validator.validatePhoneNumber('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phone number is required');
    });
  });

  describe('validateBatch', () => {
    it('should validate a batch of valid messages', () => {
      const messages = [
        { to: '+61412345678', body: 'Message 1' },
        { to: '+61487654321', body: 'Message 2' }
      ];

      const result = validator.validateBatch(messages);

      expect(result.valid).toBe(true);
      expect(result.totalErrors).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should detect errors in batch', () => {
      const messages = [
        { to: '+61412345678', body: 'Message 1' },
        { to: 'invalid', body: 'Message 2' },
        { to: '+61487654321', body: '' }
      ];

      const result = validator.validateBatch(messages);

      expect(result.valid).toBe(false);
      expect(result.totalErrors).toBeGreaterThan(0);
      expect(result.results).toHaveLength(3);
    });

    it('should reject empty batch', () => {
      const result = validator.validateBatch([]);

      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    it('should trim whitespace from phone numbers', () => {
      const message = {
        to: '  +61412345678  ',
        body: 'Test message'
      };

      const sanitized = validator.sanitizeMessage(message);

      expect(sanitized.to).toBe('+61412345678');
    });

    it('should sanitize message body', () => {
      const message = {
        to: '+61412345678',
        body: '  Test   message  with  spaces  '
      };

      const sanitized = validator.sanitizeMessage(message);

      expect(sanitized.body).not.toContain('  '); // No double spaces
      expect(sanitized.body).toBe(sanitized.body.trim());
    });

    it('should remove control characters', () => {
      const message = {
        to: '+61412345678',
        body: 'Test\x00message\x07with\x08control'
      };

      const sanitized = validator.sanitizeMessage(message);

      expect(sanitized.body).not.toContain('\x00');
      expect(sanitized.body).not.toContain('\x07');
      expect(sanitized.body).not.toContain('\x08');
    });
  });

  describe('estimateSegments', () => {
    it('should return 1 segment for short message', () => {
      const segments = validator.estimateSegments('Short message');

      expect(segments).toBe(1);
    });

    it('should return multiple segments for long message', () => {
      const longMessage = 'a'.repeat(200);
      const segments = validator.estimateSegments(longMessage);

      expect(segments).toBeGreaterThan(1);
    });
  });

  describe('containsURL', () => {
    it('should detect URLs in message', () => {
      const hasUrl = validator.containsURL('Check out https://example.com');

      expect(hasUrl).toBe(true);
    });

    it('should return false for message without URL', () => {
      const hasUrl = validator.containsURL('Just a regular message');

      expect(hasUrl).toBe(false);
    });
  });

  describe('extractURLs', () => {
    it('should extract URLs from message', () => {
      const urls = validator.extractURLs('Visit https://example.com and http://test.com');

      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('http://test.com');
    });

    it('should return empty array for message without URLs', () => {
      const urls = validator.extractURLs('No URLs here');

      expect(urls).toHaveLength(0);
    });
  });
});
