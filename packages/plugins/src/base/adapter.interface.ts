import type { ScheduleItem, ScheduleRequest } from '@dashboard-link/shared'
import type { AdapterConfig, HealthStatus, TokenSet } from './adapter.types'

/**
 * Base adapter interface for all plugins
 */
export interface IAdapter {
  readonly id: string
  readonly name: string
  readonly version: string

  initialize(config: AdapterConfig): Promise<void>
  healthCheck(): Promise<HealthStatus>
  validateConfig(config: unknown): config is AdapterConfig
}

/**
 * Schedule provider interface for calendar/scheduling plugins
 */
export interface IScheduleProvider extends IAdapter {
  getSchedule(req: ScheduleRequest): Promise<ScheduleItem[]>

  // OAuth methods (optional - only for OAuth-based providers)
  getAuthUrl?(scopes: string[]): string
  exchangeToken?(code: string): Promise<TokenSet>
  refreshToken?(refreshToken: string): Promise<TokenSet>
}
