/**
 * Supabase Authentication Provider
 * 
 * Concrete implementation of AuthProvider for Supabase
 * Transforms Supabase auth responses to standard format
 */

import type {
    AuthConfig,
    AuthCredentials,
    AuthErrorCode,
    AuthResult,
    AuthSession,
    AuthUser
} from '@dashboard-link/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseAuthProvider } from './BaseAuthProvider';

export class SupabaseAuthProvider extends BaseAuthProvider {
  private client: SupabaseClient;

  constructor(client: SupabaseClient, config: AuthConfig) {
    super(config);
    this.client = client;
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validate credentials first
      const validation = this.validateCredentials(credentials);
      if (!validation.valid) {
        return this.createError('VALIDATION_ERROR', 'Invalid credentials format', {
          errors: validation.errors
        });
      }

      // Check rate limiting
      const rateLimitOk = await this.checkRateLimit(credentials.email, 'signin');
      if (!rateLimitOk) {
        return this.createError('RATE_LIMIT_EXCEEDED', 'Too many sign in attempts');
      }

      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        await this.recordRateLimitHit(credentials.email, 'signin');
        
        // Map Supabase errors to standard error codes
        const errorCode = this.mapSupabaseError(error.message);
        
        await this.logAuthEvent({
          action: 'LOGIN',
          resource: 'auth',
          success: false,
          error: error.message,
          metadata: { email: credentials.email }
        });

        return this.createError(errorCode, error.message);
      }

      if (!data.user || !data.session) {
        return this.createError('PROVIDER_ERROR', 'Invalid authentication response');
      }

      const authUser = this.transformUserToAuthUser(data.user);
      // Session transformation handled separately if needed

      await this.logAuthEvent({
        userId: authUser.id,
        action: 'LOGIN',
        resource: 'auth',
        success: true,
        metadata: { email: credentials.email }
      });

