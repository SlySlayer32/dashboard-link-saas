import { describe, it, expect } from 'vitest';
import {
  formatToE164,
  isValidE164,
  extractCountryCode,
  getCountryFromCode,
  maskPhoneNumber,
  arePhonesEqual
} from '../../utils/phoneUtils';

describe('phoneUtils', () => {
  describe('formatToE164', () => {
    it('should format phone number to E.164', () => {
      const result = formatToE164('0412345678', '+61');
      expect(result).toBe('+610412345678');
    });

    it('should preserve existing + prefix', () => {
      const result = formatToE164('+61412345678', '+1');
      expect(result).toBe('+61412345678');
    });

    it('should remove non-digit characters', () => {
      const result = formatToE164('(041) 234-5678', '+61');
      expect(result).toBe('+610412345678');
    });
  });

  describe('isValidE164', () => {
    it('should validate correct E.164 numbers', () => {
      expect(isValidE164('+61412345678')).toBe(true);
      expect(isValidE164('+1234567890')).toBe(true);
      expect(isValidE164('+442071234567')).toBe(true);
    });

    it('should reject invalid E.164 numbers', () => {
      expect(isValidE164('0412345678')).toBe(false);
      expect(isValidE164('+0412345678')).toBe(false); // Can't start with 0
      expect(isValidE164('61412345678')).toBe(false); // Missing +
      expect(isValidE164('+61')).toBe(false); // Too short
    });

    it('should reject numbers with non-digits', () => {
      expect(isValidE164('+61 412 345 678')).toBe(false);
      expect(isValidE164('+61-412-345-678')).toBe(false);
    });
  });

  describe('extractCountryCode', () => {
    it('should extract 1-digit country codes', () => {
      expect(extractCountryCode('+1234567890')).toBe('+1');
      expect(extractCountryCode('+7234567890')).toBe('+7');
    });

    it('should extract 2-digit country codes', () => {
      expect(extractCountryCode('+61412345678')).toBe('+61');
      expect(extractCountryCode('+44207123456')).toBe('+44');
    });

    it('should extract 3-digit country codes', () => {
      expect(extractCountryCode('+234123456789')).toBe('+234');
      expect(extractCountryCode('+212123456789')).toBe('+212');
    });

    it('should return empty string for invalid format', () => {
      expect(extractCountryCode('61412345678')).toBe('');
    });
  });

  describe('getCountryFromCode', () => {
    it('should return country name for known codes', () => {
      expect(getCountryFromCode('+1')).toBe('United States/Canada');
      expect(getCountryFromCode('+61')).toBe('Australia');
      expect(getCountryFromCode('+44')).toBe('United Kingdom');
      expect(getCountryFromCode('+86')).toBe('China');
    });

    it('should return Unknown for unrecognized codes', () => {
      expect(getCountryFromCode('+999')).toBe('Unknown');
    });
  });

  describe('maskPhoneNumber', () => {
    it('should mask all but last 4 digits', () => {
      expect(maskPhoneNumber('+61412345678')).toBe('**********5678');
      expect(maskPhoneNumber('1234567890')).toBe('******7890');
    });

    it('should handle short numbers', () => {
      expect(maskPhoneNumber('123')).toBe('****');
      expect(maskPhoneNumber('+1')).toBe('****');
    });
  });

  describe('arePhonesEqual', () => {
    it('should return true for identical numbers', () => {
      expect(arePhonesEqual('+61412345678', '+61412345678')).toBe(true);
    });

    it('should return true for same number with different formatting', () => {
      expect(arePhonesEqual('+61 412 345 678', '+61412345678')).toBe(true);
      expect(arePhonesEqual('(041) 234-5678', '0412345678')).toBe(true);
    });

    it('should return false for different numbers', () => {
      expect(arePhonesEqual('+61412345678', '+61487654321')).toBe(false);
    });
  });
});
