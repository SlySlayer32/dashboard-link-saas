/**
 * Token Manager Service
 * 
 * High-level token management service with provider switching
 * Provides unified interface for token operations regardless of provider
 */

import type {
    TokenConfig,
    TokenEvent,
    TokenEventHandler,
    TokenGenerationOptions,
    TokenManager,
    TokenProvider,
    TokenResult,
    TokenStats,
    TokenValidation
} from '@dashboard-link/shared';
import { DatabaseTokenProvider } from './providers/DatabaseTokenProvider';
import { JWTTokenProvider } from './providers/JWTTokenProvider';

export class TokenManagerService implements TokenManager {
  private provider: TokenProvider;
  private config: TokenConfig;
  private eventHandlers: TokenEventHandler[] = [];

  constructor(config: TokenConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  // Core token operations
  async generateToken(userId: string, options?: TokenGenerationOptions): Promise<TokenResult> {
    try {
      const payload = this.createTokenPayload(userId, options);
      const result = await this.provider.generate(payload);

      // Emit event
      await this.emitEvent({
        type: 'generated',
        userId,
        organizationId: options?.organizationId,
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType(), options }
      });

      return result;

    } catch (error) {
      throw new Error(`Token generation failed: ${this.formatError(error)}`);
    }
  }

  async validateToken(token: string): Promise<TokenValidation> {
    try {
      const result = await this.provider.validate(token);

      // Emit event
      if (result.valid && result.payload) {
        await this.emitEvent({
          type: 'validated',
          userId: result.payload.userId,
          organizationId: result.payload.organizationId,
          timestamp: new Date(),
          metadata: { tokenType: this.provider.getType() }
        });
      }

      return result;

    } catch (error) {
      throw new Error(`Token validation failed: ${this.formatError(error)}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    try {
      const result = await this.provider.refresh(refreshToken);

      // Emit event
      await this.emitEvent({
        type: 'refreshed',
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType() }
      });

      return result;

    } catch (error) {
      throw new Error(`Token refresh failed: ${this.formatError(error)}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await this.provider.revoke(token);

      // Emit event
      await this.emitEvent({
        type: 'revoked',
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType() }
      });

    } catch (error) {
      throw new Error(`Token revocation failed: ${this.formatError(error)}`);
    }
  }

