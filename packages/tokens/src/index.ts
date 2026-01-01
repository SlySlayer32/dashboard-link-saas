/**
 * Token Package Index
 * 
 * Main entry point for the token package
 * Exports all token-related functionality
 */

// Core types and interfaces
export type {
    DatabaseProviderConfig, JWTProviderConfig, TokenAuditLog, TokenBlacklist, TokenCache, TokenConfig, TokenError, TokenEvent,
    TokenEventHandler, TokenExtractor, TokenGenerationOptions, TokenGenerator, TokenManager, TokenMiddlewareOptions, TokenMigration,
    TokenMigrationResult, TokenPayload, TokenProvider, TokenProviderCapabilities, TokenProviderFactory, TokenProviderMap, TokenProviderName, TokenRateLimit,
    TokenRateLimitResult, TokenRegistry, TokenResult, TokenSecurityConfig, TokenStats, TokenStorageOptions, TokenValidation, TokenValidator
} from '@dashboard-link/shared';

// Worker-specific token types
export type {
    WorkerTokenPayload,
    WorkerTokenResult,
    WorkerTokenValidation
} from '@dashboard-link/shared';

// Import types for use in this file
import type {
    TokenConfig,
    TokenGenerationOptions,
    TokenResult,
    TokenValidation,
    TokenStats,
    JWTProviderConfig,
    DatabaseProviderConfig
} from '@dashboard-link/shared';

// Base provider
export { BaseTokenProvider } from './providers/BaseTokenProvider';

// Concrete providers
export { DatabaseTokenProvider } from './providers/DatabaseTokenProvider';
export { JWTTokenProvider } from './providers/JWTTokenProvider';

// Token manager
export { TokenManagerService } from './TokenManager';

// Import TokenManagerService for use in utility functions
import { TokenManagerService } from './TokenManager';

// Registry
export {
    TokenRegistryImpl, clearTokenProviders, createDatabaseProvider, createJWTProvider, createProviderFromEnvironment, createTokenProvider, getTokenProvider, hasTokenProvider, listTokenProviders, registerTokenProvider, tokenRegistry, unregisterTokenProvider
} from './registry/TokenRegistry';

// Import tokenRegistry for use in utility functions
import { tokenRegistry } from './registry/TokenRegistry';

// Utility functions
export function createTokenManager(config: TokenConfig): TokenManagerService {
  return new TokenManagerService(config);
}

export function createJWTTokenManager(config: {
  jwtSecret: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
  defaultExpiry?: number;
  refreshExpiry?: number;
}): TokenManagerService {
  return TokenManagerService.createJWTManager(config);
}

export function createDatabaseTokenManager(config: {
  tableName?: string;
  hashTokens?: boolean;
  cleanupExpired?: boolean;
  defaultExpiry?: number;
  refreshExpiry?: number;
}): TokenManagerService {
  return TokenManagerService.createDatabaseManager(config);
}

// Configuration helpers
export function validateTokenConfig(config: TokenConfig): {
  valid: boolean;
  errors: string[];
} {
  return TokenManagerService.validateConfig(config);
}

// Provider comparison
export async function compareTokenProviders(
  provider1Name: string,
  provider2Name: string
): Promise<{
  provider1: {
    name: string;
    type: string;
    capabilities: any;
    healthy: boolean;
  };
  provider2: {
    name: string;
    type: string;
    capabilities: any;
    healthy: boolean;
  };
  compatible: boolean;
  migrationComplexity: 'low' | 'medium' | 'high';
}> {
  return tokenRegistry.compareProviders(provider1Name, provider2Name);
}

// Health check utilities
export async function getTokenSystemHealth(): Promise<{
  healthy: boolean;
  registry: any;
  providers: any[];
}> {
  const registryHealth = await tokenRegistry.healthCheck();
  
  return {
    healthy: registryHealth.healthy,
    registry: registryHealth,
    providers: await tokenRegistry.getProviderStats()
  };
}

