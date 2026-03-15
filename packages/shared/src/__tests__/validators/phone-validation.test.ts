/**
 * Phone Validation Security Tests (T085)
 *
 * Security-critical tests - 90% coverage target
 * Tests for:
 * - E.164 format validation
 * - AU mobile type verification
 * - Format normalization (spaces, dashes, +61 prefix)
 * - Invalid formats rejected
 * - International numbers rejected
 */

import { describe, it, expect } from 'vitest'
import { formatAustralianPhone } from '../../validators/phone'

describe('Phone Validation Security Tests (T085)', () => {
  describe('E.164 format validation', () => {
    it('should validate correct E.164 format (+614XXXXXXXX)', () => {
      const result = formatAustralianPhone('+61412345678')
      expect(result).toBe('+61412345678')
    })

    it('should ensure phone starts with +61', () => {
      const result = formatAustralianPhone('0412345678')
      expect(result).toMatch(/^\+61/)
    })

    it('should ensure total length is 12 characters for AU mobile', () => {
      const result = formatAustralianPhone('0412345678')
      expect(result).toHaveLength(12) // +61 + 9 digits
    })

    it('should reject phone without country code that is not AU format', () => {
      expect(() => formatAustralianPhone('1234567890')).toThrow()
    })
  })

  describe('AU mobile type verification', () => {
    it('should accept 04XX XXX XXX format', () => {
      const result = formatAustralianPhone('0412 345 678')
      expect(result).toBe('+61412345678')
    })

    it('should accept 04XXXXXXXX format', () => {
      const result = formatAustralianPhone('0412345678')
      expect(result).toBe('+61412345678')
    })

    it('should accept all valid AU mobile prefixes (040X-049X)', () => {
      const validPrefixes = [
        '0400',
        '0410',
        '0420',
        '0430',
        '0440',
        '0450',
        '0460',
        '0470',
        '0480',
        '0490',
      ]

      validPrefixes.forEach((prefix) => {
        const phone = `${prefix}123456`
        const result = formatAustralianPhone(phone)
        expect(result).toMatch(/^\+614[0-9]{8}$/)
      })
    })

    it('should reject landline numbers (02, 03, 07, 08)', () => {
      expect(() => formatAustralianPhone('0212345678')).toThrow()
      expect(() => formatAustralianPhone('0312345678')).toThrow()
      expect(() => formatAustralianPhone('0712345678')).toThrow()
      expect(() => formatAustralianPhone('0812345678')).toThrow()
    })

    it('should reject 1300/1800 numbers', () => {
      expect(() => formatAustralianPhone('1300123456')).toThrow()
      expect(() => formatAustralianPhone('1800123456')).toThrow()
    })
  })

  describe('format normalization', () => {
    it('should normalize spaces in phone number', () => {
      const result = formatAustralianPhone('0412 345 678')
      expect(result).toBe('+61412345678')
    })

    it('should normalize dashes in phone number', () => {
      const result = formatAustralianPhone('0412-345-678')
      expect(result).toBe('+61412345678')
    })

    it('should normalize mixed spaces and dashes', () => {
      const result = formatAustralianPhone('0412 345-678')
      expect(result).toBe('+61412345678')
    })

    it('should handle +61 prefix correctly', () => {
      const result = formatAustralianPhone('+61412345678')
      expect(result).toBe('+61412345678')
    })

    it('should convert 04XX to +614XX', () => {
      const result = formatAustralianPhone('0412345678')
      expect(result).toBe('+61412345678')
    })

    it('should handle +61 with spaces', () => {
      const result = formatAustralianPhone('+61 412 345 678')
      expect(result).toBe('+61412345678')
    })

    it('should remove all non-digit characters except leading +', () => {
      const result = formatAustralianPhone('0412.345.678')
      expect(result).toBe('+61412345678')
    })
  })

  describe('invalid formats rejected', () => {
    it('should reject empty string', () => {
      expect(() => formatAustralianPhone('')).toThrow()
    })

    it('should reject phone with letters', () => {
      expect(() => formatAustralianPhone('04123ABC78')).toThrow()
    })

    it('should reject phone too short', () => {
      expect(() => formatAustralianPhone('041234')).toThrow()
    })

    it('should reject phone too long', () => {
      expect(() => formatAustralianPhone('041234567890')).toThrow()
    })

    it('should reject phone with invalid prefix', () => {
      expect(() => formatAustralianPhone('0512345678')).toThrow()
      expect(() => formatAustralianPhone('0612345678')).toThrow()
    })

    it('should reject null or undefined', () => {
      expect(() => formatAustralianPhone(null as unknown as string)).toThrow()
      expect(() => formatAustralianPhone(undefined as unknown as string)).toThrow()
    })

    it('should reject special characters only', () => {
      expect(() => formatAustralianPhone('---')).toThrow()
      expect(() => formatAustralianPhone('   ')).toThrow()
    })
  })

  describe('international numbers rejected', () => {
    it('should reject US numbers (+1)', () => {
      expect(() => formatAustralianPhone('+12025551234')).toThrow()
    })

    it('should reject UK numbers (+44)', () => {
      expect(() => formatAustralianPhone('+447911123456')).toThrow()
    })

    it('should reject NZ numbers (+64)', () => {
      expect(() => formatAustralianPhone('+64212345678')).toThrow()
    })

    it('should reject other country codes', () => {
      expect(() => formatAustralianPhone('+33123456789')).toThrow() // France
      expect(() => formatAustralianPhone('+49123456789')).toThrow() // Germany
      expect(() => formatAustralianPhone('+8612345678901')).toThrow() // China
    })

    it('should only accept +61 country code', () => {
      const result = formatAustralianPhone('+61412345678')
      expect(result).toMatch(/^\+61/)
    })
  })

  describe('edge cases', () => {
    it('should handle phone with parentheses', () => {
      const result = formatAustralianPhone('(04) 1234 5678')
      expect(result).toBe('+61412345678')
    })

    it('should handle phone with multiple spaces', () => {
      const result = formatAustralianPhone('0412   345   678')
      expect(result).toBe('+61412345678')
    })

    it('should be case-insensitive for validation', () => {
      // Phone numbers shouldn't have letters, but test robustness
      expect(() => formatAustralianPhone('04123ABC78')).toThrow()
    })

    it('should handle leading/trailing whitespace', () => {
      const result = formatAustralianPhone('  0412345678  ')
      expect(result).toBe('+61412345678')
    })

    it('should reject phone with only country code', () => {
      expect(() => formatAustralianPhone('+61')).toThrow()
    })

    it('should reject phone with incomplete number', () => {
      expect(() => formatAustralianPhone('+6141234')).toThrow()
    })
  })

  describe('security validation', () => {
    it('should prevent SQL injection attempts', () => {
      expect(() => formatAustralianPhone("0412345678'; DROP TABLE workers;--")).toThrow()
    })

    it('should prevent script injection', () => {
      expect(() => formatAustralianPhone('<script>alert("xss")</script>')).toThrow()
    })

    it('should handle very long strings safely', () => {
      const longString = '0'.repeat(1000)
      expect(() => formatAustralianPhone(longString)).toThrow()
    })

    it('should reject unicode characters', () => {
      expect(() => formatAustralianPhone('0412３４５６７８')).toThrow()
    })

    it('should reject emoji', () => {
      expect(() => formatAustralianPhone('0412345678😀')).toThrow()
    })
  })

  describe('consistency validation', () => {
    it('should produce same output for equivalent inputs', () => {
      const inputs = [
        '0412345678',
        '0412 345 678',
        '0412-345-678',
        '+61412345678',
        '+61 412 345 678',
      ]

      const results = inputs.map((input) => formatAustralianPhone(input))
      const uniqueResults = [...new Set(results)]

      expect(uniqueResults).toHaveLength(1)
      expect(uniqueResults[0]).toBe('+61412345678')
    })

    it('should be idempotent (formatting twice gives same result)', () => {
      const phone = '0412345678'
      const firstFormat = formatAustralianPhone(phone)
      const secondFormat = formatAustralianPhone(firstFormat)

      expect(firstFormat).toBe(secondFormat)
    })
  })
})
