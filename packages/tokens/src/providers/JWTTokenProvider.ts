/**
 * JWT Token Provider
 * 
 * Stateless JWT token provider implementation
 * Provides fast token validation without database queries
 */

import type {
    JWTProviderConfig,
    TokenPayload,
    TokenProviderCapabilities,
    TokenResult,
    TokenValidation
} from '@dashboard-link/shared';
import crypto from 'crypto';
import jwt, { Algorithm } from 'jsonwebtoken';
import { BaseTokenProvider } from './BaseTokenProvider';

export class JWTTokenProvider extends BaseTokenProvider {
  private jwtConfig: JWTProviderConfig;
  private blacklistedTokens = new Set<string>();
  private refreshTokens = new Map<string, { payload: TokenPayload; expiresAt: number }>();

  constructor(config: JWTProviderConfig) {
    super(config);
    this.jwtConfig = config;
    
    if (!config.jwtSecret) {
      throw new Error('JWT secret is required for JWT token provider');
    }

    // Start cleanup interval
    if (config.cleanupInterval) {
      setInterval(() => this.cleanup(), config.cleanupInterval * 1000);
    }
  }

  async generate(payload: TokenPayload): Promise<TokenResult> {
    try {
      // Validate payload
      if (!this.validateSecurity(payload)) {
        throw new Error('Payload security validation failed');
      }

      // Sanitize metadata
      const sanitizedPayload = {
        ...payload,
        metadata: this.sanitizeMetadata(payload.metadata)
      };

      // Generate access token
      const accessToken = jwt.sign(
        sanitizedPayload,
        this.jwtConfig.jwtSecret,
        {
          algorithm: (this.jwtConfig.algorithm as Algorithm) || 'HS256',
          expiresIn: this.config.defaultExpiry,
          issuer: this.jwtConfig.issuer,
          audience: this.jwtConfig.audience,
          jwtid: crypto.randomUUID()
        }
      );

      // Generate refresh token if needed
      let refreshToken: string | undefined;
      if (this.config.refreshExpiry && this.config.refreshExpiry > 0) {
        refreshToken = this.generateRefreshToken(sanitizedPayload);
      }

      const result = this.createTokenResult(accessToken, payload, refreshToken);

      // Log audit
      await this.logAudit({
        action: 'generate',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: this.getTokenId(accessToken),
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'generated',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'jwt', hasRefresh: !!refreshToken }
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
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return this.createValidationResult(
          false,
          undefined,
          'Token has been revoked',
          'REVOKED'
        );
      }

      // Verify JWT signature and claims
      const decoded = jwt.verify(token, this.jwtConfig.jwtSecret, {
        algorithms: [(this.jwtConfig.algorithm as Algorithm) || 'HS256'],
        issuer: this.jwtConfig.issuer,
        audience: this.jwtConfig.audience,
        clockTolerance: this.jwtConfig.clockTolerance || 0,
        ignoreExpiration: this.jwtConfig.ignoreExpiration || false,
        ignoreNotBefore: this.jwtConfig.ignoreNotBefore || false
      }) as any;

      // Validate payload structure
      const payload = this.validatePayloadStructure(decoded);
      if (!payload) {
        return this.createValidationResult(
          false,
          undefined,
          'Invalid token payload structure',
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

      // Log audit
      await this.logAudit({
        action: 'validate',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: this.getTokenId(token),
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'validated',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'jwt' }
      });

      return this.createValidationResult(true, payload);

    } catch (error) {
      let errorCode: 'EXPIRED' | 'INVALID' | 'REVOKED' = 'INVALID';
      let errorMessage = this.formatError(error);

      if (error instanceof jwt.TokenExpiredError) {
        errorCode = 'EXPIRED';
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorCode = 'INVALID';
        errorMessage = 'Invalid token signature or format';
      }

      // Log audit
      await this.logAudit({
        action: 'validate',
        tokenId: this.getTokenId(token),
        success: false,
        error: errorMessage
      });

      return this.createValidationResult(false, undefined, errorMessage, errorCode);
    }
  }

  async refresh(refreshToken: string): Promise<TokenResult> {
    try {
      // Find refresh token
      const storedRefresh = this.refreshTokens.get(refreshToken);
      if (!storedRefresh) {
        throw new Error('Refresh token not found or expired');
      }

      const { payload, expiresAt } = storedRefresh;

      // Check if refresh token is expired
      if (Date.now() > expiresAt) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Refresh token has expired');
      }

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
      const newRefreshToken = this.generateRefreshToken(newPayload);
      result.refreshToken = newRefreshToken;

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      // Log audit
      await this.logAudit({
        action: 'refresh',
        userId: payload.userId,
        organizationId: payload.organizationId,
        tokenId: this.getTokenId(result.token),
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'refreshed',
        userId: payload.userId,
        organizationId: payload.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: 'jwt' }
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
      // Add token to blacklist
      this.blacklistedTokens.add(token);

      // Log audit
      await this.logAudit({
        action: 'revoke',
        tokenId: this.getTokenId(token),
        success: true
      });

      // Emit event
      await this.emitEvent({
        type: 'revoked',
        tokenId: this.getTokenId(token),
        timestamp: new Date(),
        metadata: { tokenType: 'jwt' }
      });

    } catch (error) {
      await this.logAudit({
        action: 'revoke',
        tokenId: this.getTokenId(token),
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
      const validation = await this.validate(token);
      return validation.payload?.metadata || null;
    } catch {
      return null;
    }
  }

  async cleanup(): Promise<number> {
    let cleanupCount = 0;

    // Clean up expired refresh tokens
    const now = Date.now();
    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        this.refreshTokens.delete(token);
        cleanupCount++;
      }
    }

    // Clean up old blacklisted tokens (keep last 1000)
    if (this.blacklistedTokens.size > 1000) {
      const tokens = Array.from(this.blacklistedTokens);
      const toKeep = tokens.slice(-1000);
      this.blacklistedTokens = new Set(toKeep);
      cleanupCount += tokens.length - toKeep.length;
    }

    // Clean up rate limiting
    this.cleanupRateLimit();

    // Emit cleanup event
    if (cleanupCount > 0) {
      await this.emitEvent({
        type: 'cleaned',
        timestamp: new Date(),
        metadata: { cleanupCount, tokenType: 'jwt' }
      });
    }

    return cleanupCount;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test JWT signing and verification
      const testPayload = this.createTokenPayload('test-user', { expiresIn: 60 });
      const token = jwt.sign(testPayload, this.jwtConfig.jwtSecret, {
        algorithm: (this.jwtConfig.algorithm as Algorithm) || 'HS256',
        expiresIn: '1h'
      });
      
      const decoded = jwt.verify(token, this.jwtConfig.jwtSecret, {
        algorithms: [(this.jwtConfig.algorithm as Algorithm) || 'HS256']
      });

      return !!decoded;
    } catch {
      return false;
    }
  }