  async revokeUserTokens(userId: string): Promise<void> {
    try {
      if ('revokeUserTokens' in this.provider) {
        await (this.provider as any).revokeUserTokens(userId);
      } else {
        throw new Error('Current provider does not support bulk user token revocation');
      }

      // Emit event
      await this.emitEvent({
        type: 'revoked',
        userId,
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType(), scope: 'user' }
      });

    } catch (error) {
      throw new Error(`User token revocation failed: ${this.formatError(error)}`);
    }
  }

  async revokeOrganizationTokens(organizationId: string): Promise<void> {
    try {
      if ('revokeOrganizationTokens' in this.provider) {
        await (this.provider as any).revokeOrganizationTokens(organizationId);
      } else {
        throw new Error('Current provider does not support bulk organization token revocation');
      }

      // Emit event
      await this.emitEvent({
        type: 'revoked',
        organizationId,
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType(), scope: 'organization' }
      });

    } catch (error) {
      throw new Error(`Organization token revocation failed: ${this.formatError(error)}`);
    }
  }

  async getUserTokens(userId: string): Promise<TokenResult[]> {
    try {
      // This would need to be implemented based on provider capabilities
      // For now, return empty array as placeholder
      return [];

    } catch (error) {
      throw new Error(`Failed to get user tokens: ${this.formatError(error)}`);
    }
  }

  async getTokenStats(organizationId?: string): Promise<TokenStats> {
    try {
      if ('getStats' in this.provider) {
        const stats = await (this.provider as any).getStats();
        return {
          ...stats,
          providerType: this.provider.getType()
        };
      } else {
        // Return default stats for providers that don't support statistics
        return {
          total: 0,
          active: 0,
          expired: 0,
          revoked: 0,
          providerType: this.provider.getType()
        };
      }

    } catch (error) {
      throw new Error(`Failed to get token stats: ${this.formatError(error)}`);
    }
  }

  async cleanup(): Promise<number> {
    try {
      const result = await this.provider.cleanup();

      // Emit event
      await this.emitEvent({
        type: 'cleaned',
        timestamp: new Date(),
        metadata: { tokenType: this.provider.getType(), cleanupCount: result }
      });

      return result;

    } catch (error) {
      throw new Error(`Token cleanup failed: ${this.formatError(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch {
      return false;
    }
  }

  // Provider management
  switchProvider(config: TokenConfig): void {
    try {
      const newProvider = this.createProvider(config);
      
      // Perform health check on new provider
      newProvider.healthCheck().then(healthy => {
        if (!healthy) {
          throw new Error('New provider failed health check');
        }
      });

      this.provider = newProvider;
      this.config = config;

      // Emit event
      this.emitEvent({
        type: 'generated', // Using generated as a generic event type
        timestamp: new Date(),
        metadata: { 
          action: 'provider_switched', 
          oldProvider: this.provider.getType(),
          newProvider: config.provider 
        }
      }).catch(console.error);

    } catch (error) {
      throw new Error(`Provider switch failed: ${this.formatError(error)}`);
    }
  }

  getCurrentProvider(): TokenProvider {
    return this.provider;
  }

  getCurrentProviderType(): 'jwt' | 'database' {
    return this.provider.getType();
  }

  getConfig(): TokenConfig {
    return { ...this.config };
  }

  // Event handling
  addEventHandler(handler: TokenEventHandler): void {
    this.eventHandlers.push(handler);
    
    // Also add to provider if it supports event handlers
    if ('addEventHandler' in this.provider) {
      (this.provider as any).addEventHandler(handler);
    }
  }

  removeEventHandler(handler: TokenEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }

    // Also remove from provider if it supports event handlers
    if ('removeEventHandler' in this.provider) {
      (this.provider as any).removeEventHandler(handler);
    }
  }

  // Advanced operations
  async migrateTokens(fromProvider: TokenProvider, toProvider: TokenProvider): Promise<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // This is a complex operation that would need to be carefully implemented
      // based on the specific providers and their capabilities
      
      // For now, return placeholder result
      return {
        success: true,
        migratedCount: 0,
        errors: []
      };

    } catch (error) {
      errors.push(this.formatError(error));
      return {
        success: false,
        migratedCount,
        errors
      };
    }
  }

  // Token validation utilities
  async validateAndExtract(token: string): Promise<{
    valid: boolean;
    userId?: string;
    organizationId?: string;
    role?: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      const validation = await this.validateToken(token);

      if (validation.valid && validation.payload) {
        return {
          valid: true,
          userId: validation.payload.userId,
          organizationId: validation.payload.organizationId,
          role: validation.payload.role,
          permissions: validation.payload.permissions
        };
      } else {
        return {
          valid: false,
          error: validation.error || 'Token validation failed'
        };
      }

    } catch (error) {
      return {
        valid: false,
        error: this.formatError(error)
      };
    }
  }

  // Token generation with enhanced options
  async generateWorkerToken(
    workerId: string,
    organizationId: string,
    options?: {
      expiresIn?: number;
      permissions?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<TokenResult & { dashboardUrl?: string }> {
    const tokenOptions: TokenGenerationOptions = {
      organizationId,
      role: 'worker',
      permissions: options?.permissions || ['worker:access'],
      metadata: {
        ...options?.metadata,
        workerId,
        tokenType: 'worker'
      },
      expiresIn: options?.expiresIn || 24 * 60 * 60, // 24 hours default
      includeRefresh: false // Worker tokens typically don't need refresh
    };

    const result = await this.generateToken(workerId, tokenOptions);

    // Generate dashboard URL for worker tokens
    const dashboardUrl = this.generateDashboardUrl(result.token);

    return {
      ...result,
      dashboardUrl
    };
  }

  async generateAdminToken(
    adminId: string,
    organizationId: string,
    options?: {
      expiresIn?: number;
      permissions?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<TokenResult> {
    const tokenOptions: TokenGenerationOptions = {
      organizationId,
      role: 'admin',
      permissions: options?.permissions || ['admin:access'],
      metadata: {
        ...options?.metadata,
        tokenType: 'admin'
      },
      expiresIn: options?.expiresIn || 8 * 60 * 60, // 8 hours default
      includeRefresh: true
    };

    return await this.generateToken(adminId, tokenOptions);
  }

  // Utility methods
  private createProvider(config: TokenConfig): TokenProvider {
    switch (config.provider) {
      case 'jwt':
        if (!config.jwtSecret) {
          throw new Error('JWT secret is required for JWT provider');
        }
        return new JWTTokenProvider(config as any);

      case 'database':
        return new DatabaseTokenProvider(config as any);

      default:
        throw new Error(`Unsupported token provider: ${config.provider}`);
    }
  }

  private createTokenPayload(userId: string, options?: TokenGenerationOptions): any {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = options?.expiresIn || this.config.defaultExpiry || 3600;

    return {
      userId,
      organizationId: options?.organizationId,
      sessionId: options?.sessionId,
      role: options?.role,
      permissions: options?.permissions,
      metadata: options?.metadata,
      issuedAt: now,
      expiresAt: now + expiresIn
    };
  }

  private generateDashboardUrl(token: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:5174';
    return `${baseUrl}/dashboard/${token}`;
  }

  private async emitEvent(event: TokenEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error('Error in token event handler:', error);
      }
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Provider factory methods
  static createJWTManager(config: {
    jwtSecret: string;
    algorithm?: string;
    issuer?: string;
    audience?: string;
    defaultExpiry?: number;
    refreshExpiry?: number;
  }): TokenManagerService {
    const jwtConfig: TokenConfig = {
      provider: 'jwt',
      jwtSecret: config.jwtSecret,
      algorithm: config.algorithm || 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      defaultExpiry: config.defaultExpiry || 3600,
      refreshExpiry: config.refreshExpiry || 30 * 24 * 60 * 60
    };

    return new TokenManagerService(jwtConfig);
  }

  static createDatabaseManager(config: {
    tableName?: string;
    hashTokens?: boolean;
    cleanupExpired?: boolean;
    defaultExpiry?: number;
    refreshExpiry?: number;
  }): TokenManagerService {
    const dbConfig: TokenConfig = {
      provider: 'database',
      tableName: config.tableName || 'tokens',
      hashTokens: config.hashTokens !== false,
      cleanupExpired: config.cleanupExpired !== false,
      defaultExpiry: config.defaultExpiry || 3600,
      refreshExpiry: config.refreshExpiry || 30 * 24 * 60 * 60
    };

    return new TokenManagerService(dbConfig);
  }

  // Configuration validation
  static validateConfig(config: TokenConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    }

    if (config.provider === 'jwt' && !config.jwtSecret) {
      errors.push('JWT secret is required for JWT provider');
    }

    if (config.defaultExpiry && config.defaultExpiry < 60) {
      errors.push('Default expiry must be at least 60 seconds');
    }

    if (config.refreshExpiry && config.refreshExpiry < 300) {
      errors.push('Refresh expiry must be at least 300 seconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
