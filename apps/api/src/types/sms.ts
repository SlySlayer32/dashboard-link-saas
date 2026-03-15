export interface SMSLog {
  id: string
  organization_id: string
  worker_id?: string
  phone_number: string // Fixed: was 'phone'
  message_content: string // Fixed: was 'message'
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  provider_message_id?: string // Added: provider-specific message ID
  error_reason?: string // Added: error details
  provider?: string // Added: SMS provider used
  message_id?: string // Added: normalized message ID
  error_type?: string // Added: categorized error type
  cost?: number // Added: actual SMS cost
  delivery_status?: string // Added: delivery tracking status
  sent_by?: string // Added: user who sent the SMS
  sent_at: string // Fixed: was 'created_at'
  delivered_at?: string // Added: delivery timestamp
  created_at: string // Added: creation timestamp
  token_id?: string // Added: related dashboard token
}

export interface SMSDashboardLinkRequest {
  workerId: string
  expiresIn: '1h' | '6h' | '12h' | '24h'
  customMessage?: string
}

export interface SMSDashboardLinkResponse {
  success: boolean
  data: {
    smsId: string
    token: string
    dashboardUrl: string
    status: 'sent' | 'pending' | 'failed'
    expiresAt: string
  }
}

export interface SMSLogsResponse {
  success: boolean
  data: SMSLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  workerId?: string
}

export interface SendSMSRequest {
  workerId: string
  message: string
}

export interface SendSMSResponse {
  success: boolean
  data?: {
    smsId: string
    messageId?: string
    status: 'sent' | 'pending' | 'failed'
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
