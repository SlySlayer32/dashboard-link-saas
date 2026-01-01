/**
 * Database Adapter Interface
 * 
 * Defines the contract for all database adapters
 * Enables swapping between different database implementations
 */

import type {
    QueryBuilder,
    RepositoryConfig,
    Transaction
} from '@dashboard-link/shared';

export interface DatabaseAdapter {
  query(table: string): QueryBuilder;
  transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
  getConfig(): RepositoryConfig;
}

export abstract class BaseTransaction implements Transaction {
  protected abstract query(table: string): QueryBuilder;
  protected abstract commit(): Promise<void>;
  protected abstract rollback(): Promise<void>;

  // Helper methods for transaction operations
  protected async executeInTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await operation();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

export interface AdapterHealthCheck {
  connected: boolean;
  latency: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectionPool {
  min: number;
  max: number;
  idleTimeoutMillis?: number;
  acquireTimeoutMillis?: number;
}

export interface AdapterConfig {
  type: 'supabase' | 'postgresql' | 'mock';
  connection: Record<string, unknown>;
  pool?: ConnectionPool;
  caching?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  retryPolicy?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

// Factory for creating database adapters
export class DatabaseAdapterFactory {
  static create(config: AdapterConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase':
        // Will be implemented in SupabaseAdapter
        throw new Error('SupabaseAdapter not yet implemented');
      
      case 'postgresql':
        // Will be implemented in PostgreSQLAdapter
        throw new Error('PostgreSQLAdapter not yet implemented');
      
      case 'mock':
        // Will be implemented in MockAdapter
        throw new Error('MockAdapter not yet implemented');
      
      default:
        throw new Error(`Unknown adapter type: ${config.type}`);
    }
  }
}

// Registry for managing multiple adapters
export class AdapterRegistry {
  private adapters = new Map<string, DatabaseAdapter>();
  private defaultAdapter?: string;

  register(name: string, adapter: DatabaseAdapter, isDefault = false): void {
    this.adapters.set(name, adapter);
    if (isDefault || !this.defaultAdapter) {
      this.defaultAdapter = name;
    }
  }

  get(name?: string): DatabaseAdapter {
    const adapterName = name || this.defaultAdapter;
    if (!adapterName) {
      throw new Error('No adapter specified and no default adapter set');
    }

    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter '${adapterName}' not found`);
    }

    return adapter;
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  remove(name: string): void {
    this.adapters.delete(name);
    if (this.defaultAdapter === name) {
      this.defaultAdapter = undefined;
    }
  }

  list(): string[] {
    return Array.from(this.adapters.keys());
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.adapters.values()).map(adapter => 
      adapter.close().catch(error => 
        console.error('Error closing adapter:', error)
      )
    );
    
    await Promise.all(closePromises);
    this.adapters.clear();
    this.defaultAdapter = undefined;
  }
}

// Singleton instance
export const adapterRegistry = new AdapterRegistry();
