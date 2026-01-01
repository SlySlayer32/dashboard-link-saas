/**
 * Mock Database Adapter
 * 
 * In-memory database adapter for testing and development
 * Provides fast, isolated database operations without external dependencies
 */

import type {
    AdapterHealthCheck,
    DatabaseAdapter,
    QueryBuilder,
    RepositoryConfig,
    Transaction
} from '@dashboard-link/shared';

export class MockAdapter implements DatabaseAdapter {
  private data = new Map<string, unknown[]>();
  private config: RepositoryConfig;

  constructor(initialData?: Record<string, unknown[]>, config: Partial<RepositoryConfig> = {}) {
    this.config = {
      adapter: 'mock',
      caching: {
        enabled: false,
        ttl: 300
      },
      ...config
    };

    if (initialData) {
      Object.entries(initialData).forEach(([table, rows]) => {
        this.data.set(table, [...rows]);
      });
    }
  }

  query(table: string): QueryBuilder {
    return new MockQueryBuilder(this.data.get(table) || [], table);
  }

  async transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {
    const trx = new MockTransaction(this.data);
    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return true; // Mock adapter is always healthy
  }

  async close(): Promise<void> {
    this.data.clear();
  }

  getConfig(): RepositoryConfig {
    return this.config;
  }

  async getDetailedHealthCheck(): Promise<AdapterHealthCheck> {
    return {
      connected: true,
      latency: 0,
      metadata: {
        adapter: 'mock',
        tables: Array.from(this.data.keys()),
        totalRows: Array.from(this.data.values()).reduce((sum, rows) => sum + rows.length, 0)
      }
    };
  }

  // Helper methods for testing
  addData(table: string, rows: unknown[]): void {
    const existing = this.data.get(table) || [];
    this.data.set(table, [...existing, ...rows]);
  }

  clearTable(table: string): void {
    this.data.set(table, []);
  }

  getTableData(table: string): unknown[] {
    return this.data.get(table) || [];
  }

  reset(): void {
    this.data.clear();
  }
}

export class MockQueryBuilder implements QueryBuilder {
  private data: unknown[];
  private table: string;
  private conditions: Array<(row: unknown) => boolean> = [];
  private sortFields: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
  private limitCount?: number;
  private offsetCount = 0;

  constructor(data: unknown[], table: string) {
    this.data = [...data];
    this.table = table;
  }

  select(fields?: string[]): QueryBuilder {
    if (fields) {
      this.data = this.data.map(row => {
        const selected: Record<string, unknown> = {};
        fields.forEach(field => {
          if (field in row) {
            selected[field] = (row as Record<string, unknown>)[field];
          }
        });
        return selected;
      });
    }
    return this;
  }

  where(conditions: Record<string, unknown>): QueryBuilder {
    this.conditions.push(row => {
      return Object.entries(conditions).every(([key, value]) => {
        const rowValue = (row as Record<string, unknown>)[key];
        return rowValue === value;
      });
    });
    return this;
  }

  whereIn(field: string, values: unknown[]): QueryBuilder {
    this.conditions.push(row => {
      const rowValue = (row as Record<string, unknown>)[field];
      return values.includes(rowValue);
    });
    return this;
  }

  whereNot(conditions: Record<string, unknown>): QueryBuilder {
    this.conditions.push(row => {
      return Object.entries(conditions).every(([key, value]) => {
        const rowValue = (row as Record<string, unknown>)[key];
        return rowValue !== value;
      });
    });
    return this;
  }

  whereNotIn(field: string, values: unknown[]): QueryBuilder {
    this.conditions.push(row => {
      const rowValue = (row as Record<string, unknown>)[field];
      return !values.includes(rowValue);
    });
    return this;
  }

  whereBetween(field: string, values: [unknown, unknown]): QueryBuilder {
    this.conditions.push(row => {
      const rowValue = (row as Record<string, unknown>)[field];
      return rowValue >= values[0] && rowValue <= values[1];
    });
    return this;
  }

