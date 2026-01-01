/**
 * Mock Authentication Provider
 * 
 * In-memory authentication provider for testing and development
 * Provides fast, isolated authentication operations without external dependencies
 */

import type {
    AuthConfig,
    AuthCredentials,
    AuthResult,
    AuthSession,
    AuthUser
} from '@dashboard-link/shared';
import { BaseAuthProvider } from './BaseAuthProvider';

export class MockAuthProvider extends BaseAuthProvider {
  private users = new Map<string, AuthUser>();
  private sessions = new Map<string, AuthSession>();
  private passwordResetTokens = new Map<string, { email: string; expiresAt: string }>();

  constructor(config: AuthConfig) {
    super(config);
    this.initializeTestData();
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Validate credentials
      const validation = this.validateCredentials(credentials);
      if (!validation.valid) {
        return this.createError('VALIDATION_ERROR', 'Invalid credentials format', {
          errors: validation.errors
        });
      }

      // Find user by email
      const user = Array.from(this.users.values()).find(u => u.email === credentials.email);
      if (!user) {
        await this.recordRateLimitHit(credentials.email, 'signin');
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Verify password (mock verification)
      const passwordValid = this.verifyPassword(credentials.password, user.id);
      if (!passwordValid) {
        await this.recordRateLimitHit(credentials.email, 'signin');
        return this.createError('INVALID_CREDENTIALS', 'Invalid credentials');
      }

      // Check if user is disabled
      if (user.role === 'guest') {
        return this.createError('USER_DISABLED', 'Account is disabled');
      }

      // Create session
      const session = this.createSession(user.id);
      this.sessions.set(session.id, session);

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      this.users.set(user.id, user);

      await this.logAuthEvent({
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        success: true,
        metadata: { email: credentials.email }
      });

      return this.createAuthResult(true, {
        user,
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Authentication service unavailable');
    }
  }

  async signOut(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        this.sessions.delete(sessionId);
      } else {
        // Remove all sessions for user
        const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
        userSessions.forEach(session => this.sessions.delete(session.id));
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
      const session = Array.from(this.sessions.values()).find(s => s.token === token);
      if (!session) {
        throw new Error('Invalid token');
      }

      // Check if session is expired
      if (this.isExpired(session.expiresAt)) {
        this.sessions.delete(session.id);
        throw new Error('Session expired');
      }

      // Update last access time
      session.lastAccessAt = new Date().toISOString();
      this.sessions.set(session.id, session);

      const user = this.users.get(session.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      throw new Error('Token validation failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
      if (!session) {
        return this.createError('TOKEN_EXPIRED', 'Invalid refresh token');
      }

      // Check if refresh token is expired (longer expiry than access token)
      const refreshExpiry = new Date(session.createdAt);
      refreshExpiry.setDate(refreshExpiry.getDate() + 30); // 30 days
      if (new Date() > refreshExpiry) {
        this.sessions.delete(session.id);
        return this.createError('TOKEN_EXPIRED', 'Refresh token expired');
      }

      // Create new session
      const newSession = this.createSession(session.userId);
      this.sessions.delete(session.id);
      this.sessions.set(newSession.id, newSession);

      const user = this.users.get(newSession.userId);
      if (!user) {
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      return this.createAuthResult(true, {
        user,
        token: newSession.token,
        refreshToken: newSession.refreshToken,
        expiresAt: newSession.expiresAt
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

      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        // Don't reveal if user exists or not
        return true;
      }

      const token = this.generateSecureToken(32);
      const expiresAt = this.calculateExpiry(60); // 1 hour

      this.passwordResetTokens.set(token, { email, expiresAt });

      await this.logAuthEvent({
        userId: user.id,
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

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const resetData = this.passwordResetTokens.get(token);
      if (!resetData) {
        return this.createError('INVALID_TOKEN', 'Invalid or expired reset token');
      }

      if (this.isExpired(resetData.expiresAt)) {
        this.passwordResetTokens.delete(token);
        return this.createError('TOKEN_EXPIRED', 'Reset token expired');
      }

      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return this.createError('PASSWORD_TOO_WEAK', 'Password does not meet security requirements', {
          errors: passwordValidation.errors
        });
      }

      const user = Array.from(this.users.values()).find(u => u.email === resetData.email);
      if (!user) {
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Update password (mock update)
      user.updatedAt = new Date().toISOString();
      this.users.set(user.id, user);

      // Clean up reset token
      this.passwordResetTokens.delete(token);

      // Revoke all sessions
      await this.revokeAllSessions(user.id);

      await this.logAuthEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_CONFIRM',
        resource: 'auth',
        success: true
      });

      return this.createAuthResult(true, { user });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Password reset service unavailable');
    }
  }

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthResult> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      const sanitizedMetadata = this.sanitizeMetadata(updates.metadata || {});

      // Update user
      const updatedUser: AuthUser = {
        ...user,
        ...updates,
        metadata: { ...user.metadata, ...sanitizedMetadata },
        updatedAt: new Date().toISOString()
      };

      this.users.set(userId, updatedUser);

      await this.logAuthEvent({
        userId,
        action: 'PROFILE_UPDATE',
        resource: 'auth',
        success: true,
        metadata: { updates }
      });

      return this.createAuthResult(true, { user: updatedUser });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Profile update service unavailable');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Verify current password (mock verification)
      const currentPasswordValid = this.verifyPassword(currentPassword, user.id);
      if (!currentPasswordValid) {
        return this.createError('PASSWORD_MISMATCH', 'Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return this.createError('PASSWORD_TOO_WEAK', 'New password does not meet security requirements', {
          errors: passwordValidation.errors
        });
      }

      // Update password (mock update)
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);

      // Revoke all sessions (force re-login)
      await this.revokeAllSessions(userId);

      await this.logAuthEvent({
        userId,
        action: 'PASSWORD_CHANGE',
        resource: 'auth',
        success: true
      });

      return this.createAuthResult(true, { user });

    } catch (error) {
      return this.createError('PROVIDER_ERROR', 'Password change service unavailable');
    }
  }

  async userExists(email: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return !!user;
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    return this.users.get(userId) || null;
  }

  async getUserSessions(userId: string): Promise<AuthSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.userId === userId) {
      this.sessions.delete(sessionId);
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    userSessions.forEach(session => this.sessions.delete(session.id));
  }

