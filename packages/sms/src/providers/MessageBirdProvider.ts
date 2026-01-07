import {
  SMSConfigValidationResult,
  SMSHealthResult,
  SMSMessage,
  SMSProviderConfig,
  SMSResult,
  SMSStatus,
} from '@dashboard-link/shared'
import { BaseSMSProvider } from '../base/BaseSMSProvider'

type MessageBirdMessagePayload = {
  recipients: string[]
  originator: string
  body: string
  type: 'sms'
  datacoding: 'auto'
  scheduledDatetime?: string
}

type MessageBirdRecipient = {
  status?: string
  statusDatetime?: string
  statusReason?: string
}

type MessageBirdRecipients = {
  items?: MessageBirdRecipient[]
}

type MessageBirdErrorResponse = {
  errors?: Array<{ description?: string }>
}

type MessageBirdMessageResponse = {
  id?: string
  pricing?: { amount?: string | number }
  recipients?: MessageBirdRecipients
  status?: string
  statusDatetime?: string
  statusReason?: string
  mccmnc?: string
}

/**
 * MessageBird SMS Provider Adapter
 * European SMS provider with global reach
 */
export class MessageBirdProvider extends BaseSMSProvider {
  readonly id = 'messagebird'
  readonly name = 'MessageBird'
  readonly version = '1.0.0'
  readonly description = 'MessageBird SMS and Voice provider with global coverage'

  private accessKey: string
  private defaultOriginator?: string

  constructor(config: { accessKey: string; defaultOriginator?: string }) {
    super()
    this.accessKey = config.accessKey
    this.defaultOriginator = config.defaultOriginator
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      // Validate message
      const validationErrors = this.validateMessage(message)
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors.join(', '), 'permanent', undefined)
      }

      // Build MessageBird request
      const payload: MessageBirdMessagePayload = {
        recipients: [message.to],
        originator: message.from || this.defaultOriginator || 'MessageBird',
        body: message.body,
        type: 'sms',
        datacoding: 'auto',
      }

      // Add scheduling if provided
      if (message.scheduledFor) {
        payload.scheduledDatetime = new Date(message.scheduledFor).toISOString()
      }

      // Make API request
      const response = await this.makeAPIRequest('POST', 'messages', payload)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}) as MessageBirdErrorResponse)
        return this.createErrorResult(
          `MessageBird error: ${response.status} ${response.statusText} - ${errorData.errors?.[0]?.description || 'Unknown error'}`,
          'temporary',
          errorData
        )
      }

      const result = (await response.json()) as MessageBirdMessageResponse

      return this.createSuccessResult(result.id, result, this.calculateCost(result))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return this.createErrorResult(errorMessage, 'temporary')
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await this.makeAPIRequest('GET', `messages/${messageId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`)
      }

      const data = (await response.json()) as MessageBirdMessageResponse

      // Map MessageBird status
      let status: SMSStatus['status'] = 'unknown'
      const recipients = this.getRecipientItems(data.recipients)
      if (recipients[0]) {
        status = this.mapMessageBirdStatus(recipients[0].status)
      }

      return this.createStatus(
        messageId,
        status,
        recipients[0]?.statusDatetime,
        recipients[0]?.statusReason,
        this.calculateCost(data),
        data
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return this.createStatus(messageId, 'unknown', undefined, errorMessage)
    }
  }

  async validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    const settings = config.settings
    const accessKey = typeof settings.accessKey === 'string' ? settings.accessKey : undefined
    const defaultOriginator =
      typeof settings.defaultOriginator === 'string' ? settings.defaultOriginator : undefined

    if (!accessKey) {
      errors.push('MessageBird Access Key is required')
    } else if (accessKey.length < 20) {
      errors.push('Invalid MessageBird Access Key format')
    }

    if (defaultOriginator) {
      if (defaultOriginator.length > 11) {
        warnings.push('Originator should not exceed 11 characters')
      }
    }

    // Test API connection
    if (accessKey) {
      try {
        const health = await this.getHealthCheck()
        if (!health.healthy) {
          errors.push('MessageBird connection failed: ' + health.error)
        }
      } catch {
        errors.push('MessageBird connection test failed')
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings)
  }

  async getHealthCheck(): Promise<SMSHealthResult> {
    const startTime = Date.now()

    try {
      // Check balance endpoint
      const response = await this.makeAPIRequest('GET', 'balance')

      const responseTime = Date.now() - startTime

      if (response.ok) {
        const balance = (await response.json()) as { amount?: number; type?: string }
        return this.createHealthResult(true, responseTime, undefined, {
          balance: balance.amount,
          currency: balance.type,
        })
      } else {
        return this.createHealthResult(
          false,
          responseTime,
          `Health check failed: ${response.status}`
        )
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return this.createHealthResult(false, responseTime, errorMessage)
    }
  }

  supportsDeliveryReports(): boolean {
    return true
  }

  supportsScheduledMessages(): boolean {
    return true
  }

  /**
   * Send Voice message (MessageBird-specific feature)
   */
  async sendVoiceMessage(message: SMSMessage): Promise<SMSResult> {
    try {
      const payload = {
        recipients: [message.to],
        body: message.body,
        language: 'en-us',
        voice: 'male',
      }

      const response = await this.makeAPIRequest('POST', 'voicemessages', payload)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return this.createErrorResult(
          `MessageBird Voice error: ${response.status}`,
          'temporary',
          errorData
        )
      }

      const result = await response.json()

      return this.createSuccessResult(result.id, result, this.calculateCost(result))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return this.createErrorResult(errorMessage, 'temporary')
    }
  }

  /**
   * Map MessageBird status to standard format
   */
  private mapMessageBirdStatus(mbStatus: string): SMSStatus['status'] {
    switch (mbStatus?.toLowerCase()) {
      case 'delivered':
        return 'delivered'
      case 'sent':
        return 'sent'
      case 'failed':
      case 'delivery_failed':
      case 'expired':
        return 'failed'
      case 'buffered':
      case 'scheduled':
        return 'pending'
      default:
        return 'unknown'
    }
  }

  /**
   * Calculate cost from MessageBird response
   */
  private calculateCost(data: MessageBirdMessageResponse): number {
    // MessageBird includes pricing in the response
    if (data.mccmnc && data.pricing) {
      const amount = data.pricing.amount
      if (typeof amount === 'string') {
        return parseFloat(amount) || 0
      }

      if (typeof amount === 'number') {
        return amount
      }
    }
    return 0.01 // Default estimate
  }

  private getRecipientItems(recipients?: MessageBirdRecipients): MessageBirdRecipient[] {
    return recipients?.items ?? []
  }

  /**
   * Make API request to MessageBird
   */
  private async makeAPIRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    payload?: Record<string, unknown>
  ): Promise<Response> {
    const url = `https://rest.messagebird.com/${endpoint}`

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `AccessKey ${this.accessKey}`,
        'Content-Type': 'application/json',
      },
    }

    if (method === 'POST' && payload) {
      options.body = JSON.stringify(payload)
    }

    return fetch(url, options)
  }
}