  whereNull(field: string): QueryBuilder {
    this.conditions.push(row => {
      const rowValue = (row as Record<string, unknown>)[field];
      return rowValue === null || rowValue === undefined;
    });
    return this;
  }

  whereNotNull(field: string): QueryBuilder {
    this.conditions.push(row => {
      const rowValue = (row as Record<string, unknown>)[field];
      return rowValue !== null && rowValue !== undefined;
    });
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc'): QueryBuilder {
    this.sortFields.push({ field, direction });
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.offsetCount = count;
    return this;
  }

  search(fields: string[], query: string): QueryBuilder {
    const lowerQuery = query.toLowerCase();
    this.conditions.push(row => {
      return fields.some(field => {
        const rowValue = (row as Record<string, unknown>)[field];
        return typeof rowValue === 'string' && 
               rowValue.toLowerCase().includes(lowerQuery);
      });
    });
    return this;
  }

  async build(): Promise<unknown[]> {
    let result = [...this.data];

    // Apply conditions
    this.conditions.forEach(condition => {
      result = result.filter(condition);
    });

    // Apply sorting
    if (this.sortFields.length > 0) {
      result.sort((a, b) => {
        for (const { field, direction } of this.sortFields) {
          const aValue = (a as Record<string, unknown>)[field];
          const bValue = (b as Record<string, unknown>)[field];
          
          if (aValue !== bValue) {
            const comparison = aValue < bValue ? -1 : 1;
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply offset and limit
    if (this.offsetCount > 0) {
      result = result.slice(this.offsetCount);
    }
    
    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }

  async first(): Promise<unknown> {
    const results = await this.build();
    return results[0] || null;
  }

  async count(): Promise<number> {
    const results = await this.build();
    return results.length;
  }

  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }
}

export class MockTransaction implements Transaction {
  private data: Map<string, unknown[]>;
  private originalData: Map<string, unknown[]>;
  private committed = false;

  constructor(data: Map<string, unknown[]>) {
    this.data = data;
    this.originalData = new Map();
    
    // Deep copy original data for rollback
    data.forEach((rows, table) => {
      this.originalData.set(table, JSON.parse(JSON.stringify(rows)));
    });
  }

  query(table: string): QueryBuilder {
    return new MockQueryBuilder(this.data.get(table) || [], table);
  }

  async commit(): Promise<void> {
    this.committed = true;
    this.originalData.clear();
  }

  async rollback(): Promise<void> {
    if (!this.committed) {
      // Restore original data
      this.data.clear();
      this.originalData.forEach((rows, table) => {
        this.data.set(table, JSON.parse(JSON.stringify(rows)));
      });
    }
  }
}

// Factory function for creating mock adapter with test data
export function createMockAdapter(): MockAdapter {
  const testData: Record<string, unknown[]> = {
    workers: [
      {
        id: 'worker-1',
        name: 'John Doe',
        phone: '+61412345678',
        email: 'john@example.com',
        organization_id: 'org-1',
        active: true,
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'worker-2',
        name: 'Jane Smith',
        phone: '+61487654321',
        email: 'jane@example.com',
        organization_id: 'org-1',
        active: true,
        metadata: {},
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ],
    organizations: [
      {
        id: 'org-1',
        name: 'Test Organization',
        settings: {
          sms_sender_id: 'TestOrg',
          default_token_expiry: 3600,
          custom_metadata: {}
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    dashboards: [
      {
        id: 'dashboard-1',
        name: 'John\'s Dashboard',
        worker_id: 'worker-1',
        organization_id: 'org-1',
        active: true,
        config: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    sms_logs: [
      {
        id: 'sms-1',
        worker_id: 'worker-1',
        organization_id: 'org-1',
        to: '+61412345678',
        from: 'TestOrg',
        body: 'Test message',
        status: 'sent',
        provider: 'mock',
        provider_message_id: 'msg-1',
        cost: 0.05,
        metadata: {},
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }
    ]
  };

  return new MockAdapter(testData);
}

// Utility for creating empty mock adapter
export function createEmptyMockAdapter(): MockAdapter {
  return new MockAdapter();
}
