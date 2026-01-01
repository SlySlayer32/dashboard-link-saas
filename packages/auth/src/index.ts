/**
 * Authentication Package
 * 
 * Zapier-style authentication abstraction layer
 * Provides pluggable authentication providers and unified interface
 */

export * from './middleware/AuthMiddleware';
export * from './providers/BaseAuthProvider';
export * from './providers/MockAuthProvider';
export * from './providers/SupabaseAuthProvider';
export * from './registry/AuthProviderRegistry';
export * from './services/AuthService';
export * from './utils/AuthUtils';

// Re-export types from shared package
export type {
    AppValidationError, AuthAction, AuthAuditLog, AuthConfig, AuthCredentials, AuthError, AuthErrorCode, AuthMiddleware, AuthMiddlewareFactory, AuthNext, AuthProvider, AuthProviderFactory, AuthProviderRegistry, AuthRequest,
    AuthResponse, AuthResult, AuthService, AuthSession, AuthUser, AuthValidationResult, CookieOptions, PasswordPolicy,
    SessionConfig,
    TokenPayload,
    TokenResult, UserRole
} from '@dashboard-link/shared';

