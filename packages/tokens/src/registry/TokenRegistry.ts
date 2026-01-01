/**
 * Token Provider Registry
 * 
 * Registry for managing token providers and factories
 * Provides dynamic provider creation and lifecycle management
 */

import type {
    TokenConfig,
    TokenProvider,
    TokenProviderFactory,
    TokenRegistry
} from '@dashboard-link/shared';
import { DatabaseTokenProvider } from './providers/DatabaseTokenProvider';
import { JWTTokenProvider } from './providers/JWTTokenProvider';

export class TokenRegistryImpl implements TokenRegistry {
  private providers = new Map<string, TokenProvider>();
  private factories = new Map<string, TokenProviderFactory>();

  constructor() {
    // Register built-in providers
    this.registerBuiltInProviders();
  }

  register(name: string, provider: TokenProvider): void {
    this.providers.set(name, provider);
  }

  unregister(name: string): void {
    this.providers.delete(name);
  }

  get(name: string): TokenProvider | undefined {
    return this.providers.get(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  clear(): void {
    this.providers.clear();
    this.factories.clear();
  }

  // Factory methods
  registerFactory(name: string, factory: TokenProviderFactory): void {
    this.factories.set(name, factory);
  }

  createProvider(name: string, config: TokenConfig): TokenProvider | undefined {
    const factory = this.factories.get(name);
    if (!factory) {
      return undefined;
    }
    return factory(config);
  }

  listFactories(): string[] {
    return Array.from(this.factories.keys());
  }

  hasFactory(name: string): boolean {
    return this.factories.has(name);
  }

  // Built-in provider factories
  private registerBuiltInProviders(): void {
    // JWT provider factory
    this.registerFactory('jwt', (config: TokenConfig) => {
      if (!config.jwtSecret) {
        throw new Error('JWT secret is required for JWT provider');
      }
      return new JWTTokenProvider(config as any);
    });

    // Database provider factory
    this.registerFactory('database', (config: TokenConfig) => {
      return new DatabaseTokenProvider(config as any);
    });
  }

  // Provider management utilities
  async switchProvider(
    currentName: string,
    newName: string,
    config: TokenConfig
  ): Promise<TokenProvider> {
    const currentProvider = this.get(currentName);
    if (!currentProvider) {
      throw new Error(`Current provider '${currentName}' not found`);
    }

    const newProvider = this.createProvider(newName, config);
    if (!newProvider) {
      throw new Error(`Cannot create provider '${newName}'`);
    }

    // Health check new provider
    const healthy = await newProvider.healthCheck();
    if (!healthy) {
      throw new Error(`New provider '${newName}' failed health check`);
    }

    // Register new provider
    this.register(newName, newProvider);

    return newProvider;
  }

  // Provider statistics and health
  async getProviderStats(): Promise<Array<{
    name: string;
    type: string;
    healthy: boolean;
    capabilities?: any;
  }>> {
    const stats = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        const healthy = await provider.healthCheck();
        const capabilities = (provider as any).getCapabilities?.();

        stats.push({
          name,
          type: provider.getType(),
          healthy,
          capabilities
        });
      } catch (error) {
        stats.push({
          name,
          type: provider.getType(),
          healthy: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return stats;
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    providers: Array<{
      name: string;
      healthy: boolean;
      error?: string;
    }>;
  }> {
    const providerHealth = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        const healthy = await provider.healthCheck();
        providerHealth.push({ name, healthy });
      } catch (error) {
        providerHealth.push({
          name,
          healthy: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const healthy = providerHealth.every(p => p.healthy);

    return {
      healthy,
      providers: providerHealth
    };
  }

  // Cleanup and maintenance
  async cleanup(): Promise<{
    cleanupCount: number;
    providers: Array<{
      name: string;
      cleanupCount: number;
    }>;
  }> {
    let totalCleanupCount = 0;
    const providerCleanup = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        const cleanupCount = await provider.cleanup();
        totalCleanupCount += cleanupCount;
        providerCleanup.push({ name, cleanupCount });
      } catch (error) {
        providerCleanup.push({
          name,
          cleanupCount: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      cleanupCount: totalCleanupCount,
      providers: providerCleanup
    };
  }

  // Configuration validation
  validateProviderConfig(name: string, config: TokenConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!name) {
      errors.push('Provider name is required');
    }

    if (!config) {
      errors.push('Configuration is required');
      return { valid: false, errors };
    }

    if (!config.provider) {
      errors.push('Provider type is required');
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

  // Provider comparison and migration
  async compareProviders(
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
    const provider1 = this.get(provider1Name);
    const provider2 = this.get(provider2Name);

    if (!provider1 || !provider2) {
      throw new Error('Both providers must be registered');
    }

    const [healthy1, healthy2] = await Promise.all([
      provider1.healthCheck(),
      provider2.healthCheck()
    ]);

    const capabilities1 = (provider1 as any).getCapabilities?.() || {};
    const capabilities2 = (provider2 as any).getCapabilities?.() || {};

    // Determine compatibility
    const compatible = this.determineCompatibility(capabilities1, capabilities2);
    const migrationComplexity = this.assessMigrationComplexity(capabilities1, capabilities2);

    return {
      provider1: {
        name: provider1Name,
        type: provider1.getType(),
        capabilities: capabilities1,
        healthy: healthy1
      },
      provider2: {
        name: provider2Name,
        type: provider2.getType(),
        capabilities: capabilities2,
        healthy: healthy2
      },
      compatible,
      migrationComplexity
    };
  }

  private determineCompatibility(cap1: any, cap2: any): boolean {
    // Basic compatibility check
    if (cap1.supportsRefresh !== cap2.supportsRefresh) {
      return false;
    }

    if (cap1.supportsMetadata !== cap2.supportsMetadata) {
      return false;
    }

    return true;
  }

  private assessMigrationComplexity(cap1: any, cap2: any): 'low' | 'medium' | 'high' {
    // If both are stateless or both are stateful, complexity is low
    if (cap1.isStateless === cap2.isStateless) {
      return 'low';
    }

    // If moving from stateful to stateless, complexity is medium
    if (!cap1.isStateless && cap2.isStateless) {
      return 'medium';
    }

    // Moving from stateless to stateful is high complexity
    return 'high';
  }
}

// Global registry instance
export const tokenRegistry = new TokenRegistryImpl();

// Convenience functions
export function registerTokenProvider(name: string, provider: TokenProvider): void {
  tokenRegistry.register(name, provider);
}

export function getTokenProvider(name: string): TokenProvider | undefined {
  return tokenRegistry.get(name);
}

export function createTokenProvider(name: string, config: TokenConfig): TokenProvider | undefined {
  return tokenRegistry.createProvider(name, config);
}

export function listTokenProviders(): string[] {
  return tokenRegistry.list();
}

export function hasTokenProvider(name: string): boolean {
  return tokenRegistry.has(name);
}

export function unregisterTokenProvider(name: string): void {
  tokenRegistry.unregister(name);
}

export function clearTokenProviders(): void {
  tokenRegistry.clear();
}

// Factory functions for common configurations
export function createJWTProvider(config: {
  jwtSecret: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
  defaultExpiry?: number;
  refreshExpiry?: number;
}): TokenProvider {
  const providerConfig: TokenConfig = {
    provider: 'jwt',
    jwtSecret: config.jwtSecret,
    algorithm: config.algorithm || 'HS256',
    issuer: config.issuer,
    audience: config.audience,
    defaultExpiry: config.defaultExpiry || 3600,
    refreshExpiry: config.refreshExpiry || 30 * 24 * 60 * 60
  };

  return tokenRegistry.createProvider('jwt', providerConfig)!;
}

export function createDatabaseProvider(config: {
  tableName?: string;
  hashTokens?: boolean;
  cleanupExpired?: boolean;
  defaultExpiry?: number;
  refreshExpiry?: number;
}): TokenProvider {
  const providerConfig: TokenConfig = {
    provider: 'database',
    tableName: config.tableName || 'tokens',
    hashTokens: config.hashTokens !== false,
    cleanupExpired: config.cleanupExpired !== false,
    defaultExpiry: config.defaultExpiry || 3600,
    refreshExpiry: config.refreshExpiry || 30 * 24 * 60 * 60
  };

  return tokenRegistry.createProvider('database', providerConfig)!;
}

// Environment-based provider creation
export function createProviderFromEnvironment(): TokenProvider {
  const providerType = process.env.TOKEN_PROVIDER || 'jwt';

  switch (providerType) {
    case 'jwt':
      return createJWTProvider({
        jwtSecret: process.env.JWT_SECRET || 'default-secret',
        algorithm: process.env.JWT_ALGORITHM as any,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        defaultExpiry: parseInt(process.env.TOKEN_DEFAULT_EXPIRY || '3600'),
        refreshExpiry: parseInt(process.env.TOKEN_REFRESH_EXPIRY || '2592000')
      });

    case 'database':
      return createDatabaseProvider({
        tableName: process.env.TOKEN_TABLE_NAME,
        hashTokens: process.env.TOKEN_HASH !== 'false',
        cleanupExpired: process.env.TOKEN_CLEANUP !== 'false',
        defaultExpiry: parseInt(process.env.TOKEN_DEFAULT_EXPIRY || '3600'),
        refreshExpiry: parseInt(process.env.TOKEN_REFRESH_EXPIRY || '2592000')
      });

    default:
      throw new Error(`Unsupported token provider: ${providerType}`);
  }
}
