/**
 * Base Authentication Provider
 * 
 * Abstract base class for authentication providers
 * Provides common functionality and enforces interface compliance
 */

import type {
    AuthConfig,
    AuthCredentials,
    AuthErrorCode,
    AuthProvider,
    AuthResult,
    AuthSession,
    AuthUser,
    AuthValidationResult,
    PasswordPolicy,
    SessionConfig
} from '@dashboard-link/shared';
import type { ValidationError } from '../utils/AuthUtils';

export abstract class BaseAuthProvider implements AuthProvider {
  protected config: AuthConfig;
  protected passwordPolicy: PasswordPolicy;
  protected sessionConfig: SessionConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.passwordPolicy = config.passwordPolicy || this.getDefaultPasswordPolicy();
    this.sessionConfig = config.sessionConfig || this.getDefaultSessionConfig();
  }

  // Abstract methods that must be implemented by concrete providers
  abstract signIn(credentials: AuthCredentials): Promise<AuthResult>;
  abstract signOut(userId: string, sessionId?: string): Promise<void>;
  abstract validateToken(token: string): Promise<AuthUser>;
  abstract refreshToken(refreshToken: string): Promise<AuthResult>;
  abstract sendPasswordReset(email: string): Promise<boolean>;
  abstract resetPassword(token: string, newPassword: string): Promise<AuthResult>;
  abstract updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult>;
  abstract changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult>;
  abstract userExists(email: string): Promise<boolean>;
  abstract getUserById(userId: string): Promise<AuthUser | null>;
  abstract getUserSessions(userId: string): Promise<AuthSession[]>;
  abstract revokeSession(userId: string, sessionId: string): Promise<void>;
  abstract revokeAllSessions(userId: string): Promise<void>;
  abstract healthCheck(): Promise<boolean>;

  // Common utility methods
  protected validateCredentials(credentials: AuthCredentials): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (!credentials.email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED'
      });
    } else if (!this.isValidEmail(credentials.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT'
      });
    }

    if (!credentials.password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
        code: 'REQUIRED'
      });
    } else if (!this.isValidPassword(credentials.password)) {
      errors.push({
        field: 'password',
        message: 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected validatePassword(password: string): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (password.length < this.passwordPolicy.minLength) {
      errors.push({
        field: 'password',
        message: `Password must be at least ${this.passwordPolicy.minLength} characters long`,
        code: 'TOO_SHORT'
      });
    }

    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
        code: 'MISSING_UPPERCASE'
      });
    }

    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
        code: 'MISSING_LOWERCASE'
      });
    }

    if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
        code: 'MISSING_NUMBERS'
      });
    }

    if (this.passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one special character',
        code: 'MISSING_SPECIAL_CHARS'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  protected transformUserToAuthUser(user: unknown): AuthUser {
    const u = user as Record<string, unknown>;
    return {
      id: u.id as string,
      email: u.email as string,
      name: (u.name as string | undefined) || (u.user_metadata as Record<string, unknown>)?.name as string | undefined,
      avatar: (u.avatar as string | undefined) || (u.user_metadata as Record<string, unknown>)?.avatar_url as string | undefined,
      role: this.mapRole((u.role as string | undefined) || (u.user_metadata as Record<string, unknown>)?.role as string | undefined),
      organizationId: (u.organization_id as string | undefined) || (u.user_metadata as Record<string, unknown>)?.organization_id as string | undefined,
      metadata: (u.user_metadata as Record<string, unknown>) || {},
      createdAt: u.created_at as string,
      updatedAt: (u.updated_at as string) || (u.created_at as string),
      lastLoginAt: u.last_sign_in_at as string | undefined,
      emailVerified: u.email_confirmed_at != null,
      phone: u.phone as string | undefined,
      phoneVerified: u.phone_confirmed_at != null
    };
  }

  protected createAuthResult(success: boolean, data?: Partial<AuthResult>): AuthResult {
    const result: AuthResult = { success };
    
    if (data) {
      Object.assign(result, data);
    }

    if (!success && !result.error) {
      result.error = 'Authentication failed';
      result.errorCode = 'PROVIDER_ERROR';
    }

    return result;
  }

  protected createError(errorCode: AuthErrorCode, message: string, details?: Record<string, unknown>): AuthResult {
    return {
      success: false,
      error: message,
      errorCode,
      ...(details && { details })
    };
  }

  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected isValidPassword(password: string): boolean {
    return this.validatePassword(password).valid;
  }

  protected mapRole(role?: string): 'admin' | 'manager' | 'worker' | 'guest' {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'admin';
      case 'manager':
        return 'manager';
      case 'worker':
        return 'worker';
      default:
        return 'guest';
    }
  }

  protected generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected calculateExpiry(minutes: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now.toISOString();
  }

  protected isExpired(expiresAt: string): boolean {
    return new Date() > new Date(expiresAt);
  }

  protected sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    // Only allow safe metadata fields
    const allowedFields = ['name', 'avatar', 'preferences', 'theme', 'language'];
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value != null) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private getDefaultPasswordPolicy(): PasswordPolicy {
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90 // 90 days
    };
  }

  private getDefaultSessionConfig(): SessionConfig {
    return {
      maxSessions: 5,
      idleTimeout: 30, // 30 minutes
      absoluteTimeout: 480, // 8 hours
      secureCookies: true,
      sameSite: 'strict'
    };
  }

  // Rate limiting helpers
  protected async checkRateLimit(_identifier: string, _action: string, _limit: number = 5, _windowMs: number = 900000): Promise<boolean> {
    // This should be implemented with Redis or in-memory store
    // For now, return true (no rate limiting)
    return true;
  }

  protected async recordRateLimitHit(_identifier: string, _action: string): Promise<void> {
    // This should be implemented with Redis or in-memory store
    // For now, do nothing
  }

  // Audit logging helpers
  protected async logAuthEvent(event: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    success?: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // This would be implemented with actual logging service
    // For now, just log to console
    console.log('Auth event:', event);
  }

  // Token helpers
  protected generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  protected hashPassword(password: string): string {
    // This should be implemented with bcrypt or similar
    // For now, return a simple hash (NOT SECURE FOR PRODUCTION)
    return Buffer.from(password).toString('base64');
  }

  protected verifyPassword(password: string, hash: string): boolean {
    // This should be implemented with bcrypt or similar
    // For now, simple comparison (NOT SECURE FOR PRODUCTION)
    return Buffer.from(password).toString('base64') === hash;
  }
}
