/**
 * Authentication Service
 * 
 * Service layer that abstracts authentication operations
 * Provides business logic and validation for authentication flows
 */

import type {
    AuthConfig,
    AuthCredentials,
    AuthProvider,
    AuthResult,
    AuthService,
    AuthSession,
    AuthUser,
    AuthValidationResult,
    ValidationError
} from '@dashboard-link/shared';

export class AuthServiceImpl implements AuthService {
  private provider: AuthProvider;
  private config: AuthConfig;

  constructor(provider: AuthProvider, config: AuthConfig) {
    this.provider = provider;
    this.config = config;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Additional business logic validation
      const businessValidation = this.validateBusinessRules(credentials);
      if (!businessValidation.valid) {
        return {
          success: false,
          error: 'Business validation failed',
          errorCode: 'VALIDATION_ERROR',
          details: { errors: businessValidation.errors }
        };
      }

      // Delegate to provider
      const result = await this.provider.signIn(credentials);

      // Post-login business logic
      if (result.success && result.user) {
        await this.handlePostLogin(result.user);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: 'Login service unavailable',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      await this.provider.signOut(userId, sessionId);
      await this.handlePostLogout(userId);
    } catch (error) {
      throw new Error('Logout failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const result = await this.provider.refreshToken(refreshToken);
      
      if (result.success && result.user) {
        await this.handlePostLogin(result.user);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  async validateToken(token: string): Promise<AuthUser> {
    try {
      return await this.provider.validateToken(token);
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: 'Password does not meet security requirements',
          errorCode: 'PASSWORD_TOO_WEAK',
          details: { errors: passwordValidation.errors }
        };
      }

      return await this.provider.resetPassword(token, newPassword);

    } catch (error) {
      return {
        success: false,
        error: 'Password reset failed',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  async sendPasswordReset(email: string): Promise<boolean> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      return await this.provider.sendPasswordReset(email);

    } catch (error) {
      return false;
    }
  }

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      // Business validation for profile updates
      const profileValidation = this.validateProfileUpdates(updates);
      if (!profileValidation.valid) {
        return {
          success: false,
          error: 'Profile update validation failed',
          errorCode: 'VALIDATION_ERROR',
          details: { errors: profileValidation.errors }
        };
      }

      return await this.provider.updateProfile(userId, updates);

    } catch (error) {
      return {
        success: false,
        error: 'Profile update failed',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // Validate new password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: 'New password does not meet security requirements',
          errorCode: 'PASSWORD_TOO_WEAK',
          details: { errors: passwordValidation.errors }
        };
      }

      // Check if new password is same as current
      if (currentPassword === newPassword) {
        return {
          success: false,
          error: 'New password must be different from current password',
          errorCode: 'PASSWORD_MISMATCH'
        };
      }

      return await this.provider.changePassword(userId, currentPassword, newPassword);

    } catch (error) {
      return {
        success: false,
        error: 'Password change failed',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  async getUserSessions(userId: string): Promise<AuthSession[]> {
    try {
      return await this.provider.getUserSessions(userId);
    } catch (error) {
      return [];
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    try {
      await this.provider.revokeSession(userId, sessionId);
    } catch (error) {
      throw new Error('Session revocation failed');
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    try {
      await this.provider.revokeAllSessions(userId);
    } catch (error) {
      throw new Error('All session revocation failed');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch (error) {
      return false;
    }
  }

  // Business logic methods
  private validateBusinessRules(credentials: AuthCredentials): AuthValidationResult {
    const errors: ValidationError[] = [];

    // Check if email domain is allowed (example business rule)
    const allowedDomains = this.config.providerConfig?.allowedDomains as string[] || [];
    if (allowedDomains.length > 0) {
      const domain = credentials.email.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        errors.push({
          field: 'email',
          message: 'Email domain is not allowed',
          code: 'DOMAIN_NOT_ALLOWED'
        });
      }
    }

    // Check business hours (example business rule)
    const businessHoursOnly = this.config.providerConfig?.businessHoursOnly as boolean || false;
    if (businessHoursOnly) {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 8 || hour > 18) {
        errors.push({
          field: 'business_hours',
          message: 'Login only allowed during business hours (8 AM - 6 PM)',
          code: 'OUTSIDE_BUSINESS_HOURS'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validatePasswordStrength(password: string): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (!this.config.passwordPolicy) {
      return { valid: true, errors: [] };
    }

    const policy = this.config.passwordPolicy;

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

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push({
        field: 'password',
        message: 'Password cannot contain common patterns',
        code: 'COMMON_PASSWORD'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateProfileUpdates(updates: Partial<AuthUser>): AuthValidationResult {
    const errors: ValidationError[] = [];

    // Validate email format if provided
    if (updates.email && !this.isValidEmail(updates.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT'
      });
    }

    // Validate phone format if provided
    if (updates.phone && !this.isValidPhone(updates.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
        code: 'INVALID_FORMAT'
      });
    }

    // Validate name length if provided
    if (updates.name && updates.name.length > 100) {
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

  private async handlePostLogin(user: AuthUser): Promise<void> {
    // Post-login business logic
    // Examples: update last login, check subscription status, etc.
    
    // Log successful login
    console.log(`User ${user.email} logged in successfully`);
    
    // Check if user needs to reset password (example)
    const passwordAge = this.getPasswordAge(user);
    const maxAge = this.config.passwordPolicy?.maxAge || 90;
    
    if (passwordAge > maxAge) {
      // Flag user for password reset
      console.log(`User ${user.email} should reset password`);
    }
  }

  private async handlePostLogout(userId: string): Promise<void> {
    // Post-logout business logic
    console.log(`User ${userId} logged out`);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  private getPasswordAge(user: AuthUser): number {
    if (!user.updatedAt) return 0;
    
    const updatedDate = new Date(user.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Utility methods for external use
  public getConfig(): AuthConfig {
    return this.config;
  }

  public getProvider(): AuthProvider {
    return this.provider;
  }

  // Admin methods
  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role?: 'admin' | 'manager' | 'worker' | 'guest';
    organizationId?: string;
  }): Promise<AuthResult> {
    try {
      // Validate user creation data
      const validation = this.validateUserCreation(userData);
      if (!validation.valid) {
        return {
          success: false,
          error: 'User creation validation failed',
          errorCode: 'VALIDATION_ERROR',
          details: { errors: validation.errors }
        };
      }

      // This would typically call a provider-specific method
      // For now, return a placeholder response
      return {
        success: false,
        error: 'User creation not implemented in base service',
        errorCode: 'NOT_IMPLEMENTED'
      };

    } catch (error) {
      return {
        success: false,
        error: 'User creation failed',
        errorCode: 'PROVIDER_ERROR'
      };
    }
  }

  private validateUserCreation(userData: Record<string, unknown>): AuthValidationResult {
    const errors: ValidationError[] = [];

    if (!userData.email || !this.isValidEmail(userData.email as string)) {
      errors.push({
        field: 'email',
        message: 'Valid email is required',
        code: 'INVALID_EMAIL'
      });
    }

    if (!userData.password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
        code: 'REQUIRED'
      });
    } else {
      const passwordValidation = this.validatePasswordStrength(userData.password as string);
      if (!passwordValidation.valid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (!userData.role || !['admin', 'manager', 'worker', 'guest'].includes(userData.role as string)) {
      errors.push({
        field: 'role',
        message: 'Valid role is required',
        code: 'INVALID_ROLE'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
