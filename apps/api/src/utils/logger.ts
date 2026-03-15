// Simple logger for API
const writeLog = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>,
  error?: Error
) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data ? { data } : {}),
    ...(error
      ? {
          error: {
            message: error.message,
            name: error.name,
            ...(error.stack ? { stack: error.stack } : {}),
          },
        }
      : {}),
  }

  const line = JSON.stringify(payload)

  if (level === 'error') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  if (level === 'debug') {
    console.debug(line)
    return
  }

  console.log(line)
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    writeLog('info', message, data)
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    writeLog('warn', message, data)
  },
  error: (message: string, error?: Error, data?: Record<string, unknown>) => {
    writeLog('error', message, data, error)
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    writeLog('debug', message, data)
  },
}
