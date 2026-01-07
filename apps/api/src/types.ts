import type { AuthService } from '@dashboard-link/auth'
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
}

export type AppContext = Context<{ Variables: AppContextVariables }>
