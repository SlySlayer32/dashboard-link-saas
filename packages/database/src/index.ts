/**
 * Database Package Index
 * 
 * Main entry point for the database package
 * Exports all repository classes, adapters, and utilities
 */

// Types and interfaces
export type {
    Admin, BaseEntity, Dashboard, Organization, PaginatedResult, PaginationOptions, QueryBuilder, Repository, RepositoryConfig, RepositoryError, RepositoryFilter, RepositoryResult, SMSLog, Token, Transaction, Worker
} from '@dashboard-link/shared';

// Base classes
export { BaseRepository, RepositoryUtils } from './base/BaseRepository.js';

// Adapters
export {
    AdapterConfig,
    AdapterHealthCheck, AdapterRegistry, BaseTransaction, ConnectionPool, DatabaseAdapter, DatabaseAdapterFactory, adapterRegistry
} from './adapters/DatabaseAdapter.js';

export type { DatabaseAdapter as BaseDatabaseAdapter } from './adapters/DatabaseAdapter.js';

export {
    SupabaseAdapter,
    SupabaseQueryBuilder,
    SupabaseTransaction,
    createSupabaseAdapter
} from './adapters/SupabaseAdapter.js';

export {
    MockAdapter,
    MockQueryBuilder,
    MockTransaction, createEmptyMockAdapter, createMockAdapter
} from './adapters/MockAdapter.js';

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
// Note: This section is deprecated and will be removed in future versions
// Please use the DI container instead
