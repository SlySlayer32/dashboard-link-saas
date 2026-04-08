// MobileMessage.com.au SMS API Client
// Currently mocked for demo - ready for real integration

interface SendSMSParams {
  to: string
  message: string
  from?: string
}

interface SendSMSResult {
  success: boolean
  messageId: string
  status: 'queued' | 'sent' | 'failed'
  error?: string
}

interface DeliveryStatus {
  messageId: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  deliveredAt?: string
  error?: string
}

// Mock API client - replace with real implementation when ready
class MobileMessageClient {
  private apiUsername: string
  private apiPassword: string
  private baseUrl = 'https://api.mobilemessage.com.au/v1'
  private isMocked = true

  constructor() {
    this.apiUsername = process.env.MOBILE_MESSAGE_API_USERNAME || ''
    this.apiPassword = process.env.MOBILE_MESSAGE_API_PASSWORD || ''
    
    // Check if real credentials are configured
    if (this.apiUsername && this.apiPassword) {
      this.isMocked = false
    }
  }

  private generateMockMessageId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async sendSMS(params: SendSMSParams): Promise<SendSMSResult> {
    // Validate phone number format
    if (!params.to.match(/^\+?[0-9]{10,15}$/)) {
      return {
        success: false,
        messageId: '',
        status: 'failed',
        error: 'Invalid phone number format',
      }
    }

    // Validate message length (SMS limit is typically 160 chars for single SMS)
    if (params.message.length > 1600) {
      return {
        success: false,
        messageId: '',
        status: 'failed',
        error: 'Message too long (max 1600 characters)',
      }
    }

    if (this.isMocked) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Mock successful response
      return {
        success: true,
        messageId: this.generateMockMessageId(),
        status: 'sent',
      }
    }

    // Real API implementation
    try {
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64')}`,
        },
        body: JSON.stringify({
          to: params.to,
          message: params.message,
          from: params.from || process.env.MOBILE_MESSAGE_SENDER_ID,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          messageId: '',
          status: 'failed',
          error: data.error || 'Failed to send SMS',
        }
      }

      return {
        success: true,
        messageId: data.messageId,
        status: 'queued',
      }
    } catch (error) {
      return {
        success: false,
        messageId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    if (this.isMocked) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Mock delivered response
      return {
        messageId,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/sms/status/${messageId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiUsername}:${this.apiPassword}`).toString('base64')}`,
        },
      })

      const data = await response.json()
      
      return {
        messageId,
        status: data.status,
        deliveredAt: data.deliveredAt,
        error: data.error,
      }
    } catch (error) {
      return {
        messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async sendBulkSMS(recipients: string[], message: string): Promise<SendSMSResult[]> {
    const results: SendSMSResult[] = []
    
    for (const to of recipients) {
      const result = await this.sendSMS({ to, message })
      results.push(result)
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  isMockedMode(): boolean {
    return this.isMocked
  }
}

// Export singleton instance
export const smsClient = new MobileMessageClient()

// Export types for use in components
export type { SendSMSParams, SendSMSResult, DeliveryStatus }
