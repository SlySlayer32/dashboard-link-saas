import type { RequestContext } from '../types/hono';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: RequestContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}

// Simple logger implementation
// In production, you might want to replace this with pino or winston
export class Logger {
  private context?: RequestContext;

  constructor(context?: RequestContext) {
    this.context = context;
  }

  private createLogEntry(level: LogEntry['level'], message: string, error?: Error, metadata?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as Error & { code?: string }).code || 'UNKNOWN'
      } : undefined,
      metadata
    };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, undefined, metadata);
    this.write(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, undefined, metadata);
    this.write(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, undefined, metadata);
    this.write(entry);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, error, metadata);
    this.write(entry);
  }

  private write(entry: LogEntry): void {
    const logLine = JSON.stringify(entry);
    
    // In development, pretty print
    if (process.env.NODE_ENV === 'development') {
      const prettyEntry = {
        ...entry,
        timestamp: new Date(entry.timestamp).toLocaleString(),
        context: entry.context ? {
          ...entry.context,
          userId: entry.context.userId?.substring(0, 8) + '...',
          organizationId: entry.context.organizationId?.substring(0, 8) + '...'
        } : undefined
      };
      console.log(`[${entry.level.toUpperCase()}]`, prettyEntry);
    } else {
      console.log(logLine);
    }
  }

  // Create a child logger with additional context
  child(context: Partial<RequestContext>): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

// Default logger instance
export const logger = new Logger();

// Request-specific logger factory
export const createRequestLogger = (context: RequestContext): Logger => {
  return new Logger(context);
};