  async healthCheck(): Promise<boolean> {
    return true; // Mock provider is always healthy
  }

  // Helper methods
  private createSession(userId: string): AuthSession {
    const sessionId = this.generateSessionId();
    const token = this.generateSecureToken(64);
    const refreshToken = this.generateSecureToken(64);

    return {
      id: sessionId,
      userId,
      token,
      refreshToken,
      expiresAt: this.calculateExpiry(this.sessionConfig.absoluteTimeout),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
      metadata: {}
    };
  }

  private initializeTestData(): void {
    // Create test users
    const testUsers: AuthUser[] = [
      {
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
        organizationId: 'org-1',
        metadata: { department: 'IT' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        emailVerified: true,
        phoneVerified: false
      },
      {
        id: 'user-2',
        email: 'manager@test.com',
        name: 'Test Manager',
        role: 'manager',
        organizationId: 'org-1',
        metadata: { department: 'Operations' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        emailVerified: true,
        phoneVerified: false
      },
      {
        id: 'user-3',
        email: 'worker@test.com',
        name: 'Test Worker',
        role: 'worker',
        organizationId: 'org-1',
        metadata: { department: 'Field' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        emailVerified: true,
        phoneVerified: true,
        phone: '+61412345678'
      }
    ];

    testUsers.forEach(user => this.users.set(user.id, user));
  }

  // Utility methods for testing
  public addUser(user: AuthUser): void {
    this.users.set(user.id, user);
  }

  public clearUsers(): void {
    this.users.clear();
  }

  public clearSessions(): void {
    this.sessions.clear();
  }

  public getUserCount(): number {
    return this.users.size;
  }

  public getSessionCount(): number {
    return this.sessions.size;
  }
}
