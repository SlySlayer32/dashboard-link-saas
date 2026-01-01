/**
 * Repository Pattern Types
 * 
 * Standard contracts for database abstraction layer
 * Following Zapier's enterprise architecture standards
 */

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter: RepositoryFilter): Promise<T[]>;
  findOne(filter: RepositoryFilter): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: RepositoryFilter): Promise<number>;
  exists(filter: RepositoryFilter): Promise<boolean>;
}

export interface RepositoryFilter {
  where?: Record<string, unknown>;
  whereIn?: Record<string, unknown[]>;
  whereNot?: Record<string, unknown>;
  whereNotIn?: Record<string, unknown[]>;
  whereBetween?: Record<string, [unknown, unknown]>;
  whereNull?: string[];
  whereNotNull?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  search?: { fields: string[]; query: string };
}

export interface QueryBuilder {
  select(fields?: string[]): QueryBuilder;
  where(conditions: Record<string, unknown>): QueryBuilder;
  whereIn(field: string, values: unknown[]): QueryBuilder;
  whereNot(conditions: Record<string, unknown>): QueryBuilder;
  whereNotIn(field: string, values: unknown[]): QueryBuilder;
  whereBetween(field: string, values: [unknown, unknown]): QueryBuilder;
  whereNull(field: string): QueryBuilder;
  whereNotNull(field: string): QueryBuilder;
  orderBy(field: string, direction: 'asc' | 'desc'): QueryBuilder;
  limit(count: number): QueryBuilder;
  offset(count: number): QueryBuilder;
  search(fields: string[], query: string): QueryBuilder;
  build(): Promise<unknown[]>;
  first(): Promise<unknown>;
  count(): Promise<number>;
  exists(): Promise<boolean>;
}

export interface DatabaseAdapter {
  query(table: string): QueryBuilder;
  transaction<T>(callback: (trx: Transaction) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

export interface Transaction {
  query(table: string): QueryBuilder;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface RepositoryConfig {
  adapter: 'supabase' | 'postgresql' | 'mock';
  caching?: {
    enabled: boolean;
    ttl: number; // seconds
  };
  connectionPool?: {
    min: number;
    max: number;
  };
}

export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: RepositoryError;
  metadata?: {
    executionTime: number;
    cacheHit: boolean;
    totalRows: number;
  };
}

export interface RepositoryError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Entity types for repositories
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  organizationId: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface Organization extends BaseEntity {
  name: string;
  settings?: {
    smsSenderId?: string;
    defaultTokenExpiry?: number; // seconds
    customMetadata?: Record<string, unknown>;
  };
}

export interface Dashboard extends BaseEntity {
  name: string;
  workerId: string;
  organizationId: string;
  active: boolean;
  config?: Record<string, unknown>;
}

export interface SMSLog extends BaseEntity {
  workerId: string;
  organizationId: string;
  to: string;
  from?: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  provider: string;
  providerMessageId?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface Admin extends BaseEntity {
  authUserId: string;
  organizationId: string;
  role: 'admin' | 'owner';
  permissions?: string[];
}

export interface Token extends BaseEntity {
  workerId: string;
  organizationId: string;
  token: string;
  expiresAt: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}
