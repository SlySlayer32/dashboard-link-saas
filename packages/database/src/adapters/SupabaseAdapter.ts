/**
 * Supabase Database Adapter
 * 
 * Implements the DatabaseAdapter interface for Supabase
 * Provides query builder and transaction support
 */

import type {
    AdapterHealthCheck,
    DatabaseAdapter,
    QueryBuilder,
    RepositoryConfig,
    Transaction
} from '@dashboard-link/shared';

export class SupabaseAdapter implements DatabaseAdapter {
  private client: any; // SupabaseClient
  private config: RepositoryConfig;

  constructor(client: any, config: RepositoryConfig) {
    this.client = client;
    this.config = config;
  }

  query(table: string): SupabaseQueryBuilder {
    return new SupabaseQueryBuilder(this.client, table);
  }

  async transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
    // Supabase doesn't support traditional transactions
    // We'll use RPC functions for transaction-like behavior
    try {
      const result = await callback(new SupabaseTransaction(this.client));
      return result;
    } catch (error) {
      // In a real implementation, we'd handle rollback
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this.client.from('health_check').select('count').single();
      const latency = Date.now() - startTime;
      return latency < 5000; // Consider healthy if response is under 5 seconds
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
  }

  getConfig(): RepositoryConfig {
    return this.config;
  }

  async getDetailedHealthCheck(): Promise<AdapterHealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.client.from('health_check').select('count').single();
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency,
        metadata: {
          adapter: 'supabase',
          version: '2.0.0' // Would be dynamic in real implementation
        }
      };
    } catch (error) {
      return {
        connected: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          adapter: 'supabase'
        }
      };
    }
  }
}

export class SupabaseQueryBuilder implements QueryBuilder {
  private query: any;
  private table: string;

  constructor(client: any, table: string) {
    this.table = table;
    this.query = client.from(table);
  }

  select(fields?: string[]): QueryBuilder {
    if (fields) {
      this.query = this.query.select(fields.join(','));
    } else {
      this.query = this.query.select('*');
    }
    return this;
  }

  where(conditions: Record<string, unknown>): QueryBuilder {
    Object.entries(conditions).forEach(([key, value]) => {
      if (value === null) {
        this.query = this.query.is(key, null);
      } else {
        this.query = this.query.eq(key, value);
      }
    });
    return this;
  }

  whereIn(field: string, values: unknown[]): QueryBuilder {
    this.query = this.query.in(field, values);
    return this;
  }

  whereNot(conditions: Record<string, unknown>): QueryBuilder {
    Object.entries(conditions).forEach(([key, value]) => {
      if (value === null) {
        this.query = this.query.not(key, 'is', null);
      } else {
        this.query = this.query.neq(key, value);
      }
    });
    return this;
  }

  whereNotIn(field: string, values: unknown[]): QueryBuilder {
    this.query = this.query.not(field, 'in', values);
    return this;
  }

  whereBetween(field: string, values: [unknown, unknown]): QueryBuilder {
    this.query = this.query.gte(field, values[0]).lte(field, values[1]);
    return this;
  }

  whereNull(field: string): QueryBuilder {
    this.query = this.query.is(field, null);
    return this;
  }

  whereNotNull(field: string): QueryBuilder {
    this.query = this.query.not(field, 'is', null);
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc'): QueryBuilder {
    this.query = this.query.order(field, { ascending: direction === 'asc' });
    return this;
  }

  limit(count: number): QueryBuilder {
    this.query = this.query.limit(count);
    return this;
  }

  offset(count: number): QueryBuilder {
    this.query = this.query.range(count, count + (this.query?.limit || 1000) - 1);
    return this;
  }

  search(fields: string[], query: string): QueryBuilder {
    // Supabase text search implementation
    const searchConditions = fields.map(field => `${field}.ilike.%${query}%`).join(',');
    this.query = this.query.or(searchConditions);
    return this;
  }

  async build(): Promise<unknown[]> {
    const { data, error } = await this.query;
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    
    return data || [];
  }

  async first(): Promise<unknown> {
    this.query = this.query.limit(1);
    const results = await this.build();
    return results[0] || null;
  }

  async count(): Promise<number> {
    const originalQuery = this.query;
    this.query = this.client.from(this.table).select('*', { count: 'exact', head: true });
    
    // Apply the same filters
    // Note: This is a simplified approach - in production, you'd want to
    // preserve the exact same query conditions
    
    const { count, error } = await this.query;
    
    if (error) {
      throw new Error(`Supabase count error: ${error.message}`);
    }
    
    return count || 0;
  }

  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }
}

export class SupabaseTransaction implements Transaction {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  query(table: string): QueryBuilder {
    return new SupabaseQueryBuilder(this.client, table);
  }

  async commit(): Promise<void> {
    // Supabase handles commits automatically
  }

  async rollback(): Promise<void> {
    // Supabase doesn't support manual rollback in the traditional sense
    // In a real implementation, you'd use RPC functions
    throw new Error('Manual rollback not supported in Supabase');
  }
}

// Factory function for creating Supabase adapter
export function createSupabaseAdapter(
  client: any, 
  config: Partial<RepositoryConfig> = {}
): SupabaseAdapter {
  const defaultConfig: RepositoryConfig = {
    adapter: 'supabase',
    caching: {
      enabled: false,
      ttl: 300
    }
  };

  return new SupabaseAdapter(client, { ...defaultConfig, ...config });
}
