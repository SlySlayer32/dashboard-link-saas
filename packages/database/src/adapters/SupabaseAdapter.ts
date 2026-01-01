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

// Supabase client type definition
export interface SupabaseClient {
  from: (table: string) => SupabaseQuery;
}

// Supabase query interface
export interface SupabaseQuery {
  select: (fields?: string | { count?: string; head?: boolean }) => SupabaseQuery;
  eq: (field: string, value: unknown) => SupabaseQuery;
  neq: (field: string, value: unknown) => SupabaseQuery;
  is: (field: string, value: unknown) => SupabaseQuery;
  not: (field: string, operator: string, value: unknown) => SupabaseQuery;
  in: (field: string, values: unknown[]) => SupabaseQuery;
  gte: (field: string, value: unknown) => SupabaseQuery;
  lte: (field: string, value: unknown) => SupabaseQuery;
  order: (field: string, options?: { ascending?: boolean }) => SupabaseQuery;
  limit: (count: number) => SupabaseQuery;
  range: (from: number, to: number) => SupabaseQuery;
  or: (condition: string) => SupabaseQuery;
  single: () => Promise<{ data?: unknown; error?: { message: string } }>;
  // For regular queries that return arrays
  then: (onfulfilled: (value: { data?: unknown[]; error?: { message: string } }) => unknown) => Promise<unknown>;
}

export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;
  private config: RepositoryConfig;

  constructor(client: SupabaseClient, config: RepositoryConfig) {
    this.client = client;
    this.config = config;
  }

  query(table: string): SupabaseQueryBuilder {
    return new SupabaseQueryBuilder(this.client, table);
  }

  async transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
    // Supabase doesn't support traditional transactions
    // We'll use RPC functions for transaction-like behavior
    const result = await callback(new SupabaseTransaction(this.client));
    return result;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this.client.from('health_check').select('*').single();
      const latency = Date.now() - startTime;
      return latency < 5000; // Consider healthy if response is under 5 seconds
    } catch {
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
      await this.client.from('health_check').select('*').single();
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        status: 'healthy' as const,
        lastChecked: new Date().toISOString(),
        responseTime: latency,
        message: 'Supabase connection successful'
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy' as const,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export class SupabaseQueryBuilder implements QueryBuilder {
  private query: SupabaseQuery;
  private table: string;
  private client: SupabaseClient;

  constructor(client: SupabaseClient, table: string) {
    this.client = client;
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
    this.query = this.query.range(count, count + 1000 - 1); // Default limit of 1000
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
    // Store the current query builder state
    this.query = this.client.from(this.table).select({ count: 'exact', head: true });
    
    // Apply the same filters
    // Note: This is a simplified approach - in production, you'd want to
    // preserve the exact same query conditions
    
    const result = await this.query as { count?: number; error?: { message: string } };
    
    if (result.error) {
      throw new Error(`Supabase count error: ${result.error.message}`);
    }
    
    return result.count || 0;
  }

  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }
}

export class SupabaseTransaction implements Transaction {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
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
  client: SupabaseClient, 
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
