/**
 * Authentication Utilities
 * 
 * Utility functions for authentication operations
 * Provides helper methods for validation, formatting, and common tasks
 */

import type {
    AuthCredentials,
    AuthUser,
    AuthValidationResult,
    PasswordPolicy,
    UserRole
} from '@dashboard-link/shared';

// Create local ValidationError interface for compatibility
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class AuthUtils {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation
  static isValidPhone(phone: string): boolean {
    // Basic international phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  // Password validation
  static validatePassword(password: string, policy: PasswordPolicy): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (password.length < policy.minLength) {
      errors.push({
        field: 'password',
        message: `Password must be at least ${policy.minLength} characters long`,
        code: 'TOO_SHORT'
      });
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
        code: 'MISSING_UPPERCASE'
      });
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
        code: 'MISSING_LOWERCASE'
      });
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
        code: 'MISSING_NUMBERS'
      });
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
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

  // Credentials validation
  static validateCredentials(credentials: AuthCredentials): AuthValidationResult {
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
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // User validation
  static validateUser(user: Partial<AuthUser>): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (!user.email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED'
      });
    } else if (!this.isValidEmail(user.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT'
      });
    }

    if (!user.role) {
      errors.push({
        field: 'role',
        message: 'Role is required',
        code: 'REQUIRED'
      });
    } else if (!['admin', 'manager', 'worker', 'guest'].includes(user.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role',
        code: 'INVALID_ROLE'
      });
    }

    if (user.phone && !this.isValidPhone(user.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
        code: 'INVALID_FORMAT'
      });
    }

    if (user.name && user.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be 100 characters or less',
        code: 'TOO_LONG'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Role hierarchy
  static hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      admin: 4,
      manager: 3,
      worker: 2,
      guest: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  static hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.some(role => this.hasRole(userRole, role));
  }

  static hasAllRoles(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.every(role => this.hasRole(userRole, role));
  }

  // Password strength checker
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Add at least 8 characters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    // Numbers check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    // Special characters check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /welcome/i
    ];

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (hasCommonPattern) {
      score -= 1;
      feedback.push('Avoid common patterns');
    }

    return {
      score: Math.max(0, Math.min(5, score)),
      feedback,
      isStrong: score >= 4
    };
  }

  // Phone number formatting
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add + prefix if missing and number is valid
    if (!cleaned.startsWith('+') && cleaned.length >= 10) {
      return `+${cleaned}`;
    }
    
    return phone;
  }

  // Email obfuscation (for display purposes)
  static obfuscateEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}*@${domain}`;
    }
    
    const visible = username.slice(0, 2);
    const hidden = '*'.repeat(username.length - 2);
    
    return `${visible}${hidden}@${domain}`;
  }

  // Generate secure random string
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Generate session ID
  static generateSessionId(): string {
    return `sess_${Date.now()}_${this.generateSecureRandom(16)}`;
  }

  // Generate password reset token
  static generateResetToken(): string {
    return `reset_${Date.now()}_${this.generateSecureRandom(32)}`;
  }

  // Time utilities
  static isExpired(expiresAt: string): boolean {
    return new Date() > new Date(expiresAt);
  }

  static getTimeUntilExpiry(expiresAt: string): number {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return expiry.getTime() - now.getTime();
  }

  static formatTimeRemaining(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  // User display utilities
  static getDisplayName(user: AuthUser): string {
    return user.name || user.email;
  }

  static getUserInitials(user: AuthUser): string {
    const name = user.name || user.email;
    const parts = name.split(' ');
    
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    } else {
      return name.slice(0, 2).toUpperCase();
    }
  }

  static isEmailVerified(user: AuthUser): boolean {
    return user.emailVerified;
  }

  static isPhoneVerified(user: AuthUser): boolean {
    return user.phoneVerified;
  }

  // Security utilities
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const allowedFields = ['name', 'avatar', 'preferences', 'theme', 'language', 'department'];
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value != null) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeInput(value);
        } else {
          sanitized[key] = value;
        }
      }
    });
    
    return sanitized;
  }

  // Rate limiting utilities
  static generateRateLimitKey(identifier: string, action: string): string {
    return `auth_rate_limit:${identifier}:${action}`;
  }

  static generateCacheKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  // Error formatting
  static formatValidationError(errors: ValidationError[]): string {
    return errors.map(error => `${error.field}: ${error.message}`).join(', ');
  }

  static createErrorResponse(error: string, code: string, details?: Record<string, unknown>) {
    return {
      success: false,
      error,
      errorCode: code,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    };
  }

  static createSuccessResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString()
    };
  }
}

// Password strength levels
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  GOOD = 3,
  STRONG = 4,
  VERY_STRONG = 5
}

// Common authentication constants
export const AUTH_CONSTANTS = {
  DEFAULT_TOKEN_EXPIRY: 3600, // 1 hour
  DEFAULT_REFRESH_TOKEN_EXPIRY: 2592000, // 30 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
  SESSION_TIMEOUT: 480, // 8 hours
  IDLE_TIMEOUT: 30, // 30 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20
} as const;
