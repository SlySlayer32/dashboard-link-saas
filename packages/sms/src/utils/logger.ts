/**
 * Structured logging for SMS service
 * Following enterprise logging best practices
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  [key: string]: unknown;
  provider?: string;
  messageId?: string;
  operation?: string;
  duration?: number;
  error?: Error | string;
}

/**
 * SMS Logger
 * Provides structured logging with metadata support
 */
export class SMSLogger {
  private serviceName: string;
  private minLevel: LogLevel;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(serviceName: string = 'SMS', minLevel: LogLevel = 'info') {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: LogMetadata): void {
    this.log('debug', message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogMetadata): void {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogMetadata): void {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | string, meta?: LogMetadata): void {
    const errorMeta: LogMetadata = {
      ...meta,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    };
    this.log('error', message, errorMeta);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, meta?: LogMetadata): void {
    if (this.logLevels[level] < this.logLevels[this.minLevel]) {
      return; // Skip if below minimum level
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...meta
    };

    // In production, send to logging service (e.g., CloudWatch, Datadog)
    // For now, use console
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'log';
    
    console[consoleMethod](JSON.stringify(logEntry, null, 2));
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogMetadata): SMSLogger {
    const childLogger = new SMSLogger(this.serviceName, this.minLevel);
    
    // Wrap log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, meta?: LogMetadata) => {
      originalLog(level, message, { ...additionalContext, ...meta });
    };
    
    return childLogger;
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Default SMS logger instance
export const smsLogger = new SMSLogger('SMS', 'info');

/**
 * Measure execution time of async operations
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: SMSLogger = smsLogger
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info(`Operation completed: ${operation}`, { operation, duration });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Operation failed: ${operation}`, error as Error, { operation, duration });
    
    throw error;
  }
}

/**
 * Log SMS operation
 */
export function logSMSOperation(
  operation: string,
  provider: string,
  messageId?: string,
  metadata?: LogMetadata
): void {
  smsLogger.info(`SMS ${operation}`, {
    operation,
    provider,
    messageId,
    ...metadata
  });
}

/**
 * Log SMS error
 */
export function logSMSError(
  operation: string,
  error: Error | string,
  provider?: string,
  messageId?: string,
  metadata?: LogMetadata
): void {
  smsLogger.error(`SMS ${operation} failed`, error, {
    operation,
    provider,
    messageId,
    ...metadata
  });
}
