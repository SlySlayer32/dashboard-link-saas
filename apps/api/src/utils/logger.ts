// Simple logger for API
export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, data)
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, data)
  },
  error: (message: string, error?: Error, data?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, error, data)
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    console.debug(`[DEBUG] ${message}`, data)
  },
}
