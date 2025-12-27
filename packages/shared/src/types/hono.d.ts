import { Context } from 'hono'
export interface HonoEnv {
  Variables: {
    userId: string
    userRole: 'admin' | 'worker'
    organizationId: string
  }
  Bindings: {
    SUPABASE_URL: string
    SUPABASE_SERVICE_KEY: string
    DATABASE_URL: string
    SMS_API_KEY: string
    JWT_SECRET: string
  }
}
export type TypedContext = Context<HonoEnv>
export interface AuthContext {
  userId: string
  userRole: 'admin' | 'worker'
  organizationId: string
}
export interface RequestContext {
  requestId: string
  method: string
  url: string
  userId?: string
  organizationId?: string
  userAgent?: string
  ip?: string
}
export interface ErrorContext {
  requestId: string
  userId?: string
  organizationId?: string
  action?: string
  resource?: string
}
//# sourceMappingURL=hono.d.ts.map
