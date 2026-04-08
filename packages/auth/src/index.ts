/**
 * Authentication Package
 *
 * Zapier-style authentication abstraction layer
 * Provides pluggable authentication providers and unified interface
 */

import type { AuthConfig, AuthService } from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'
import { MockAuthProvider } from './providers/MockAuthProvider.js'
import { SupabaseAuthProvider } from './providers/SupabaseAuthProvider.js'
import { AuthServiceImpl } from './services/AuthService.js'

export * from './middleware/AuthMiddleware.js'
export * from './providers/BaseAuthProvider.js'
export * from './providers/MockAuthProvider.js'
export * from './providers/SupabaseAuthProvider.js'
export * from './registry/AuthProviderRegistry.js'
export { registerDefaultAuthProvider } from './registry/AuthProviderRegistry.js'
export * from './services/AuthService.js'
export * from './utils/AuthUtils.js'

// Factory function to create auth service
export function createAuthService(provider: string, config: AuthConfig): AuthService {
  switch (provider) {
    case 'supabase': {
      const client = createClient(
        config.providerConfig?.supabaseUrl as string,
        config.providerConfig?.supabaseKey as string,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
        }
      )
      const authProvider = new SupabaseAuthProvider(client, config)
      return new AuthServiceImpl(authProvider, config)
    }

    case 'mock': {
      // For testing purposes
      const authProvider = new MockAuthProvider(config)
      return new AuthServiceImpl(authProvider, config)
    }

    default:
      throw new Error(`Unsupported auth provider: ${provider}`)
  }
}

// Re-export types from shared package
export type {
  AppValidationError,
  AuthAction,
  AuthAuditLog,
  AuthConfig,
  AuthCredentials,
  AuthError,
  AuthErrorCode,
  AuthMiddleware,
  AuthMiddlewareFactory,
  AuthNext,
  AuthProvider,
  AuthProviderFactory,
  AuthProviderRegistry,
  AuthRequest,
  AuthResponse,
  AuthResult,
  AuthService,
  AuthSession,
  AuthUser,
  AuthValidationResult,
  CookieOptions,
  PasswordPolicy,
  SessionConfig,
  TokenPayload,
  TokenResult,
  UserRole,
} from '@dashboard-link/shared'
