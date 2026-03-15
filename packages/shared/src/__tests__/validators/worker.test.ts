import { describe, expect, it } from 'vitest'
import {
  formatAustralianPhone,
  formatPhoneDisplay,
  validateAustralianPhone,
} from '../../utils/phone'
import { nameSchema } from '../../validators/worker'

describe('worker phone validation utilities', () => {
  it.each(['0412345678', '0412 345 678', '0412-345-678', '+61412345678'])(
    'normalizes %s to E.164 format',
    (input: string) => {
      expect(formatAustralianPhone(input)).toBe('+61412345678')
    }
  )

  it('formats E.164 phone numbers for display', () => {
    expect(formatPhoneDisplay('+61412345678')).toBe('0412 345 678')
  })

  it.each(['0412345678', '0412 345 678', '0412-345-678', '+61412345678'])(
    'accepts valid Australian mobile number %s',
    (input: string) => {
      expect(validateAustralianPhone(input)).toBe(true)
    }
  )

  it.each(['0212345678', '+15551234567', '0412345', 'not-a-phone'])(
    'rejects invalid or non-mobile phone number %s',
    (input: string) => {
      expect(validateAustralianPhone(input)).toBe(false)
    }
  )

  it('throws for invalid phone formats during normalization', () => {
    expect(() => formatAustralianPhone('+15551234567')).toThrow(
      'Failed to format phone number: Phone number must be an Australian mobile number'
    )
  })
})

describe('worker name validation', () => {
  it('accepts a 1 character name', () => {
    expect(nameSchema.parse('J')).toBe('J')
  })

  it('accepts a 255 character name', () => {
    const name = 'a'.repeat(255)
    expect(nameSchema.parse(name)).toBe(name)
  })

  it('trims leading and trailing whitespace', () => {
    expect(nameSchema.parse('  John Smith  ')).toBe('John Smith')
  })

  it('supports apostrophes, hyphens, and unicode characters', () => {
    expect(nameSchema.parse("O'Brien")).toBe("O'Brien")
    expect(nameSchema.parse('Mary-Jane')).toBe('Mary-Jane')
    expect(nameSchema.parse('José García')).toBe('José García')
  })

  it('rejects empty names after trimming', () => {
    expect(() => nameSchema.parse('   ')).toThrow('Name cannot be empty')
  })

  it('rejects names longer than 255 characters', () => {
    expect(() => nameSchema.parse('a'.repeat(256))).toThrow('Name must be 255 characters or less')
  })
})
