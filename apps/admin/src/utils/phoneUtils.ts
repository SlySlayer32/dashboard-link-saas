/**
 * Phone number utilities for Australian numbers
 */

// Australian phone number regex patterns
const AU_PHONE_REGEX = {
  // International format: +61 4xx xxx xxx
  international: /^\+61\s?4\d{2}\s?\d{3}\s?\d{3}$/,
  // Domestic format: 04xx xxx xxx
  domestic: /^04\d{2}\s?\d{3}\s?\d{3}$/,
  // Basic pattern (without spaces): 04xxxxxxxx or +614xxxxxxxx
  basic: /^(\+?61|0)4\d{8}$/
};

/**
 * Validate Australian phone number
 */
export function validateAustralianPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all spaces and dashes for validation
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  return AU_PHONE_REGEX.basic.test(cleanPhone);
}

/**
 * Format phone number to Australian standard format
 * @param phone - Input phone number
 * @returns Formatted phone number in +61 4xx xxx xxx format
 */
export function formatAustralianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleanPhone.startsWith('614')) {
    // Already has country code, format it
    const formatted = cleanPhone.replace(/(\+?61)(4\d{2})(\d{3})(\d{3})/, '+61 $2 $3 $4');
    return formatted;
  } else if (cleanPhone.startsWith('04')) {
    // Domestic format, add country code
    const formatted = cleanPhone.replace(/(04\d{2})(\d{3})(\d{3})/, '+61 $1 $2 $3');
    return formatted;
  }
  
  // Return original if can't format
  return phone;
}

/**
 * Format phone number for display (domestic format)
 * @param phone - Phone number in international format
 * @returns Formatted phone number in 04xx xxx xxx format
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('614')) {
    // Convert to domestic format
    const formatted = cleanPhone.replace(/(\+?61)(4\d{2})(\d{3})(\d{3})/, '0$2 $3 $4');
    return formatted;
  } else if (cleanPhone.startsWith('04')) {
    // Already domestic, just format
    const formatted = cleanPhone.replace(/(04\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
    return formatted;
  }
  
  return phone;
}

/**
 * Transform phone input as user types
 * @param input - Raw input from user
 * @returns Formatted input
 */
export function transformPhoneInput(input: string): string {
  if (!input) return '';
  
  // Remove all non-digit characters except + at start
  let cleanInput = input.replace(/[^\d+]/g, '');
  
  // Handle +61 prefix
  if (cleanInput.startsWith('+61')) {
    // Keep only +61 followed by digits
    cleanInput = '+61' + cleanInput.substring(3).replace(/\D/g, '');
    
    // Format as user types
    if (cleanInput.length > 3) {
      cleanInput = cleanInput.replace(/(\+61)(4\d{0,2})(\d{0,3})(\d{0,3})/, (match, p1, p2, p3, p4) => {
        let result = p1;
        if (p2) result += ' ' + p2;
        if (p3) result += ' ' + p3;
        if (p4) result += ' ' + p4;
        return result;
      });
    }
  } else if (cleanInput.startsWith('04')) {
    // Domestic format
    cleanInput = cleanInput.replace(/\D/g, '');
    
    // Format as user types
    cleanInput = cleanInput.replace(/(04\d{0,2})(\d{0,3})(\d{0,3})/, (match, p1, p2, p3) => {
      let result = p1;
      if (p2) result += ' ' + p2;
      if (p3) result += ' ' + p3;
      return result;
    });
  } else if (cleanInput.startsWith('4') && !cleanInput.startsWith('04')) {
    // Auto-add 0 if user types 4xx...
    cleanInput = '0' + cleanInput;
    cleanInput = cleanInput.replace(/(04\d{0,2})(\d{0,3})(\d{0,3})/, (match, p1, p2, p3) => {
      let result = p1;
      if (p2) result += ' ' + p2;
      if (p3) result += ' ' + p3;
      return result;
    });
  }
  
  return cleanInput;
}

/**
 * Get phone validation error message
 */
export function getPhoneErrorMessage(phone: string): string {
  if (!phone) return 'Phone number is required';
  
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  if (!/^\+?\d+$/.test(cleanPhone)) {
    return 'Phone number can only contain numbers and +';
  }
  
  if (!validateAustralianPhone(phone)) {
    return 'Please enter a valid Australian mobile number (04xx xxx xxx or +61 4xx xxx xxx)';
  }
  
  return '';
}
