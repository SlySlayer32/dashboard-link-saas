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
export {
  type DatabaseProviderConfig,
  type JWTProviderConfig,
  type TokenAuditLog,
  type TokenBlacklist,
  type TokenCache,
  type TokenConfig,
  type TokenError,
  type TokenEvent,
  type TokenEventHandler,
  type TokenExtractor,
  type TokenGenerationOptions,
  type TokenGenerator,
  type TokenManager,
  type TokenMiddlewareOptions,
  type TokenMigration,
  type TokenMigrationResult,
  type TokenPayload,
  type TokenProvider,
  type TokenProviderCapabilities,
  type TokenProviderFactory,
  type TokenProviderMap,
  type TokenProviderName,
  type TokenRateLimit,
  type TokenRateLimitResult,
  type TokenRegistry,
  type TokenResult,
  type TokenSecurityConfig,
  type TokenStats,
  type TokenStorageOptions,
  type TokenValidation,
  type TokenValidator,
  type WorkerTokenPayload,
  type WorkerTokenResult,
  type WorkerTokenValidation
} from './token.types';

// SMS types - full export
export * from './sms.types';

// Repository types - full export
export * from './repository.types';

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

