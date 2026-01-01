/**
 * Database Package Index
 * 
 * Main entry point for the database package
 * Exports all repository classes, adapters, and utilities
 */

// Types and interfaces
export type {
    Admin, BaseEntity, Dashboard, DatabaseAdapter, Organization, PaginatedResult, PaginationOptions, QueryBuilder, Repository, RepositoryConfig, RepositoryError, RepositoryFilter, RepositoryResult, SMSLog, Token, Transaction, Worker
} from '@dashboard-link/shared';

// Base classes
export { BaseRepository, RepositoryUtils } from './base/BaseRepository.js';

// Adapters
export {
    AdapterConfig,
    AdapterHealthCheck, AdapterRegistry, DatabaseAdapter as BaseDatabaseAdapter,
    BaseTransaction, ConnectionPool, DatabaseAdapterFactory, adapterRegistry
} from './adapters/DatabaseAdapter.js';

export {
    SupabaseAdapter,
    SupabaseQueryBuilder,
    SupabaseTransaction,
    createSupabaseAdapter
} from './adapters/SupabaseAdapter.js';

// Repositories
export { DashboardRepository } from './repositories/DashboardRepository.js';
export { OrganizationRepository } from './repositories/OrganizationRepository.js';
export { SMSLogRepository } from './repositories/SMSLogRepository.js';
export { WorkerRepository } from './repositories/WorkerRepository.js';

// Dependency Injection
export {
    DIContainer, createContainerFromEnvironment, getContainer, getDashboardRepository, getOrganizationRepository, getSMSLogRepository, getWorkerRepository, initializeContainer, isContainerInitialized, type ContainerConfig, type RepositoryContainer
} from './di/Container.js';

// Legacy exports for backward compatibility
export class LegacyRepositoryAdapter {
  // This provides a bridge for existing code that hasn't been migrated yet
  static createWorkerRepository(adapter: DatabaseAdapter) {
    return new WorkerRepository(adapter);
  }
  
  static createOrganizationRepository(adapter: DatabaseAdapter) {
    return new OrganizationRepository(adapter);
  }
  
  static createDashboardRepository(adapter: DatabaseAdapter) {
    return new DashboardRepository(adapter);
  }
  
  static createSMSLogRepository(adapter: DatabaseAdapter) {
    return new SMSLogRepository(adapter);
  }
}
