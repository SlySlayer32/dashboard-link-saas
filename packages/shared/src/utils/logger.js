// Simple logger implementation
// In production, you might want to replace this with pino or winston
export class Logger {
  constructor(context) {
    this.context = context
  }
  createLogEntry(level, message, error, metadata) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: error.code || 'UNKNOWN',
          }
        : undefined,
      metadata,
    }
  }
  debug(message, metadata) {
    const entry = this.createLogEntry('debug', message, undefined, metadata)
    this.write(entry)
  }
  info(message, metadata) {
    const entry = this.createLogEntry('info', message, undefined, metadata)
    this.write(entry)
  }
  warn(message, metadata) {
    const entry = this.createLogEntry('warn', message, undefined, metadata)
    this.write(entry)
  }
  error(message, error, metadata) {
    const entry = this.createLogEntry('error', message, error, metadata)
    this.write(entry)
  }
  write(entry) {
    const logLine = JSON.stringify(entry)
    // In development, pretty print
    if (process.env.NODE_ENV === 'development') {
      const prettyEntry = {
        ...entry,
        timestamp: new Date(entry.timestamp).toLocaleString(),
        context: entry.context
          ? {
              ...entry.context,
              userId: entry.context.userId?.substring(0, 8) + '...',
              organizationId: entry.context.organizationId?.substring(0, 8) + '...',
            }
          : undefined,
      }
      console.log(`[${entry.level.toUpperCase()}]`, prettyEntry)
    } else {
      console.log(logLine)
    }
  }
  // Create a child logger with additional context
  child(context) {
    return new Logger({ ...this.context, ...context })
  }
}
// Default logger instance
export const logger = new Logger()
// Request-specific logger factory
export const createRequestLogger = (context) => {
  return new Logger(context)
}
//# sourceMappingURL=logger.js.map
