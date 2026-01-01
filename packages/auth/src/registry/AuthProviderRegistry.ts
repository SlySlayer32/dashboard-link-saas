/**
 * Authentication Provider Registry
 * 
 * Registry for managing authentication providers
 * Provides factory functions and provider lifecycle management
 */

import type {
    AuthConfig,
    AuthProvider,
    AuthProviderFactory,
    AuthProviderRegistry
} from '@dashboard-link/shared';

export class AuthProviderRegistryImpl implements AuthProviderRegistry {
  private providers = new Map<string, AuthProvider>();
  private factories = new Map<string, AuthProviderFactory>();

  register(name: string, provider: AuthProvider): void {
    this.providers.set(name, provider);
  }

  unregister(name: string): void {
    this.providers.delete(name);
  }

  get(name: string): AuthProvider | undefined {
    return this.providers.get(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }

  registerFactory(name: string, factory: AuthProviderFactory): void {
    this.factories.set(name, factory);
  }

  createProvider(name: string, config: AuthConfig): AuthProvider | undefined {
    const factory = this.factories.get(name);
    if (!factory) {
      return undefined;
    }
    return factory(config);
  }

  clear(): void {
    this.providers.clear();
    this.factories.clear();
  }

  has(name: string): boolean {
    return this.providers.has(name) || this.factories.has(name);
  }
}

// Global registry instance
export const authProviderRegistry = new AuthProviderRegistryImpl();

// Provider factory functions
export const authProviderFactories: Record<string, AuthProviderFactory> = {
  // Supabase provider factory
  supabase: (_config: AuthConfig) => {
    // This would be implemented with actual Supabase client
    // For now, return a placeholder
    throw new Error('Supabase provider not implemented in registry');
  },

  // Mock provider factory
  mock: (_config: AuthConfig) => {
    // This would be implemented with MockAuthProvider
    throw new Error('Mock provider not implemented in registry');
  },

  // Auth0 provider factory (placeholder)
  auth0: (_config: AuthConfig) => {
    throw new Error('Auth0 provider not implemented');
  },

  // Okta provider factory (placeholder)
  okta: (_config: AuthConfig) => {
    throw new Error('Okta provider not implemented');
  }
};

// Register factories
Object.entries(authProviderFactories).forEach(([name, factory]) => {
  authProviderRegistry.registerFactory(name, factory);
});

// Utility functions
export function registerAuthProvider(name: string, provider: AuthProvider): void {
  authProviderRegistry.register(name, provider);
}

export function getAuthProvider(name: string): AuthProvider | undefined {
  return authProviderRegistry.get(name);
}

export function createAuthProvider(name: string, config: AuthConfig): AuthProvider | undefined {
  return authProviderRegistry.createProvider(name, config);
}

export function listAuthProviders(): string[] {
  return authProviderRegistry.list();
}

export function hasAuthProvider(name: string): boolean {
  return authProviderRegistry.has(name);
}

export function unregisterAuthProvider(name: string): void {
  authProviderRegistry.unregister(name);
}

export function clearAuthProviders(): void {
  authProviderRegistry.clear();
}
