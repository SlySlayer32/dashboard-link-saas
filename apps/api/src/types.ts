import type { AuthService } from '@dashboard-link/auth'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Context } from 'hono'

export type AppContextVariables = {
  authService?: AuthService
  organizationId?: string
  requestId?: string
  sessionId?: string
  userId?: string
  userRole?: string
  webhookBody?: string
  webhookConfig?: unknown
  webhookParsedBody?: unknown
  workerId?: string
  supabase?: SupabaseClient
  ipAddress?: string | null
  userAgent?: string | null
}

export type AppContext = Context<{ Variables: AppContextVariables }>
