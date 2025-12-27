import { formatAustralianPhone, validateAustralianPhone } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

export interface SendSMSOptions {
  phone: string // Will be formatted to E.164
  message: string
  senderId?: string
  organizationId?: string
  workerId?: string
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * MobileMessage.com.au SMS Service
 * Australian SMS provider integration
 * API Docs: https://api.mobilemessage.com.au/
 */
export class SMSService {
  private static readonly API_URL = 'https://api.mobilemessage.com.au/v1/messages'
  private static readonly username = process.env.MOBILEMESSAGE_USERNAME
  private static readonly password = process.env.MOBILEMESSAGE_PASSWORD
  private static readonly defaultSenderId = process.env.MOBILEMESSAGE_SENDER_ID || 'DashLink'

  /**
   * Send an SMS via MobileMessage.com.au
   */
  static async sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
    if (!this.username || !this.password) {
      throw new Error('MobileMessage credentials not configured')
    }

    if (!options.phone || !options.message) {
      throw new Error('Phone number and message are required')
    }

    try {
      // Format phone to E.164
      const formattedPhone = formatAustralianPhone(options.phone)

      // Validate the formatted phone number
      if (!validateAustralianPhone(options.phone)) {
        throw new Error(`Invalid Australian phone number: ${options.phone}`)
      }

      // Prepare API request
      const payload = {
        to: formattedPhone,
        message: options.message,
        from: options.senderId || this.defaultSenderId,
      }

      // Basic Authentication
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64')

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `MobileMessage API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`
        )
      }

      const result = await response.json()

      // Log SMS to database
      await this.logSMS({
        organizationId: options.organizationId,
        workerId: options.workerId,
        phone: formattedPhone,
        message: options.message,
        status: 'sent',
        providerResponse: result,
      })

      return {
        success: true,
        messageId: result.message_id,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed attempt
      if (options.organizationId) {
        await this.logSMS({
          organizationId: options.organizationId,
          workerId: options.workerId,
          phone: options.phone,
          message: options.message,
          status: 'failed',
          providerResponse: { error: errorMessage },
        })
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Log SMS to database
   */
  private static async logSMS(data: {
    organizationId?: string
    workerId?: string
    phone: string
    message: string
    status: string
    providerResponse: unknown
  }): Promise<void> {
    if (!data.organizationId) return

    try {
      await supabase.from('sms_logs').insert({
        organization_id: data.organizationId,
        worker_id: data.workerId,
        phone: data.phone,
        message: data.message,
        status: data.status,
        provider_response: data.providerResponse,
      })
    } catch {
      // Silently fail logging to avoid breaking SMS flow
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
}
