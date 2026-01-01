// Core contract types (Zapier-style architecture)
export * from './plugin.types';

// Auth types with conflict resolution
export {
  type AuthAction, type AuthAuditLog, type AuthConfig, type AuthCredentials, type AuthError, type AuthErrorCode, type AuthMiddleware, type AuthMiddlewareFactory, type AuthNext, type AuthProvider, type AuthProviderFactory, type AuthProviderRegistry, type AuthRequest,
  type AuthResponse, type AuthResult, type AuthService, type AuthSession, type TokenPayload as AuthTokenPayload,
  type TokenResult as AuthTokenResult, type AuthUser, type AuthValidationResult, type CookieOptions, type PasswordPolicy,
  type SessionConfig, type UserRole, type ValidationError
} from './auth.types';

// Token types (avoid conflicts with auth.types)
export { type DatabaseProviderConfig, type JWTProviderConfig, type TokenAuditLog, type TokenConfig, type TokenEvent, type TokenEventHandler, type TokenGenerationOptions, type TokenManager, type TokenPayload, type TokenProvider, type TokenProviderCapabilities, type TokenProviderFactory, type TokenRegistry, type TokenResult, type TokenSecurityConfig, type TokenStats, type TokenValidation } from './token.types';

// Legacy simple types (avoid conflicts with .types.ts files)
export type { DashboardWidget } from './dashboard';
export type { Admin as LegacyAdmin, Organization as LegacyOrganization } from './organization';
export type { Worker as LegacyWorker } from './worker';

// Utility types with conflict resolution
export {
  AppError,
  ValidationError as AppValidationError,
  AuthenticationError,
  AuthorizationError, ConflictError, NotFoundError, RateLimitError
} from './errors';

export * from './hono';

// Additional utility types needed by plugins
export interface DateRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

