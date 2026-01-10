// Payment provider contracts for billing abstractions

// TODO(billing): Stripe/provider implementation and plan/usage limit enforcement are not implemented yet.
// These are contracts only; Phase 3 must pick provider, define plans/limits, and wire webhooks + metering.

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'wallet' | 'other'
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  brand?: string
  metadata?: Record<string, unknown>
}

export interface PaymentRequest {
  amount: number // minor units (cents)
  currency: string // ISO currency code
  customerId?: string
  sourceToken?: string
  description?: string
  receiptEmail?: string
  metadata?: Record<string, unknown>
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  status: 'succeeded' | 'pending' | 'failed'
  amount?: number
  currency?: string
  error?: string
  errorCode?: string
  receiptUrl?: string
  metadata?: Record<string, unknown>
}

export interface RefundRequest {
  paymentId: string
  amount?: number
  reason?: string
  metadata?: Record<string, unknown>
}

export interface RefundResult {
  success: boolean
  refundId?: string
  status: 'succeeded' | 'pending' | 'failed'
  amount?: number
  currency?: string
  error?: string
  errorCode?: string
  metadata?: Record<string, unknown>
}

export interface PaymentStatus {
  paymentId: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'cancelled'
  amount: number
  currency: string
  captured: boolean
  createdAt: string
  updatedAt?: string
  metadata?: Record<string, unknown>
}

export interface PaymentHealth {
  healthy: boolean
  lastChecked: string
  responseTime?: number
  message?: string
  metadata?: Record<string, unknown>
}

export interface PaymentProvider {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description?: string

  charge(request: PaymentRequest): Promise<PaymentResult>
  refund(request: RefundRequest): Promise<RefundResult>
  getStatus(paymentId: string): Promise<PaymentStatus>
  getHealth(): Promise<PaymentHealth>

  supportsSavedMethods?(): boolean
  supportsPartialRefunds?(): boolean
}
