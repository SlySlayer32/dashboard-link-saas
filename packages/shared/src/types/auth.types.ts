/**
 * Authentication Types and Interfaces
 * 
 * Zapier-style authentication abstraction layer
 * Provides standard contracts for authentication providers
 */

export interface AuthCredentials {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  organizationId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
  errorCode?: AuthErrorCode;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  lastAccessAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

export interface AuthProvider {
  /**
   * Authenticate user with credentials
   */
  signIn(credentials: AuthCredentials): Promise<AuthResult>;

  /**
   * Sign out user and invalidate session
   */
  signOut(userId: string, sessionId?: string): Promise<void>;

  /**
   * Validate token and return user information
   */
  validateToken(token: string): Promise<AuthUser>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Send password reset email
   */
  sendPasswordReset(email: string): Promise<boolean>;

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Promise<AuthResult>;

  /**
   * Update user profile
   */
  updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult>;

  /**
   * Change password
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult>;

  /**
   * Check if user exists
   */
  userExists(email: string): Promise<boolean>;

  /**
   * Get user by ID
   */
  getUserById(userId: string): Promise<AuthUser | null>;

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): Promise<AuthSession[]>;

  /**
   * Revoke specific session
   */
  revokeSession(userId: string, sessionId: string): Promise<void>;

  /**
   * Revoke all user sessions
   */
  revokeAllSessions(userId: string): Promise<void>;

  /**
   * Health check for auth provider
   */
  healthCheck(): Promise<boolean>;
}

export interface AuthConfig {
  provider: 'supabase' | 'auth0' | 'okta' | 'mock';
  jwtSecret?: string;
  tokenExpiry?: number;
  refreshTokenExpiry?: number;
  passwordPolicy?: PasswordPolicy;
  sessionConfig?: SessionConfig;
  providerConfig?: Record<string, unknown>;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge?: number; // Password expiry in days
}

export interface SessionConfig {
  maxSessions: number;
  idleTimeout: number; // In minutes
  absoluteTimeout: number; // In minutes
  secureCookies: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenResult {
  token: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export interface AuthMiddleware {
  /**
   * Middleware function for protecting routes
   */
  authenticate(req: AuthRequest, res: AuthResponse, next: AuthNext): Promise<void>;

  /**
   * Optional: Role-based authorization
   */
  authorize(roles: UserRole[]): (req: AuthRequest, res: AuthResponse, next: AuthNext) => Promise<void>;

  /**
   * Optional: Organization-based authorization
   */
  authorizeOrganization(organizationId: string): (req: AuthRequest, res: AuthResponse, next: AuthNext) => Promise<void>;
}

export interface AuthRequest {
  user?: AuthUser;
  session?: AuthSession;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

export interface AuthResponse {
  status(code: number): AuthResponse;
  json(data: unknown): void;
  send(data: string): void;
  cookie(name: string, value: string, options?: CookieOptions): void;
  clearCookie(name: string, options?: CookieOptions): void;
}

export interface AuthNext {
  (): void;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthAuditLog {
  id: string;
  userId?: string;
  action: AuthAction;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Enums and Unions
export type UserRole = 'admin' | 'manager' | 'worker' | 'guest';
export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_DISABLED'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  | 'PASSWORD_TOO_WEAK'
  | 'PASSWORD_MISMATCH'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN';

export type AuthAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_CONFIRM'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'TOKEN_REFRESH'
  | 'SESSION_REVOKE'
  | 'SESSION_REVOKE_ALL'
  | 'EMAIL_VERIFY'
  | 'PHONE_VERIFY';

// Validation interfaces
export interface AuthValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Provider registry
export interface AuthProviderRegistry {
  register(name: string, provider: AuthProvider): void;
  unregister(name: string): void;
  get(name: string): AuthProvider | undefined;
  list(): string[];
}

// Service interface
export interface AuthService {
  login(credentials: AuthCredentials): Promise<AuthResult>;
  logout(userId: string, sessionId?: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  validateToken(token: string): Promise<AuthUser>;
  resetPassword(token: string, newPassword: string): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<boolean>;
  updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult>;
  getUserSessions(userId: string): Promise<AuthSession[]>;
  revokeSession(userId: string, sessionId: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

// Utility types
export type AuthProviderFactory = (config: AuthConfig) => AuthProvider;
export type AuthMiddlewareFactory = (authService: AuthService) => AuthMiddleware;
