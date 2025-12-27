import type { RequestContext } from '../types/hono'
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  context?: RequestContext
  error?: {
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, unknown>
}
export declare class Logger {
  private context?
  constructor(context?: RequestContext)
  private createLogEntry
  debug(message: string, metadata?: Record<string, unknown>): void
  info(message: string, metadata?: Record<string, unknown>): void
  warn(message: string, metadata?: Record<string, unknown>): void
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void
  private write
  child(context: Partial<RequestContext>): Logger
}
export declare const logger: Logger
export declare const createRequestLogger: (context: RequestContext) => Logger
//# sourceMappingURL=logger.d.ts.map
