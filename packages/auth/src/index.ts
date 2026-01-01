/**
 * Authentication Package
 * 
 * Zapier-style authentication abstraction layer
 * Provides pluggable authentication providers and unified interface
 */

export * from './src/middleware/AuthMiddleware';
export * from './src/providers/BaseAuthProvider';
export * from './src/providers/MockAuthProvider';
export * from './src/providers/SupabaseAuthProvider';
export * from './src/registry/AuthProviderRegistry';
export * from './src/services/AuthService';
export * from './src/utils/AuthUtils';

// Re-export types from shared package
export type {
    AuthAction, AuthAuditLog, AuthConfig, AuthCredentials, AuthError, AuthErrorCode, AuthMiddleware, AuthMiddlewareFactory, AuthNext, AuthProvider, AuthProviderFactory, AuthProviderRegistry, AuthRequest,
    AuthResponse, AuthResult, AuthService, AuthSession, AuthUser, AuthValidationResult, CookieOptions, PasswordPolicy,
    SessionConfig,
    TokenPayload,
    TokenResult, UserRole, ValidationError
} from '@dashboard-link/shared';

