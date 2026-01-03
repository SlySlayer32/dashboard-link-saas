/**
 * Message utilities
 * Helper functions for SMS message processing and formatting
 */

/**
 * Message encoding type
 */
export type MessageEncoding = 'GSM-7' | 'UCS-2';

/**
 * Message segment info
 */
export interface MessageSegmentInfo {
  segmentCount: number;
  encoding: MessageEncoding;
  charactersPerSegment: number;
  totalCharacters: number;
  remainingCharacters: number;
}

/**
 * Truncate options
 */
export interface TruncateOptions {
  maxLength: number;
  ellipsis?: string;
  preserveWords?: boolean;
}

/**
 * Get message encoding type
 */
export function getMessageEncoding(message: string): MessageEncoding {
  // GSM-7 character set
  const gsmChars = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€";
  
  // Check if all characters are in GSM-7 set
  for (const char of message) {
    if (!gsmChars.includes(char)) {
      return 'UCS-2';
    }
  }
  
  return 'GSM-7';
}

/**
 * Calculate message segments
 */
export function calculateSegments(message: string): MessageSegmentInfo {
  const encoding = getMessageEncoding(message);
  const totalCharacters = message.length;
  
  let charactersPerSegment: number;
  let segmentCount: number;
  
  if (encoding === 'GSM-7') {
    // GSM-7: 160 chars for single, 153 for concatenated
    if (totalCharacters <= 160) {
      charactersPerSegment = 160;
      segmentCount = 1;
    } else {
      charactersPerSegment = 153;
      segmentCount = Math.ceil(totalCharacters / 153);
    }
  } else {
    // UCS-2: 70 chars for single, 67 for concatenated
    if (totalCharacters <= 70) {
      charactersPerSegment = 70;
      segmentCount = 1;
    } else {
      charactersPerSegment = 67;
      segmentCount = Math.ceil(totalCharacters / 67);
    }
  }
  
  const remainingCharacters = (charactersPerSegment * segmentCount) - totalCharacters;
  
  return {
    segmentCount,
    encoding,
    charactersPerSegment,
    totalCharacters,
    remainingCharacters
  };
}

/**
 * Truncate message to fit within segments
 */
export function truncateMessage(
  message: string,
  options: TruncateOptions = { maxLength: 160 }
): string {
  const { maxLength, ellipsis = '...', preserveWords = true } = options;
  
  if (message.length <= maxLength) {
    return message;
  }
  
  const truncateAt = maxLength - ellipsis.length;
  
  if (!preserveWords) {
    return message.substring(0, truncateAt) + ellipsis;
  }
  
  // Find last space before truncate point
  const truncated = message.substring(0, truncateAt);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + ellipsis;
  }
  
  return truncated + ellipsis;
}

/**
 * Split message into segments
 */
export function splitIntoSegments(message: string): string[] {
  const { segmentCount, charactersPerSegment } = calculateSegments(message);
  
  if (segmentCount === 1) {
    return [message];
  }
  
  const segments: string[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const start = i * charactersPerSegment;
    const end = start + charactersPerSegment;
    segments.push(message.substring(start, end));
  }
  
  return segments;
}

/**
 * Remove special characters that may cause encoding issues
 */
export function sanitizeSpecialChars(message: string): string {
  // Replace common problematic characters
  let sanitized = message
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes to hyphens
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/\u00A0/g, ' ')          // Non-breaking space to regular space
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  
  return sanitized;
}

/**
 * Convert message to GSM-7 compatible (if possible)
 */
export function convertToGSM7(message: string): string {
  // Try to convert Unicode characters to GSM-7 equivalents
  let converted = message
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/à|á|â|ã|å/g, 'a')
    .replace(/À|Á|Â|Ã|Å/g, 'A')
    .replace(/è|ê|ë/g, 'e')
    .replace(/È|Ê|Ë/g, 'E')
    .replace(/ì|í|î|ï/g, 'i')
    .replace(/Ì|Í|Î|Ï/g, 'I')
    .replace(/ò|ó|ô|õ/g, 'o')
    .replace(/Ò|Ó|Ô|Õ/g, 'O')
    .replace(/ù|ú|û/g, 'u')
    .replace(/Ù|Ú|Û/g, 'U')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C');
  
  return converted;
}

/**
 * Add personalization to message
 */
export function personalizeMessage(
  template: string,
  variables: Record<string, string>
): string {
  let personalized = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    personalized = personalized.replace(placeholder, value);
  }
  
  return personalized;
}

/**
 * Extract variables from message template
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }
  
  return [...new Set(variables)]; // Remove duplicates
}

/**
 * Validate message template
 */
export function validateTemplate(template: string, requiredVariables: string[]): {
  valid: boolean;
  missingVariables: string[];
  unusedVariables: string[];
} {
  const templateVariables = extractVariables(template);
  const missingVariables = requiredVariables.filter(v => !templateVariables.includes(v));
  const unusedVariables = templateVariables.filter(v => !requiredVariables.includes(v));
  
  return {
    valid: missingVariables.length === 0,
    missingVariables,
    unusedVariables
  };
}

/**
 * Estimate message cost
 */
export function estimateCost(message: string, costPerSegment: number = 0.01): number {
  const { segmentCount } = calculateSegments(message);
  return segmentCount * costPerSegment;
}

/**
 * Check if message contains URLs
 */
export function containsURL(message: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  return urlRegex.test(message);
}

/**
 * Extract URLs from message
 */
export function extractURLs(message: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const matches = message.match(urlRegex);
  return matches || [];
}

/**
 * Shorten URLs in message
 */
export function shortenURLs(message: string, urlShortener: (url: string) => string): string {
  const urls = extractURLs(message);
  let shortened = message;
  
  for (const url of urls) {
    const shortUrl = urlShortener(url);
    shortened = shortened.replace(url, shortUrl);
  }
  
  return shortened;
}

/**
 * Add unsubscribe link
 */
export function addUnsubscribeLink(message: string, unsubscribeUrl: string): string {
  return `${message}\n\nTo unsubscribe: ${unsubscribeUrl}`;
}

/**
 * Format message with metadata
 */
export function formatWithMetadata(
  message: string,
  metadata: {
    sender?: string;
    timestamp?: Date;
    reference?: string;
  }
): string {
  let formatted = message;
  
  if (metadata.sender) {
    formatted = `From ${metadata.sender}: ${formatted}`;
  }
  
  if (metadata.reference) {
    formatted = `${formatted}\nRef: ${metadata.reference}`;
  }
  
  return formatted;
}

/**
 * Clean message for sending
 */
export function cleanMessage(message: string): string {
  return message
    .trim()
    .replace(/\s+/g, ' ')                    // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n')              // Max 2 consecutive newlines
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars
}

/**
 * Check if message is spam-like
 */
export function isSpamLike(message: string): boolean {
  const spamIndicators = [
    /\b(free|win|prize|claim|act now|limited time)\b/gi,
    /\b(click here|download now|buy now)\b/gi,
    /!!!+/,
    /\$\$\$+/,
    /ALL CAPS MESSAGE/i
  ];
  
  const upperCaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (upperCaseRatio > 0.5 && message.length > 20) {
    return true; // Too many uppercase letters
  }
  
  return spamIndicators.some(pattern => pattern.test(message));
}

/**
 * Generate message preview
 */
export function generatePreview(message: string, maxLength: number = 50): string {
  const preview = truncateMessage(message, { maxLength, preserveWords: true });
  return preview;
}
