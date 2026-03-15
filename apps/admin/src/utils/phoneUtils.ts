/**
 * Phone number utilities for Australian numbers
 */

import {
  formatAustralianPhone as formatPhone,
  formatPhoneDisplay,
  validateAustralianPhone as validatePhone,
} from '@dashboard-link/shared'

/**
 * Validate Australian phone number
 */
export function validateAustralianPhone(phone: string): boolean {
  if (!phone) return false
  return validatePhone(phone)
}

/**
 * Format phone number to Australian standard format
 * @param phone - Input phone number
 * @returns Formatted phone number in E.164 format
 */
export function formatAustralianPhone(phone: string): string {
  if (!phone) return ''
  try {
    return formatPhone(phone)
  } catch {
    return phone
  }
}

/**
 * Format phone number for display (domestic format)
 * @param phone - Phone number in international format
 * @returns Formatted phone number in 04xx xxx xxx format
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''
  return formatPhoneDisplay(phone)
}

/**
 * Transform phone input as user types
 * @param input - Raw input from user
 * @returns Formatted input
 */
export function transformPhoneInput(input: string): string {
  if (!input) return ''

  // Remove all non-digit characters except + at start
  let cleanInput = input.replace(/[^\d+]/g, '')

  // Handle +61 prefix
  if (cleanInput.startsWith('+61')) {
    // Keep only +61 followed by digits
    cleanInput = '+61' + cleanInput.substring(3).replace(/\D/g, '')

    // Format as user types
    if (cleanInput.length > 3) {
      cleanInput = cleanInput.replace(
        /(\+61)(4\d{0,2})(\d{0,3})(\d{0,3})/,
        (_match, p1, p2, p3, p4) => {
          let result = p1
          if (p2) result += ' ' + p2
          if (p3) result += ' ' + p3
          if (p4) result += ' ' + p4
          return result
        }
      )
    }
  } else if (cleanInput.startsWith('04')) {
    // Domestic format
    cleanInput = cleanInput.replace(/\D/g, '')

    // Format as user types
    cleanInput = cleanInput.replace(/(04\d{0,2})(\d{0,3})(\d{0,3})/, (_match, p1, p2, p3) => {
      let result = p1
      if (p2) result += ' ' + p2
      if (p3) result += ' ' + p3
      return result
    })
  } else if (cleanInput.startsWith('4') && !cleanInput.startsWith('04')) {
    // Auto-add 0 if user types 4xx...
    cleanInput = '0' + cleanInput
    cleanInput = cleanInput.replace(/(04\d{0,2})(\d{0,3})(\d{0,3})/, (_match, p1, p2, p3) => {
      let result = p1
      if (p2) result += ' ' + p2
      if (p3) result += ' ' + p3
      return result
    })
  }

  return cleanInput
}

/**
 * Get phone validation error message
 */
export function getPhoneErrorMessage(phone: string): string {
  if (!phone) return 'Phone number is required'

  const cleanPhone = phone.replace(/[\s-]/g, '')

  if (!/^\+?\d+$/.test(cleanPhone)) {
    return 'Phone number can only contain numbers and +'
  }

  if (!validateAustralianPhone(phone)) {
    return 'Please enter a valid Australian mobile number (04xx xxx xxx or +61 4xx xxx xxx)'
  }

  return ''
}
