/**
 * SMSService
 * Bridges API layer to @dashboard-link/sms package and logs to sms_logs table.
 */

import type { SMSMessage } from '@dashboard-link/shared'
import { getSMSService, isSMSInitialized } from '@dashboard-link/sms'
import { createClient } from '@supabase/supabase-js'

export interface EnqueueSMSOptions {
  to: string
  message: string
  orgId: string
  type: string
  workerId?: string
  tokenId?: string
  sentBy?: string
}

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

export class SMSService {
  /**
   * Send an SMS and log it to sms_logs.
   * Uses the @dashboard-link/sms package if initialized,
   * otherwise falls back to logging-only mode for development.
   */
  async enqueueSMS(options: EnqueueSMSOptions): Promise<{ id: string }> {
    const supabase = getSupabaseAdmin()
    const logId = crypto.randomUUID()

    let status: 'sent' | 'failed' = 'sent'
    let providerMessageId: string | undefined
    let errorReason: string | undefined

    if (isSMSInitialized()) {
      try {
        const smsService = getSMSService()
        const smsMessage: SMSMessage = {
          to: options.to,
          body: options.message,
          from: process.env.MOBILEMESSAGE_SENDER_ID || 'DashLink',
        }

        const result = await smsService.sendMessage(smsMessage)
        if (result.success) {
          providerMessageId = result.messageId
        } else {
          status = 'failed'
          errorReason = result.error || 'Unknown SMS error'
        }
      } catch (err) {
        status = 'failed'
        errorReason = err instanceof Error ? err.message : 'SMS send failed'
      }
    } else {
      // Development mode — no SMS provider configured
      console.log(`[SMS-DEV] Would send to ${options.to}: ${options.message}`)
      providerMessageId = `dev-${logId}`
    }

    // Log to sms_logs table
    await supabase.from('sms_logs').insert({
      id: logId,
      organization_id: options.orgId,
      worker_id: options.workerId,
      phone_number: options.to,
      message_content: options.message.slice(0, 320),
      token_id: options.tokenId,
      status,
      message_id: providerMessageId,
      error_reason: errorReason,
      sent_by: options.sentBy,
    })

    return { id: logId }
  }
}
