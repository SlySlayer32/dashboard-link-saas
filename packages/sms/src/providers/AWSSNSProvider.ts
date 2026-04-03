import {
  SMSConfigValidationResult,
  SMSHealthResult,
  SMSMessage,
  SMSProviderConfig,
  SMSResult,
  SMSStatus,
} from '@dashboard-link/shared'
import { BaseSMSProvider } from '../base/BaseSMSProvider'

type SNSMessageAttribute = {
  DataType: 'String'
  StringValue: string
}

/**
 * AWS SNS SMS Provider Adapter
 * Amazon Simple Notification Service implementation
 */
export class AWSSNSProvider extends BaseSMSProvider {
  readonly id = 'aws-sns'
  readonly name = 'AWS SNS'
  readonly version = '1.0.0'
  readonly description = 'Amazon Simple Notification Service SMS provider'

  // @ts-expect-error - Stored for future AWS SDK implementation
  private _accessKeyId: string
  // @ts-expect-error - Stored for future AWS SDK implementation
  private _secretAccessKey: string
  // @ts-expect-error - Stored for future AWS SDK implementation
  private _region: string
  private defaultSenderId?: string

  constructor(config: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    defaultSenderId?: string
  }) {
    super()
    this._accessKeyId = config.accessKeyId
    this._secretAccessKey = config.secretAccessKey
    this._region = config.region
    this.defaultSenderId = config.defaultSenderId
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      // Validate message
      const validationErrors = this.validateMessage(message)
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors.join(', '), 'permanent', undefined)
      }

      // Build SNS request
      const messageAttributes: Record<string, SNSMessageAttribute> = {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: message.priority === 'high' ? 'Transactional' : 'Promotional',
        },
      }

      if (this.defaultSenderId) {
        messageAttributes['AWS.SNS.SMS.SenderID'] = {
          DataType: 'String',
          StringValue: this.defaultSenderId,
        }
      }

      const payload = {
        Message: message.body,
        PhoneNumber: message.to,
        MessageAttributes: messageAttributes,
      }

      // Make API request (simplified - in production use AWS SDK)
      const response = await this.makeAPIRequest('Publish', payload)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return this.createErrorResult(
          `AWS SNS error: ${response.status} ${response.statusText}`,
          'temporary',
          errorData
        )
      }

      const result = await response.json()

      return this.createSuccessResult(
        result.MessageId || `sns-${Date.now()}`,
        result,
        0.01 // AWS SNS pricing varies by region
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return this.createErrorResult(errorMessage, 'temporary')
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    // AWS SNS doesn't provide direct message status queries
    // Would need to use CloudWatch or SNS delivery status logging
    return this.createStatus(
      messageId,
      'unknown',
      undefined,
      'Status tracking not available for AWS SNS'
    )
  }

  async validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    const settings = config.settings
    const accessKeyId = typeof settings.accessKeyId === 'string' ? settings.accessKeyId : undefined
    const secretAccessKey =
      typeof settings.secretAccessKey === 'string' ? settings.secretAccessKey : undefined
    const region = typeof settings.region === 'string' ? settings.region : undefined

    if (!accessKeyId) {
      errors.push('AWS Access Key ID is required')
    }

    if (!secretAccessKey) {
      errors.push('AWS Secret Access Key is required')
    }

    if (!region) {
      errors.push('AWS Region is required')
    } else {
      // Basic region format validation
      const regionRegex = /^[a-z]{2}-[a-z]+-\d{1}$/
      if (!regionRegex.test(region)) {
        warnings.push('AWS Region format may be invalid (expected format: us-east-1)')
      }
    }

    // Test connection if credentials provided
    if (accessKeyId && secretAccessKey && region) {
      try {
        const health = await this.getHealthCheck()
        if (!health.healthy) {
          errors.push('AWS SNS connection failed: ' + health.error)
        }
      } catch {
        errors.push('AWS SNS connection test failed')
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings)
  }

  async getHealthCheck(): Promise<SMSHealthResult> {
    const startTime = Date.now()

    try {
      // Make a simple API request to check connectivity
      // In production, use AWS SDK's health check or list phone numbers
      const response = await this.makeAPIRequest('GetSMSAttributes', {
        attributes: ['MonthlySpendLimit'],
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return this.createHealthResult(true, responseTime)
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
    return true // Via SNS delivery status logging
  }

  /**
   * Send to multiple numbers (SNS batch publish)
   */
  async sendToMultipleNumbers(message: SMSMessage, numbers: string[]): Promise<SMSResult[]> {
    const results: SMSResult[] = []

    // AWS SNS doesn't have native batch sending
    // Send individually
    for (const number of numbers) {
      const result = await this.send({ ...message, to: number })
      results.push(result)
    }

    return results
  }

  /**
   * Make API request to AWS SNS
   *
   * IMPORTANT: This is a placeholder implementation for demonstration purposes.
   * In production, you MUST use the AWS SDK for JavaScript (@aws-sdk/client-sns)
   * to ensure proper AWS Signature Version 4 authentication.
   *
   * Example production implementation:
   * ```typescript
   * import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
   *
   * const client = new SNSClient({
   *   region: this.region,
   *   credentials: {
   *     accessKeyId: this.accessKeyId,
   *     secretAccessKey: this.secretAccessKey
   *   }
   * });
   *
   * const command = new PublishCommand({ Message, PhoneNumber });
   * return await client.send(command);
   * ```
   */
  private async makeAPIRequest(
    _action: string,
    _params: Record<string, unknown>
  ): Promise<Response> {
    // Phase 2: Replace with @aws-sdk/client-sns for proper AWS Signature V4 auth.
    // Credentials are stored in this.accessKeyId, this.secretAccessKey, this.region.

    throw new Error(
      'AWS SNS provider requires AWS SDK for JavaScript (@aws-sdk/client-sns). ' +
        'This placeholder implementation does not support AWS Signature V4 authentication. ' +
        'Install @aws-sdk/client-sns and implement proper authentication before using this provider.'
    )
  }

  /**
   * Flatten nested parameters for AWS API
   */
  private flattenParams(
    params: Record<string, unknown>,
    prefix: string = ''
  ): Record<string, string> {
    const flattened: Record<string, string> = {}

    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenParams(value as Record<string, unknown>, fullKey))
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(flattened, this.flattenParams(item, `${fullKey}.${index + 1}`))
          } else {
            flattened[`${fullKey}.${index + 1}`] = String(item)
          }
        })
      } else {
        flattened[fullKey] = String(value)
      }
    }

    return flattened
  }
}
