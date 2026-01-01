// Re-export auth types from shared package
export type {
    AuthConfig, AuthCredentials, AuthError,
    AuthErrorCode, AuthResult, AuthSession, AuthUser, AuthValidationResult, CookieOptions, PasswordPolicy,
    SessionConfig, TokenPayload,
    TokenResult,
    UserRole
} from '@dashboard-link/shared'

// Additional frontend-specific types
export interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  organizationName: string
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  token?: string
  refreshToken?: string
  error?: string
}

export interface ProfileResponse {
  success: boolean
  user?: AuthUser
  error?: string
}
