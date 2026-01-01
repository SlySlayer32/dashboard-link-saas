/**
 * Database Token Provider
 * 
 * Database-backed token provider implementation
 * Provides persistent token storage and management
 */

import type {
    DatabaseProviderConfig,
    TokenPayload,
    TokenProviderCapabilities,
    TokenResult,
    TokenValidation
} from '@dashboard-link/shared';
import crypto from 'crypto';
import { BaseTokenProvider } from './BaseTokenProvider';

interface DatabaseTokenRecord {
  id: string;
  token_hash: string;
  user_id: string;
  organization_id?: string;
  session_id?: string;
  payload: string; // JSON string
  expires_at: Date;
  created_at: Date;
  last_used_at?: Date;
  revoked: boolean;
  revoked_at?: Date;
  revoked_by?: string;
  metadata?: string; // JSON string
}

interface RefreshTokenRecord {
  id: string;
  token_hash: string;
  user_id: string;
  organization_id?: string;
  access_token_id: string;
  payload: string; // JSON string
  expires_at: Date;
  created_at: Date;
  used: boolean;
  used_at?: Date;
}

export class DatabaseTokenProvider extends BaseTokenProvider {
  // private tableName: string; // Not used yet

  constructor(_config: DatabaseProviderConfig) {
    super(_config);
    // this.tableName = _config.tableName || 'tokens'; // Not used yet
    // this._refreshTableName = `${this.tableName}_refresh`; // Not used yet
    
    // Start cleanup interval
    if (_config.cleanupInterval) {
      setInterval(() => this.cleanup(), _config.cleanupInterval * 1000);
    }
  }

