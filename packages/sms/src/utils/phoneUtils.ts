/**
 * Phone number utilities
 * Following international standards and best practices
 */

/**
 * Phone number format result
 */
export interface PhoneNumberFormat {
  e164: string;
  national: string;
  international: string;
  country: string;
  countryCode: string;
  valid: boolean;
}

/**
 * Format phone number to E.164 standard
 */
export function formatToE164(phone: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no + at start, add default country code
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate E.164 format
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Extract country code from E.164 number
 */
export function extractCountryCode(phone: string): string {
  if (!phone.startsWith('+')) {
    return '';
  }

  // Common country code lengths: 1-3 digits
  const countryCodeMap: Record<string, number> = {
    '1': 1,     // US/Canada
    '7': 1,     // Russia/Kazakhstan
    '20': 2,    // Egypt
    '27': 2,    // South Africa
    '30': 2,    // Greece
    '31': 2,    // Netherlands
    '32': 2,    // Belgium
    '33': 2,    // France
    '34': 2,    // Spain
    '36': 2,    // Hungary
    '39': 2,    // Italy
    '40': 2,    // Romania
    '41': 2,    // Switzerland
    '43': 2,    // Austria
    '44': 2,    // UK
    '45': 2,    // Denmark
    '46': 2,    // Sweden
    '47': 2,    // Norway
    '48': 2,    // Poland
    '49': 2,    // Germany
    '51': 2,    // Peru
    '52': 2,    // Mexico
    '53': 2,    // Cuba
    '54': 2,    // Argentina
    '55': 2,    // Brazil
    '56': 2,    // Chile
    '57': 2,    // Colombia
    '58': 2,    // Venezuela
    '60': 2,    // Malaysia
    '61': 2,    // Australia
    '62': 2,    // Indonesia
    '63': 2,    // Philippines
    '64': 2,    // New Zealand
    '65': 2,    // Singapore
    '66': 2,    // Thailand
    '81': 2,    // Japan
    '82': 2,    // South Korea
    '84': 2,    // Vietnam
    '86': 2,    // China
    '90': 2,    // Turkey
    '91': 2,    // India
    '92': 2,    // Pakistan
    '93': 2,    // Afghanistan
    '94': 2,    // Sri Lanka
    '95': 2,    // Myanmar
    '98': 2,    // Iran
    '212': 3,   // Morocco
    '213': 3,   // Algeria
    '216': 3,   // Tunisia
    '218': 3,   // Libya
    '220': 3,   // Gambia
    '221': 3,   // Senegal
    '222': 3,   // Mauritania
    '223': 3,   // Mali
    '224': 3,   // Guinea
    '225': 3,   // Ivory Coast
    '226': 3,   // Burkina Faso
    '227': 3,   // Niger
    '228': 3,   // Togo
    '229': 3,   // Benin
    '230': 3,   // Mauritius
    '231': 3,   // Liberia
    '232': 3,   // Sierra Leone
    '233': 3,   // Ghana
    '234': 3,   // Nigeria
    '235': 3,   // Chad
    '236': 3,   // Central African Republic
    '237': 3,   // Cameroon
    '238': 3,   // Cape Verde
    '239': 3,   // São Tomé and Príncipe
    '240': 3,   // Equatorial Guinea
    '241': 3,   // Gabon
    '242': 3,   // Republic of the Congo
    '243': 3,   // Democratic Republic of the Congo
    '244': 3,   // Angola
    '245': 3,   // Guinea-Bissau
    '246': 3,   // British Indian Ocean Territory
    '248': 3,   // Seychelles
    '249': 3,   // Sudan
    '250': 3,   // Rwanda
    '251': 3,   // Ethiopia
    '252': 3,   // Somalia
    '253': 3,   // Djibouti
    '254': 3,   // Kenya
    '255': 3,   // Tanzania
    '256': 3,   // Uganda
    '257': 3,   // Burundi
    '258': 3,   // Mozambique
    '260': 3,   // Zambia
    '261': 3,   // Madagascar
    '262': 3,   // Réunion
    '263': 3,   // Zimbabwe
    '264': 3,   // Namibia
    '265': 3,   // Malawi
    '266': 3,   // Lesotho
    '267': 3,   // Botswana
    '268': 3,   // Eswatini
    '269': 3,   // Comoros
  };

  // Try to match country code
  for (let len = 3; len >= 1; len--) {
    const code = phone.substring(1, 1 + len);
    if (countryCodeMap[code] === len) {
      return '+' + code;
    }
  }

  // If no match, return first 1-3 digits
  return phone.substring(0, Math.min(4, phone.length));
}

/**
 * Get country name from country code
 */
export function getCountryFromCode(countryCode: string): string {
  const countryMap: Record<string, string> = {
    '+1': 'United States/Canada',
    '+44': 'United Kingdom',
    '+61': 'Australia',
    '+64': 'New Zealand',
    '+81': 'Japan',
    '+82': 'South Korea',
    '+86': 'China',
    '+91': 'India',
    '+33': 'France',
    '+49': 'Germany',
    '+39': 'Italy',
    '+34': 'Spain',
    '+7': 'Russia',
    '+55': 'Brazil',
    '+52': 'Mexico',
    '+27': 'South Africa',
    '+62': 'Indonesia',
    '+63': 'Philippines',
    '+66': 'Thailand',
    '+65': 'Singapore',
    '+60': 'Malaysia',
    '+234': 'Nigeria',
    '+254': 'Kenya',
    '+20': 'Egypt',
  };

  return countryMap[countryCode] || 'Unknown';
}

/**
 * Normalize phone number for comparison
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Check if two phone numbers are the same
 */
export function arePhonesEqual(phone1: string, phone2: string): boolean {
  return normalizePhoneNumber(phone1) === normalizePhoneNumber(phone2);
}

/**
 * Mask phone number for privacy (show last 4 digits)
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) {
    return '****';
  }
  
  const lastFour = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + lastFour;
}

/**
 * Format phone number for display
 */
export function formatForDisplay(phone: string, format: 'international' | 'national' = 'international'): string {
  if (!isValidE164(phone)) {
    return phone; // Return as-is if not valid E.164
  }

  const countryCode = extractCountryCode(phone);
  const number = phone.substring(countryCode.length);

  if (format === 'international') {
    return `${countryCode} ${number}`;
  }

  // National format (simplified - would need country-specific formatting)
  return number;
}

/**
 * Validate phone number against country-specific rules
 */
export function validateCountryPhoneNumber(phone: string, countryCode: string): {
  valid: boolean;
  error?: string;
} {
  if (!isValidE164(phone)) {
    return { valid: false, error: 'Invalid E.164 format' };
  }

  const phoneCountryCode = extractCountryCode(phone);
  
  if (phoneCountryCode !== countryCode) {
    return { 
      valid: false, 
      error: `Phone number country code (${phoneCountryCode}) does not match expected country code (${countryCode})` 
    };
  }

  // Additional country-specific validation would go here
  // For now, just check E.164 format
  return { valid: true };
}

/**
 * Get carrier type (mobile, landline, voip)
 * Note: This requires external API/service in production
 */
export function getCarrierType(_phone: string): 'mobile' | 'landline' | 'voip' | 'unknown' {
  // This is a placeholder
  // In production, use a service like Twilio Lookup API or similar
  return 'unknown';
}

/**
 * Check if phone number is mobile
 */
export function isMobileNumber(phone: string): boolean {
  const carrierType = getCarrierType(phone);
  return carrierType === 'mobile';
}

/**
 * Batch format phone numbers
 */
export function batchFormatPhoneNumbers(
  phones: string[], 
  defaultCountryCode: string = '+1'
): { formatted: string[]; errors: { index: number; phone: string; error: string }[] } {
  const formatted: string[] = [];
  const errors: { index: number; phone: string; error: string }[] = [];

  for (let i = 0; i < phones.length; i++) {
    try {
      const e164 = formatToE164(phones[i], defaultCountryCode);
      if (isValidE164(e164)) {
        formatted.push(e164);
      } else {
        errors.push({ index: i, phone: phones[i], error: 'Invalid phone number format' });
        formatted.push(phones[i]); // Keep original if invalid
      }
    } catch (error) {
      errors.push({ 
        index: i, 
        phone: phones[i], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      formatted.push(phones[i]);
    }
  }

  return { formatted, errors };
}
