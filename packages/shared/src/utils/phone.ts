import { parsePhoneNumber } from 'libphonenumber-js'

/**
 * Format and validate Australian phone number to E.164 format
 * Validates mobile type and converts to +614XXXXXXXX
 * Uses libphonenumber-js for robust validation
 */
export function formatAustralianPhone(phone: string): string {
  try {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    const phoneNumber = parsePhoneNumber(cleaned, 'AU')

    if (!phoneNumber?.isValid()) {
      throw new Error('Invalid Australian phone number')
    }

    if (phoneNumber.getType() !== 'MOBILE') {
      throw new Error('Phone number must be an Australian mobile number')
    }

    return phoneNumber.format('E.164')
  } catch (error) {
    throw new Error(
      `Failed to format phone number: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Normalize phone number to E.164 format
 * Converts Australian formats to +61XXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  try {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    const phoneNumber = parsePhoneNumber(cleaned, 'AU')

    if (!phoneNumber?.isValid()) {
      throw new Error('Invalid phone number')
    }

    return phoneNumber.format('E.164')
  } catch (error) {
    throw new Error(
      `Failed to normalize phone number: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validate Australian phone number
 */
export function validateAustralianPhone(phone: string): boolean {
  try {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    const phoneNumber = parsePhoneNumber(cleaned, 'AU')
    return phoneNumber?.isValid() && phoneNumber?.getType() === 'MOBILE'
  } catch {
    return false
  }
}

/**
 * Format phone number for display
 * Converts +61412345678 to 0412 345 678
 */
export function formatPhoneDisplay(phone: string): string {
  try {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber?.formatNational() || phone
  } catch {
    return phone
  }
}

/**
 * Display format for Australian phone (alias for formatPhoneDisplay)
 * +61412345678 → 0412 345 678
 */
export function displayAustralianPhone(phone: string): string {
  return formatPhoneDisplay(phone)
}