  async generate(payload: TokenPayload): Promise<TokenResult> {
    try {
      // Validate payload
      if (!this.validateSecurity(payload)) {
        throw new Error('Payload security validation failed');
      }

      // Generate secure token
      const token = this.generateSecureToken();
      const tokenHash = this.hashToken(token);

      // Sanitize metadata
      const sanitizedPayload = {
        ...payload,
        metadata: this.sanitizeMetadata(payload.metadata)
      };

      // Store token in database
      const tokenRecord = await this.insertTokenRecord({
        token_hash: tokenHash,
        user_id: payload.userId,
        organization_id: payload.organizationId,
        session_id: payload.sessionId,
        payload: JSON.stringify(sanitizedPayload),
        expires_at: new Date(payload.expiresAt * 1000),
        created_at: new Date(),
        revoked: false,
        metadata: sanitizedPayload.metadata ? JSON.stringify(sanitizedPayload.metadata) : undefined
      });

      // Generate refresh token if needed
      let refreshToken: string | undefined;
      if (this.config.refreshExpiry && this.config.refreshExpiry > 0) {
        refreshToken = await this.generateRefreshToken(sanitizedPayload, tokenRecord.id);
      }

      const result = this.createTokenResult(token, payload, refreshToken);

      // Log audit
      await this.logAudit({
        action: 'generate',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: tokenRecord.id,
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'generated',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'database', hasRefresh: !!refreshToken }
      });

      return result;

    } catch (error) {
      await this.logAudit({
        action: 'generate',
        userId: payload.userId,
        organizationId: payload.organizationId,
        success: false,
        error: this.formatError(error)
      });

      throw error;
    }
  }

  async validate(token: string): Promise<TokenValidation> {
    try {
      const tokenHash = this.hashToken(token);

      // Find token in database
      const tokenRecord = await this.findTokenRecord(tokenHash);
      if (!tokenRecord) {
        return this.createValidationResult(
          false,
          undefined,
          'Token not found',
          'NOT_FOUND'
        );
      }

      // Check if token is revoked
      if (tokenRecord.revoked) {
        return this.createValidationResult(
          false,
          undefined,
          'Token has been revoked',
          'REVOKED'
        );
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        return this.createValidationResult(
          false,
          undefined,
          'Token has expired',
          'EXPIRED'
        );
      }

      // Parse payload
      let payload: TokenPayload;
      try {
        payload = JSON.parse(tokenRecord.payload) as TokenPayload;
      } catch {
        return this.createValidationResult(
          false,
          undefined,
          'Invalid token payload',
          'INVALID'
        );
      }

      // Additional security validation
      if (!this.validateSecurity(payload)) {
        return this.createValidationResult(
          false,
          undefined,
          'Token security validation failed',
          'INVALID'
        );
      }

      // Update last used timestamp
      await this.updateLastUsed(tokenRecord.id);

      // Log audit
      await this.logAudit({
        action: 'validate',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: tokenRecord.id,
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'validated',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'database' }
      });

      return this.createValidationResult(true, payload);

    } catch (error) {
      await this.logAudit({
        action: 'validate',
        success: false,
        error: this.formatError(error)
      });

      return this.createValidationResult(
        false,
        undefined,
        this.formatError(error),
        'INVALID'
      );
    }
  }

  async refresh(refreshToken: string): Promise<TokenResult> {
    try {
      const refreshTokenHash = this.hashToken(refreshToken);

      // Find refresh token in database
      const refreshRecord = await this.findRefreshTokenRecord(refreshTokenHash);
      if (!refreshRecord) {
        throw new Error('Refresh token not found');
      }

      // Check if refresh token is used or expired
      if (refreshRecord.used || new Date() > refreshRecord.expires_at) {
        throw new Error('Refresh token has been used or expired');
      }

      // Parse payload
      let payload: TokenPayload;
      try {
        payload = JSON.parse(refreshRecord.payload) as TokenPayload;
      } catch {
        throw new Error('Invalid refresh token payload');
      }

      // Mark refresh token as used
      await this.markRefreshTokenUsed(refreshRecord.id);

      // Create new payload with updated timestamps
      const newPayload = this.createTokenPayload(payload.userId, {
        organizationId: payload.organizationId,
        sessionId: payload.sessionId,
        role: payload.role,
        permissions: payload.permissions,
        metadata: payload.metadata
      });

      // Generate new access token
      const result = await this.generate(newPayload);

      // Generate new refresh token
      const newRefreshToken = await this.generateRefreshToken(newPayload, 'new-access-token-id');
      result.refreshToken = newRefreshToken;

      // Log audit
      await this.logAudit({
        action: 'refresh',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: refreshRecord.id,
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'refreshed',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'database' }
      });

      return result;

    } catch (error) {
      await this.logAudit({
        action: 'refresh',
        success: false,
        error: this.formatError(error)
      });

      throw error;
    }
  }

  async revoke(token: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);

      // Find and revoke token
      const tokenRecord = await this.findTokenRecord(tokenHash);
      if (!tokenRecord) {
        throw new Error('Token not found');
      }

      await this.revokeTokenRecord(tokenRecord.id);

      // Log audit
      await this.logAudit({
        action: 'revoke',
        tokenId: tokenRecord.id,
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'revoked',
        tokenId: tokenRecord.id,
        timestamp: new Date(),
        metadata: { tokenType: 'database' }
      });

    } catch (error) {
      await this.logAudit({
        action: 'revoke',
        success: false,
        error: this.formatError(error)
      });

      throw error;
    }
  }

  async exists(token: string): Promise<boolean> {
    try {
      const validation = await this.validate(token);
      return validation.valid;
    } catch {
      return false;
    }
  }

  async getMetadata(token: string): Promise<Record<string, unknown> | null> {
    try {
      const tokenHash = this.hashToken(token);
      const tokenRecord = await this.findTokenRecord(tokenHash);
      
      if (!tokenRecord || tokenRecord.revoked) {
        return null;
      }

      return tokenRecord.metadata ? (JSON.parse(tokenRecord.metadata) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  async cleanup(): Promise<number> {
    let cleanupCount = 0;

    try {
      // Clean up expired tokens
      cleanupCount += await this.cleanupExpiredTokens();

      // Clean up expired refresh tokens
      cleanupCount += await this.cleanupExpiredRefreshTokens();

      // Clean up old audit logs
      await this.cleanupAuditLogs();

      // Clean up rate limiting
      this.cleanupRateLimit();

      // Emit cleanup event
      if (cleanupCount > 0) {
        await this.emitEvent({
          type: 'cleaned',
          timestamp: new Date(),
          metadata: { cleanupCount, tokenType: 'database' }
        });
      }

    } catch (error) {
      console.error('Cleanup error:', error);
    }

    return cleanupCount;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test database connection with a simple query
      await this.testDatabaseConnection();
      return true;
    } catch {
      return false;
    }
  }

  getType(): 'database' {
    return 'database';
  }

  getCapabilities(): TokenProviderCapabilities {
    return {
      supportsRefresh: true,
      supportsMetadata: true,
      supportsBulkRevocation: true,
      supportsStatistics: true,
      supportsCleanup: true,
      isStateless: false,
      maxTokenSize: 2048, // Database column limit
      supportedAlgorithms: [] // Not applicable for database tokens
    };
  }

  // Bulk operations
  async revokeUserTokens(userId: string): Promise<number> {
    try {
      const revokedCount = await this.revokeUserTokensInDatabase(userId);

      // Log audit
      await this.logAudit({
        action: 'revoke',
        userId,
        success: true
      });

      return revokedCount;
    } catch (error) {
      await this.logAudit({
        action: 'revoke',
        userId,
        success: false,
        error: this.formatError(error)
      });

      throw error;
    }
  }

  async revokeOrganizationTokens(organizationId: string): Promise<number> {
    try {
      const revokedCount = await this.revokeOrganizationTokensInDatabase(organizationId);

      // Log audit
      await this.logAudit({
        action: 'revoke',
        organizationId,
        success: true
      });

      return revokedCount;
    } catch (error) {
      await this.logAudit({
        action: 'revoke',
        organizationId,
        success: false,
        error: this.formatError(error)
      });

      throw error;
    }
  }

  // Statistics
  async getStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    lastCleanup?: Date;
  }> {
    try {
      const stats = await this.getTokenStatsFromDatabase();
      return {
        ...stats,
        lastCleanup: new Date() // We clean up regularly
      };
    } catch {
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        revokedTokens: 0
      };
    }
  }

  // Database-specific methods (these would be implemented with actual database queries)
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async insertTokenRecord(record: Omit<DatabaseTokenRecord, 'id'>): Promise<DatabaseTokenRecord> {
    // This would be implemented with actual database insertion
    // For now, return a mock record
    return {
      id: this.generateId(),
      ...record
    } as DatabaseTokenRecord;
  }

  private async findTokenRecord(_tokenHash: string): Promise<DatabaseTokenRecord | null> {
    // This would be implemented with actual database query
    // For now, return null (mock implementation)
    return null;
  }

  private async findRefreshTokenRecord(_tokenHash: string): Promise<RefreshTokenRecord | null> {
    // This would be implemented with actual database query
    // For now, return null (mock implementation)
    return null;
  }

  private async updateLastUsed(_tokenId: string): Promise<void> {
    // This would be implemented with actual database update
  }

  private async revokeTokenRecord(_tokenId: string): Promise<void> {
    // This would be implemented with actual database update
  }

  private async markRefreshTokenUsed(_refreshTokenId: string): Promise<void> {
    // This would be implemented with actual database update
  }

  private async generateRefreshToken(payload: TokenPayload, accessTokenId: string): Promise<string> {
    const refreshToken = this.generateSecureToken();
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.insertRefreshTokenRecord({
      token_hash: refreshTokenHash,
      user_id: payload.userId,
      organization_id: payload.organizationId,
      access_token_id: accessTokenId,
      payload: JSON.stringify(payload),
      expires_at: new Date(Date.now() + (this.config.refreshExpiry || 30 * 24 * 60 * 60) * 1000),
      created_at: new Date(),
      used: false
    });

    return refreshToken;
  }

  private async insertRefreshTokenRecord(_record: Omit<RefreshTokenRecord, 'id'>): Promise<void> {
    // This would be implemented with actual database insertion
  }

  private async cleanupExpiredTokens(): Promise<number> {
    // This would be implemented with actual database query
    return 0;
  }

  private async cleanupExpiredRefreshTokens(): Promise<number> {
    // This would be implemented with actual database query
    return 0;
  }

  private async revokeUserTokensInDatabase(_userId: string): Promise<number> {
    // This would be implemented with actual database query
    return 0;
  }

  private async revokeOrganizationTokensInDatabase(_organizationId: string): Promise<number> {
    // This would be implemented with actual database query
    return 0;
  }

  private async getTokenStatsFromDatabase(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
  }> {
    // This would be implemented with actual database query
    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0
    };
  }

  private async testDatabaseConnection(): Promise<void> {
    // This would be implemented with actual database connection test
  }
}
