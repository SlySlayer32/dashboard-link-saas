// Core contract types (Zapier-style architecture)
export * from './plugin.types.js'

// Auth types with conflict resolution
export {
  type AuthAction,
  type AuthAuditLog,
  type AuthConfig,
  type AuthCredentials,
  type AuthError,
  type AuthErrorCode,
  type AuthMiddleware,
  type AuthMiddlewareFactory,
  type AuthNext,
  type AuthProvider,
  type AuthProviderFactory,
  type AuthProviderRegistry,
  type AuthRequest,
  type AuthResponse,
  type AuthResult,
  type AuthService,
  type AuthSession,
  type TokenPayload as AuthTokenPayload,
  type TokenResult as AuthTokenResult,
  type AuthUser,
  type AuthValidationResult,
  type CookieOptions,
  type PasswordPolicy,
  type SessionConfig,
  type UserRole,
  type ValidationError,
} from './auth.types.js'

// Token types - Export all from token.types
export * from './token.types.js'

// SMS types - full export
export * from './sms.types.js'

// Repository types - full export
export * from './repository.types.js'

// Payment types - full export
export * from './payment.types.js'

// MVP Core Types - Export all from new type files (avoid conflicts with repository.types)
// These are already exported via repository.types, so we skip them to avoid conflicts
// export * from './access-log'
// export * from './data-source'
// export * from './organization'
export * from './schedule.js'
// export * from './sms'  // Already exported via sms.types
// export * from './token'  // Already exported via token.types
// export * from './worker'  // Already exported via repository.types

// Legacy simple types (avoid conflicts with .types.ts files)
export type {
  AdminDashboardResponse,
  AdminDashboardStats,
  DashboardActivityItem,
  DashboardWidget,
  NonOpenerItem,
} from './dashboard.js'

// Utility types with conflict resolution
export {
  AppError,
  ValidationError as AppValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  RateLimitError,
} from './errors.js'

export * from './hono.js'
export * from './admin-workspace.js'

// Additional utility types needed by plugins
export interface DateRange {
  start: string // ISO 8601
  end: string // ISO 8601
}

export interface ValidationResult<T = unknown> {
  valid: boolean
  data?: T
  errors?: string[]
}

export interface WebhookResponse {
  success: boolean
  message?: string
  data?: unknown
}
