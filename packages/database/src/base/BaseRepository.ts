/**
 * Base Repository Implementation
 * 
 * Abstract base class for all repositories
 * Provides common functionality and enforces standard patterns
 */

import type {
    BaseEntity,
    DatabaseAdapter,
    Repository,
    RepositoryError,
    RepositoryFilter,
    RepositoryResult
} from '@dashboard-link/shared';

export abstract class BaseRepository<T extends BaseEntity> implements Repository<T> {
  protected abstract tableName: string;
  protected adapter: DatabaseAdapter;

  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  // Standard CRUD operations
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filter: RepositoryFilter): Promise<T[]>;
  abstract findOne(filter: RepositoryFilter): Promise<T | null>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<void>;

  // Common operations
  async count(filter?: RepositoryFilter): Promise<number> {
    const query = this.buildQuery(filter || {});
    return await query.count();
  }

  async exists(filter: RepositoryFilter): Promise<boolean> {
    const query = this.buildQuery(filter);
    return await query.exists();
  }

  async findWithPagination(
    filter: RepositoryFilter,
    page: number,
    limit: number
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.findMany({ ...filter, limit, offset }),
      this.count(filter)
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  // Helper methods for building queries
  protected buildQuery(filter: RepositoryFilter) {
    let query = this.adapter.query(this.tableName);

    if (filter.where) {
      query = query.where(filter.where);
    }

    if (filter.whereIn) {
      Object.entries(filter.whereIn).forEach(([field, values]) => {
        query = query.whereIn(field, values);
      });
    }

    if (filter.whereNot) {
      query = query.whereNot(filter.whereNot);
    }

    if (filter.whereNotIn) {
      Object.entries(filter.whereNotIn).forEach(([field, values]) => {
        query = query.whereNotIn(field, values);
      });
    }

    if (filter.whereBetween) {
      Object.entries(filter.whereBetween).forEach(([field, values]) => {
        query = query.whereBetween(field, values);
      });
    }

    if (filter.whereNull) {
      filter.whereNull.forEach(field => {
        query = query.whereNull(field);
      });
    }

    if (filter.whereNotNull) {
      filter.whereNotNull.forEach(field => {
        query = query.whereNotNull(field);
      });
    }

    if (filter.orderBy) {
      filter.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.offset(filter.offset);
    }

    if (filter.search) {
      query = query.search(filter.search.fields, filter.search.query);
    }

    return query;
  }

  // Transform methods - to be implemented by concrete repositories
  protected abstract transformFromDB(row: unknown): T;
  protected abstract transformToDB(entity: Partial<T>): unknown;

  // Error handling helpers
  protected handleError(error: unknown, operation: string): RepositoryError {
    const repositoryError: RepositoryError = {
      code: 'REPOSITORY_ERROR',
      message: `Failed to ${operation} in ${this.constructor.name}`,
      retryable: false
    };

    if (error instanceof Error) {
      repositoryError.message = error.message;
      repositoryError.details = { stack: error.stack };
    }

    return repositoryError;
  }

  protected createResult<T>(
    success: boolean,
    data?: T,
    error?: RepositoryError,
    metadata?: RepositoryResult<T>['metadata']
  ): RepositoryResult<T> {
    return {
      success,
      data,
      error,
      metadata
    };
  }

  // Validation helpers
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid ID provided');
    }
  }

  protected validateCreateData(data: Partial<T>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided for creation');
    }
  }

  protected validateUpdateData(data: Partial<T>): void {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new Error('Invalid data provided for update');
    }
  }

  // Timestamp helpers
  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected setCreateTimestamps(data: Partial<T>): Partial<T> {
    return {
      ...data,
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp()
    } as Partial<T>;
  }

  protected setUpdateTimestamp(data: Partial<T>): Partial<T> {
    return {
      ...data,
      updatedAt: this.getCurrentTimestamp()
    } as Partial<T>;
  }
}

// Utility class for common repository operations
export class RepositoryUtils {
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static transformKeys(obj: Record<string, unknown>, transformer: (key: string) => string): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = transformer(key);
      transformed[newKey] = value;
    }
    
    return transformed;
  }

  static buildCacheKey(
    table: string, 
    operation: string, 
    params: Record<string, unknown> = {}
  ): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
      .join('|');
    
    return `${table}:${operation}:${paramString}`;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced per country
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
}
