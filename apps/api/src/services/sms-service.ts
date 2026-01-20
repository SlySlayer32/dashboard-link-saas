interface SMSJob {
  id: string
  to: string
  message: string
  orgId: string
  type: 'dashboard_link' | 'alert' | 'notification'
  status: 'pending' | 'sent' | 'failed'
  createdAt: Date
  sentAt?: Date
  errorMessage?: string
  scheduledAt?: Date
}

interface SMSEnqueueOptions {
  to: string
  message: string
  orgId: string
  type: SMSJob['type']
  scheduledAt?: Date
}

export class SMSService {
  // redis would be injected or accessed via context
  private readonly mobileMessageAPI = {
    username: process.env.MOBILEMESSAGE_USERNAME,
    password: process.env.MOBILEMESSAGE_PASSWORD,
    baseUrl: 'https://api.mobilemessage.com.au',
  }

  constructor() {
    // redis would be injected or accessed via context
  }

  /**
   * Enqueue an SMS for sending
   */
  async enqueueSMS(options: SMSEnqueueOptions): Promise<SMSJob> {
    const job: SMSJob = {
      id: crypto.randomUUID(),
      to: options.to,
      message: options.message,
      orgId: options.orgId,
      type: options.type,
      status: 'pending',
      createdAt: new Date(),
      scheduledAt: options.scheduledAt,
    }

    // Store job in database
    // const _stmt = `
    //     INSERT INTO sms_jobs (id, to_phone, message, org_id, type, status, created_at, scheduled_at)
    //     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    // `;

    // In production, this would enqueue to a message queue (BullMQ)
    // For now, we'll store directly in database

    return job
  }

  /**
   * Send SMS via MobileMessage.au API
   */
  async sendSMS(job: SMSJob): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate phone number
      if (!this.validatePhoneNumber(job.to)) {
        throw new Error('Invalid phone number format')
      }

      // Check message length
      if (job.message.length > 160) {
        // Split into multiple messages or truncate
        job.message = job.message.substring(0, 157) + '...'
      }

      // Call MobileMessage.au API
      const response = await this.callMobileMessageAPI({
        to: job.to,
        message: job.message,
        from: process.env.MOBILEMESSAGE_SENDER_ID || 'Dashboard',
      })

      // Type assertion for response
      const smsResponse = response as Record<string, unknown>

      if (smsResponse.success) {
        // Update job status
        await this.updateJobStatus(job.id, 'sent', {
          messageId: smsResponse.messageId as string,
        })
        return {
          success: true,
          messageId: smsResponse.messageId as string,
        }
      } else {
        throw new Error((smsResponse.error as string) || 'Failed to send SMS')
      }
    } catch (error) {
      // Update job with error
      await this.updateJobStatus(job.id, 'failed', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Call MobileMessage.au API
   */
  private async callMobileMessageAPI(data: {
    to: string
    message: string
    from: string
  }): Promise<unknown> {
    const auth = Buffer.from(
      `${this.mobileMessageAPI.username}:${this.mobileMessageAPI.password}`
    ).toString('base64')

    const response = await fetch(`${this.mobileMessageAPI.baseUrl}/sms/send`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            to: data.to,
            from: data.from,
            body: data.message,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`MobileMessage API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    _jobId: string,
    _status: SMSJob['status'],
    _metadata?: { messageId?: string; errorMessage?: string }
  ): Promise<void> {
    // const _stmt = `
    //     UPDATE sms_jobs
    //     SET status = ?, sent_at = ?, message_id = ?, error_message = ?
    //     WHERE id = ?
    // `;
    // Execute with parameters
    // status, new Date(), metadata?.messageId, metadata?.errorMessage, jobId
  }

  /**
   * Validate phone number (E.164 format)
   */
  private validatePhoneNumber(phone: string): boolean {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')

    // Check E.164 format
    return /^\+?[1-9]\d{1,14}$/.test(cleaned)
  }

  /**
   * Get SMS delivery status
   */
  async getDeliveryStatus(_jobId: string): Promise<SMSJob | null> {
    // const _stmt = `
    //     SELECT * FROM sms_jobs WHERE id = ?
    // `;

    // Execute query and return result
    return null // Placeholder
  }

  /**
   * Get SMS statistics for an organization
   */
  async getSMSStats(
    _orgId: string,
    period: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    sent: number
    failed: number
    pending: number
    total: number
  }> {
    let timeFilter = 'CURRENT_DATE'
    if (period === 'week') timeFilter = "CURRENT_DATE - INTERVAL '7 days'"
    if (period === 'month') timeFilter = "CURRENT_DATE - INTERVAL '30 days'"

    // const _stmt = `
    //     SELECT
    //         status,
    //         COUNT(*) as count
    //     FROM sms_jobs
    //     WHERE org_id = ? AND created_at >= ${timeFilter}
    //     GROUP BY status
    // `;

    // Return mock data for now
    return {
      sent: 45,
      failed: 2,
      pending: 3,
      total: 50,
    }
  }
}
