export interface Organization {
  id: string
  name: string
  slug: string
  sms_limit_per_hour: number
  default_token_expiry_hours: number
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name?: string
  role: 'admin' | 'owner'
  created_at: string
  updated_at: string
}

// Legacy alias for backward compatibility
export interface Admin extends User {}
