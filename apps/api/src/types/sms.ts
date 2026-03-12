export interface SMSLog {
  id: string
  organization_id: string
  worker_id?: string
  phone: string
  message: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  provider_response?: unknown
  created_at: string
  updated_at: string
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