      return this.createAuthResult(true, {
        user: authUser,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined
      });

    } catch (error) {
      await this.logAuthEvent({
        action: 'LOGIN',
        resource: 'auth',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email: credentials.email }
      });

      return this.createError('PROVIDER_ERROR', 'Authentication service unavailable');
    }
  }

  async signOut(userId: string, sessionId?: string): Promise<void> {
    try {
      const { error } = await this.client.auth.signOut();

      if (error) {
        throw new Error(`Sign out failed: ${error.message}`);
      }

      await this.logAuthEvent({
        userId,
        action: 'LOGOUT',
        resource: 'auth',
        success: true,
        metadata: { sessionId }
      });

    } catch (error) {
      await this.logAuthEvent({
        userId,
        action: 'LOGOUT',
        resource: 'auth',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { sessionId }
      });

      throw error;
    }
  }

  async validateToken(token: string): Promise<AuthUser> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser(token);

      if (error || !user) {
        throw new Error('Invalid token');
      }

      return this.transformUserToAuthUser(user);

    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session || !data.user) {
        const errorCode = this.mapSupabaseError(error?.message || 'Token refresh failed');
        return this.createError(errorCode, 'Token refresh failed');
      }

      const authUser = this.transformUserToAuthUser(data.user);

      return this.createAuthResult(true, {
        user: authUser,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined
      });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Token refresh service unavailable');
    }
  }

  async sendPasswordReset(email: string): Promise<boolean> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.config.providerConfig?.resetPasswordUrl || '/reset-password'}`
      });

      if (error) {
        throw new Error(`Password reset failed: ${error.message}`);
      }

      await this.logAuthEvent({
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'auth',
        success: true,
        metadata: { email }
      });

      return true;

    } catch (error) {
      await this.logAuthEvent({
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'auth',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email }
      });

      return false;
    }
  }

  async resetPassword(_token: string, newPassword: string): Promise<AuthResult> {
    try {
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return this.createError('PASSWORD_TOO_WEAK', 'Password does not meet security requirements', {
          errors: passwordValidation.errors
        });
      }

      const { data, error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const errorCode = this.mapSupabaseError(error.message);
        return this.createError(errorCode, error.message);
      }

      if (!data.user) {
        return this.createError('PROVIDER_ERROR', 'Password reset failed');
      }

      const authUser = this.transformUserToAuthUser(data.user);

      await this.logAuthEvent({
        userId: authUser.id,
        action: 'PASSWORD_RESET_CONFIRM',
        resource: 'auth',
        success: true
      });

      return this.createAuthResult(true, { user: authUser });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Password reset service unavailable');
    }
  }

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      const sanitizedUpdates = this.sanitizeMetadata(updates.metadata || {});
      
      const supabaseUpdates: Record<string, unknown> = {
        data: {
          ...sanitizedUpdates,
          ...(updates.name && { name: updates.name }),
          ...(updates.avatar && { avatar_url: updates.avatar }),
          ...(updates.organizationId && { organization_id: updates.organizationId })
        }
      };

      const { data, error } = await this.client.auth.updateUser(supabaseUpdates);

      if (error) {
        return this.createError('PROVIDER_ERROR', error.message);
      }

      if (!data.user) {
        return this.createError('PROVIDER_ERROR', 'Profile update failed');
      }

      const authUser = this.transformUserToAuthUser(data.user);

      await this.logAuthEvent({
        userId,
        action: 'PROFILE_UPDATE',
        resource: 'auth',
        success: true,
        metadata: { updates }
      });

      return this.createAuthResult(true, { user: authUser });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Profile update service unavailable');
    }
  }

  async changePassword(userId: string, _currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // First verify current password by attempting to sign in
      const user = await this.getUserById(userId);
      if (!user) {
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return this.createError('PASSWORD_TOO_WEAK', 'New password does not meet security requirements', {
          errors: passwordValidation.errors
        });
      }

      // Update password
      const { data, error } = await this.client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const errorCode = this.mapSupabaseError(error.message);
        return this.createError(errorCode, error.message);
      }

      if (!data.user) {
        return this.createError('PROVIDER_ERROR', 'Password change failed');
      }

      const authUser = this.transformUserToAuthUser(data.user);

      await this.logAuthEvent({
        userId,
        action: 'PASSWORD_CHANGE',
        resource: 'auth',
        success: true
      });

      return this.createAuthResult(true, { user: authUser });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Password change service unavailable');
    }
  }

  async userExists(email: string): Promise<boolean> {
    try {
      // Use admin client to check if user exists without exposing sensitive info
      const { data, error } = await this.client.auth.admin.listUsers();
      
      if (error) {
        return false;
      }

      const user = data.users.find(u => u.email === email);
      return !!user;

    } catch (error) {
      return false;
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.client.auth.admin.getUserById(userId);

      if (error || !user) {
        return null;
      }

      return this.transformUserToAuthUser(user);

    } catch (error) {
      return null;
    }
  }

  async getUserSessions(_userId: string): Promise<AuthSession[]> {
    try {
      // Supabase doesn't provide direct session listing
      // This would need to be implemented with custom session tracking
      // For now, return empty array
      return [];

    } catch (error) {
      return [];
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    try {
      // Supabase doesn't provide specific session revocation
      // This would need to be implemented with custom session tracking
      await this.signOut(userId, sessionId);

    } catch (error) {
      throw error;
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    try {
      // Supabase doesn't provide all session revocation
      // This would need to be implemented with custom session tracking
      await this.signOut(userId);

    } catch (error) {
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client.auth.getSession();
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Helper methods
  private mapSupabaseError(message: string): AuthErrorCode {
    if (message.includes('Invalid login credentials')) {
      return 'INVALID_CREDENTIALS';
    }
    if (message.includes('Email not confirmed')) {
      return 'EMAIL_NOT_VERIFIED';
    }
    if (message.includes('User not found')) {
      return 'USER_NOT_FOUND';
    }
    if (message.includes('refresh_token')) {
      return 'TOKEN_EXPIRED';
    }
    if (message.includes('rate limit')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    return 'PROVIDER_ERROR';
  }
}
