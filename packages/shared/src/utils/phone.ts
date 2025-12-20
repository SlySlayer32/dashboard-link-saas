/**
 * Format Australian phone number to E.164 format
 * Converts: 0412345678 → +61412345678
 * Accepts: 0412345678, +61412345678, 61412345678
 */
export function formatAustralianPhone(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already in E.164 format with +61
  if (cleaned.startsWith('+61')) {
    return cleaned;
  }
  
  // If starts with 61 (without +)
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  // If starts with 0 (Australian format)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+61${cleaned.substring(1)}`;
  }
  
  // If it's just the number without country code or leading 0
  if (cleaned.length === 9) {
    return `+61${cleaned}`;
  }
  
  throw new Error(`Invalid Australian phone number: ${phone}`);
}

/**
 * Validate Australian phone number
 */
export function validateAustralianPhone(phone: string): boolean {
  try {
    const formatted = formatAustralianPhone(phone);
    // Check if it's a valid Australian mobile number (+614-9xx xxx xxx)
    return /^\+61[4-9]\d{8}$/.test(formatted);
  } catch {
    return false;
  }
}

/**
 * Display format for Australian phone
 * +61412345678 → 0412 345 678
 */
export function displayAustralianPhone(phone: string): string {
  try {
    const formatted = formatAustralianPhone(phone);
    const number = formatted.replace('+61', '0');
    return number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  } catch {
    return phone;
  }
}