// Cleanup utilities
export async function performTokenSystemCleanup(): Promise<{
  cleanupCount: number;
  providers: Array<{
    name: string;
    cleanupCount: number;
  }>;
}> {
  return tokenRegistry.cleanup();
}

// Default configurations
export const DEFAULT_JWT_CONFIG: Partial<JWTProviderConfig> = {
  algorithm: 'HS256',
  defaultExpiry: 3600, // 1 hour
  refreshExpiry: 30 * 24 * 60 * 60, // 30 days
  cleanupInterval: 3600 // 1 hour
};

export const DEFAULT_DATABASE_CONFIG: Partial<DatabaseProviderConfig> = {
  tableName: 'tokens',
  hashTokens: true,
  cleanupExpired: true,
  defaultExpiry: 3600, // 1 hour
  refreshExpiry: 30 * 24 * 60 * 60, // 30 days
  cleanupInterval: 3600 // 1 hour
};

// Environment-based configuration
export function getTokenConfigFromEnvironment(): TokenConfig {
  const providerType = process.env.TOKEN_PROVIDER || 'jwt';

  switch (providerType) {
    case 'jwt':
      return {
        provider: 'jwt',
        jwtSecret: process.env.JWT_SECRET || 'default-secret',
        algorithm: (process.env.JWT_ALGORITHM as any) || 'HS256',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        defaultExpiry: parseInt(process.env.TOKEN_DEFAULT_EXPIRY || '3600'),
        refreshExpiry: parseInt(process.env.TOKEN_REFRESH_EXPIRY || '2592000'),
        cleanupInterval: parseInt(process.env.TOKEN_CLEANUP_INTERVAL || '3600')
      };

    case 'database':
      return {
        provider: 'database',
        databaseConfig: {
          tableName: process.env.TOKEN_TABLE_NAME || 'tokens',
          hashTokens: process.env.TOKEN_HASH !== 'false',
          cleanupExpired: process.env.TOKEN_CLEANUP !== 'false'
        },
        defaultExpiry: parseInt(process.env.TOKEN_DEFAULT_EXPIRY || '3600'),
        refreshExpiry: parseInt(process.env.TOKEN_REFRESH_EXPIRY || '2592000'),
        cleanupInterval: parseInt(process.env.TOKEN_CLEANUP_INTERVAL || '3600')
      };

    default:
      throw new Error(`Unsupported token provider: ${providerType}`);
  }
}

// Legacy exports for backward compatibility
export class TokenService {
  private static manager: TokenManagerService;

  static initialize(config?: TokenConfig): void {
    const tokenConfig = config || getTokenConfigFromEnvironment();
    this.manager = new TokenManagerService(tokenConfig);
  }

  static getManager(): TokenManagerService {
    if (!this.manager) {
      this.initialize();
    }
    return this.manager;
  }

  static async generateToken(userId: string, options?: TokenGenerationOptions): Promise<TokenResult> {
    return this.getManager().generateToken(userId, options);
  }

  static async validateToken(token: string): Promise<TokenValidation> {
    return this.getManager().validateToken(token);
  }

  static async refreshToken(refreshToken: string): Promise<TokenResult> {
    return this.getManager().refreshToken(refreshToken);
  }

  static async revokeToken(token: string): Promise<void> {
    return this.getManager().revokeToken(token);
  }

  static async revokeUserTokens(userId: string): Promise<void> {
    return this.getManager().revokeUserTokens(userId);
  }

  static async revokeOrganizationTokens(organizationId: string): Promise<void> {
    return this.getManager().revokeOrganizationTokens(organizationId);
  }

  static async getTokenStats(organizationId?: string): Promise<TokenStats> {
    return this.getManager().getTokenStats(organizationId);
  }

  static async cleanup(): Promise<number> {
    return this.getManager().cleanup();
  }

  static async healthCheck(): Promise<boolean> {
    return this.getManager().healthCheck();
  }
}

// Auto-initialize with environment config if not already initialized
if (!TokenService['manager']) {
  TokenService.initialize();
}
