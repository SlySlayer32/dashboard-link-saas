/**
 * Dependency Injection Container
 * 
 * Manages repository instances and dependencies
 * Provides singleton access to repositories throughout the application
 */

import type { DatabaseAdapter as LocalDatabaseAdapter } from '../adapters/DatabaseAdapter.js';
import { createMockAdapter } from '../adapters/MockAdapter.js';
import { createSupabaseAdapter } from '../adapters/SupabaseAdapter.js';
import { DashboardRepository } from '../repositories/DashboardRepository.js';
import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { SMSLogRepository } from '../repositories/SMSLogRepository.js';
import { WorkerRepository } from '../repositories/WorkerRepository.js';

export interface RepositoryContainer {
  worker: WorkerRepository;
  organization: OrganizationRepository;
  dashboard: DashboardRepository;
  smsLog: SMSLogRepository;
}

export interface ContainerConfig {
  database: {
    type: 'supabase' | 'postgresql' | 'mock';
    connection: unknown;
    config?: {
      caching?: {
        enabled: boolean;
        ttl: number;
      };
    };
  };
}

export class DIContainer {
  private repositories: RepositoryContainer;
  private adapter: LocalDatabaseAdapter;
  private config: ContainerConfig;

  constructor(config: ContainerConfig) {
    this.config = config;
    this.adapter = this.createAdapter();
    this.repositories = this.setupRepositories();
  }

  private createAdapter(): LocalDatabaseAdapter {
    const { database } = this.config;
    
    switch (database.type) {
      case 'supabase': {
        // Import the SupabaseClient type from SupabaseAdapter
        type SupabaseClient = Parameters<typeof createSupabaseAdapter>[0];
        return createSupabaseAdapter(
          database.connection as SupabaseClient,
          database.config || {}
        );
      }
      
      case 'postgresql':
        // Will be implemented when PostgreSQLAdapter is created
        throw new Error('PostgreSQL adapter not yet implemented');
      
      case 'mock':
        return createMockAdapter();
      
      default:
        throw new Error(`Unknown database type: ${database.type}`);
    }
  }

  private setupRepositories(): RepositoryContainer {
    return {
      worker: new WorkerRepository(this.adapter),
      organization: new OrganizationRepository(this.adapter),
      dashboard: new DashboardRepository(this.adapter),
      smsLog: new SMSLogRepository(this.adapter)
    };
  }

  // Repository getters
  getWorkerRepository(): WorkerRepository {
    return this.repositories.worker;
  }

  getOrganizationRepository(): OrganizationRepository {
    return this.repositories.organization;
  }

  getDashboardRepository(): DashboardRepository {
    return this.repositories.dashboard;
  }

  getSMSLogRepository(): SMSLogRepository {
    return this.repositories.smsLog;
  }

  // Adapter access
  getAdapter(): LocalDatabaseAdapter {
    return this.adapter;
  }

  // Health check for all repositories
  async healthCheck(): Promise<{
    database: boolean;
    repositories: Record<string, boolean>;
    overall: boolean;
  }> {
    const databaseHealthy = await this.adapter.healthCheck();
    
    const repositoryHealth = {
      worker: await this.checkRepository(this.repositories.worker),
      organization: await this.checkRepository(this.repositories.organization),
      dashboard: await this.checkRepository(this.repositories.dashboard),
      smsLog: await this.checkRepository(this.repositories.smsLog)
    };

    const overall = databaseHealthy && Object.values(repositoryHealth).every(healthy => healthy);

    return {
      database: databaseHealthy,
      repositories: repositoryHealth,
      overall
    };
  }

  private async checkRepository(repository: { count(): Promise<number> }): Promise<boolean> {
    try {
      // Simple existence check
      await repository.count();
      return true;
    } catch {
      return false;
    }
  }

  // Close all connections
  async close(): Promise<void> {
    await this.adapter.close();
  }

  // Reconfigure container
  reconfigure(config: ContainerConfig): void {
    this.config = config;
    this.adapter = this.createAdapter();
    this.repositories = this.setupRepositories();
  }

  // Get configuration
  getConfig(): ContainerConfig {
    return this.config;
  }
}

// Default container instance
let defaultContainer: DIContainer | null = null;

export function initializeContainer(config: ContainerConfig): DIContainer {
  if (defaultContainer) {
    console.warn('Container already initialized. Reinitializing...');
    void defaultContainer.close();
  }
  
  defaultContainer = new DIContainer(config);
  return defaultContainer;
}

export function getContainer(): DIContainer {
  if (!defaultContainer) {
    throw new Error('Container not initialized. Call initializeContainer() first.');
  }
  
  return defaultContainer;
}

export function isContainerInitialized(): boolean {
  return defaultContainer !== null;
}

// Convenience functions for direct repository access
export function getWorkerRepository(): WorkerRepository {
  return getContainer().getWorkerRepository();
}

export function getOrganizationRepository(): OrganizationRepository {
  return getContainer().getOrganizationRepository();
}

export function getDashboardRepository(): DashboardRepository {
  return getContainer().getDashboardRepository();
}

export function getSMSLogRepository(): SMSLogRepository {
  return getContainer().getSMSLogRepository();
}

// Factory for creating container with environment-based configuration
export function createContainerFromEnvironment(): DIContainer {
  const config: ContainerConfig = {
    database: {
      type: (process.env.DB_TYPE as 'supabase' | 'postgresql' | 'mock') || 'supabase',
      connection: null, // Will be set based on environment
      config: {
        caching: {
          enabled: process.env.DB_CACHE_ENABLED === 'true',
          ttl: parseInt(process.env.DB_CACHE_TTL || '300', 10)
        }
      }
    }
  };

  // Set up connection based on type
  if (config.database.type === 'supabase') {
    // Import Supabase client dynamically to avoid circular dependencies
    void import('@supabase/supabase-js').then(({ createClient }) => {
      config.database.connection = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || ''
      );
    });
  }

  return new DIContainer(config);
}