  getType(): 'jwt' {
    return 'jwt';
  }

  getCapabilities(): TokenProviderCapabilities {
    return {
      supportsRefresh: true,
      supportsMetadata: true,
      supportsBulkRevocation: false, // JWT tokens are stateless
      supportsStatistics: false, // No central tracking
      supportsCleanup: true,
      isStateless: true,
      maxTokenSize: 4096, // Typical JWT size limit
      supportedAlgorithms: ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']
    };
  }

  // JWT-specific methods
  private generateRefreshToken(payload: TokenPayload): string {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (this.config.refreshExpiry || 30 * 24 * 60 * 60) * 1000;
    
    this.refreshTokens.set(refreshToken, { payload, expiresAt });
    return refreshToken;
  }

  private getTokenId(token: string): string {
    try {
      const decoded = jwt.decode(token, { complete: true }) as any;
      return decoded?.header?.kid || decoded?.jti || crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    } catch {
      return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
    }
  }

  // Bulk operations
  async revokeUserTokens(userId: string): Promise<number> {
    let revokedCount = 0;
    
    // Note: For JWT tokens, we can't directly revoke all tokens for a user
    // since they're stateless. In a real implementation, this would require
    // maintaining a user-specific blacklist or using short token expiry times.
    
    // For now, we'll clean up refresh tokens for this user
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.payload.userId === userId) {
        this.refreshTokens.delete(token);
        revokedCount++;
      }
    }

    return revokedCount;
  }

  async revokeOrganizationTokens(organizationId: string): Promise<number> {
    let revokedCount = 0;
    
    // Clean up refresh tokens for this organization
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.payload.organizationId === organizationId) {
        this.refreshTokens.delete(token);
        revokedCount++;
      }
    }

    return revokedCount;
  }

  // Statistics
  async getStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    lastCleanup?: Date;
  }> {
    const now = Date.now();
    let activeRefreshTokens = 0;
    let expiredRefreshTokens = 0;

    for (const data of this.refreshTokens.values()) {
      if (now > data.expiresAt) {
        expiredRefreshTokens++;
      } else {
        activeRefreshTokens++;
      }
    }

    return {
      totalTokens: this.refreshTokens.size + this.blacklistedTokens.size,
      activeTokens: activeRefreshTokens,
      expiredTokens: expiredRefreshTokens,
      revokedTokens: this.blacklistedTokens.size,
      lastCleanup: new Date() // We clean up regularly
    };
  }

  // Configuration helpers
  updateJWTSecret(newSecret: string): void {
    if (!newSecret) {
      throw new Error('JWT secret cannot be empty');
    }
    
    this.jwtConfig.jwtSecret = newSecret;
    
    // Revoke all existing tokens since secret changed
    this.blacklistedTokens.clear();
    this.refreshTokens.clear();
  }

  // Export/import for migration
  exportRefreshTokens(): Array<{ token: string; payload: TokenPayload; expiresAt: number }> {
    const result: Array<{ token: string; payload: TokenPayload; expiresAt: number }> = [];
    
    for (const [token, data] of this.refreshTokens.entries()) {
      result.push({
        token,
        payload: data.payload,
        expiresAt: data.expiresAt
      });
    }
    
    return result;
  }

  importRefreshTokens(tokens: Array<{ token: string; payload: TokenPayload; expiresAt: number }>): void {
    for (const { token, payload, expiresAt } of tokens) {
      if (expiresAt > Date.now()) {
        this.refreshTokens.set(token, { payload, expiresAt });
      }
    }
  }
}
