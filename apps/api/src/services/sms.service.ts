import { SMSStatus } from '@dashboard-link/shared/contracts'

// Temporarily copied phone utils to get API running
// TODO: Fix module resolution and revert to @dashboard-link/shared import

/**
 * Format Australian phone number to E.164 format
 * Converts: 0412345678 → +61412345678
 * Accepts: 0412345678, +61412345678, 61412345678
 */
function formatAustralianPhone(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '')

  // If already in E.164 format with +61
  if (cleaned.startsWith('+61')) {
    return cleaned
  }

  // If starts with 61 (without +)
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return `+${cleaned}`
  }

  // If starts with 0 (Australian format)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+61${cleaned.substring(1)}`
  }

  // If it's just the number without country code or leading 0
  if (cleaned.length === 9) {
    return `+61${cleaned}`
  }

  throw new Error(`Invalid Australian phone number: ${phone}`)
}

/**
 * Validate Australian phone number
 */
function validateAustralianPhone(phone: string): boolean {
  try {
    const formatted = formatAustralianPhone(phone)
    // Check if it's a valid Australian mobile number (+614-9xx xxx xxx)
    return /^\+61[4-9]\d{8}$/.test(formatted)
  } catch {
    return false
  }
}

/**
 * SMS Service - Simplified for Foundation Setup
 *
 * This service handles SMS functionality for the application
 * TODO: Implement full SMS provider abstraction in plan/3
 */

export interface SendSMSOptions {
  phone: string // Will be formatted to E.164
  message: string
  senderId?: string
  organizationId?: string
  workerId?: string
  providerId?: string // Optional: specify which provider to use
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  provider?: string
  error?: string
  cost?: number
}

export class SMSService {
  /**
   * Send an SMS using the configured provider(s)
   *
   * TODO: Implement full SMS sending with provider abstraction
   * For now, this is a placeholder that logs the attempt
   */
  static async sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
    try {
      // Format phone number
      const formattedPhone = formatAustralianPhone(options.phone)

      // Validate phone number
      if (!validateAustralianPhone(options.phone)) {
        return {
          success: false,
          error: `Invalid phone number: ${options.phone}`,
        }
      }

      // TODO: Implement actual SMS sending
      console.log('SMS Service: Would send SMS', {
        to: formattedPhone,
        message: options.message,
        provider: 'mobile-message', // Default provider
      })

      // Log SMS to database if organization ID is provided
      if (options.organizationId) {
        await this.logSMS({
          organizationId: options.organizationId,
          workerId: options.workerId,
          phone: formattedPhone,
          message: options.message,
          status: 'sent',
          providerResponse: { messageId: `placeholder-${Date.now()}` },
          provider: 'mobile-message',
        })
      }

      return {
        success: true,
        messageId: `placeholder-${Date.now()}`,
        provider: 'mobile-message',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send dashboard link via SMS
   */
  static async sendDashboardLink(
    phone: string,
    dashboardUrl: string,
    workerName: string,
    organizationId?: string,
    workerId?: string
  ): Promise<SMSResponse> {
    const message = `Hi ${workerName}! Your daily dashboard is ready: ${dashboardUrl}`

    return this.sendSMS({
      phone,
      message,
      organizationId,
      workerId,
    })
  }

  /**
   * Get SMS delivery status
   * TODO: Implement status checking
   */
  static async getStatus(_messageId: string): Promise<SMSStatus> {
    // Placeholder implementation
    return 'sent'
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string): boolean {
    return validateAustralianPhone(phone)
  }

  /**
   * Format phone number to E.164
   */
  static formatPhone(phone: string): string {
    return formatAustralianPhone(phone)
  }

  // Private helper methods
  private static async logSMS(data: {
    organizationId?: string
    workerId?: string
    phone: string
    message: string
    status: string
    providerResponse: unknown
    provider?: string
  }): Promise<void> {
    if (!data.organizationId) return

    try {
      // Import here to avoid circular dependency
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || ''
      )

      await supabase.from('sms_logs').insert({
        organization_id: data.organizationId,
        worker_id: data.workerId,
        phone: data.phone,
        message: data.message,
        status: data.status,
        provider_response: data.providerResponse,
        provider: data.provider || 'unknown',
      })
    } catch {
      // Silently fail logging to avoid breaking SMS flow
    }
  }
}

// Export singleton instance
export const smsService = SMSService
