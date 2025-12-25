/**
 * Utility functions for loading states
 */

type Timeout = ReturnType<typeof setTimeout>

/**
 * Creates a promise that resolves after a minimum delay
 * Useful for preventing flickering on fast operations
 */
export const withMinDelay = async <T>(promise: Promise<T>, minDelay: number = 500): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, minDelay)),
  ])
  return result
}

/**
 * Creates a debounced loading state
 * Prevents loading indicators from showing for very brief operations
 */
export const createDelayedLoader = (
  setLoading: (loading: boolean) => void,
  delay: number = 200
) => {
  let timeoutId: Timeout

  return {
    start: () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setLoading(true), delay)
    },
    stop: () => {
      clearTimeout(timeoutId)
      setLoading(false)
    },
    cancel: () => {
      clearTimeout(timeoutId)
    },
  }
}

/**
 * Checks if an operation is "fast" (completed within threshold)
 * Returns true if the operation completed faster than the threshold
 */
export const isFastOperation = async <T>(
  operation: () => Promise<T>,
  threshold: number = 100
): Promise<{ result: T; wasFast: boolean }> => {
  const startTime = Date.now()
  const result = await operation()
  const duration = Date.now() - startTime

  return {
    result,
    wasFast: duration < threshold,
  }
}

/**
 * Creates a loading state manager with automatic minimum display time
 * Ensures loading states are visible for at least a minimum duration
 * to prevent jarring flashes
 */
export const createLoadingManager = (minDisplayTime: number = 300) => {
  let startTime: number | null = null
  let minDisplayTimeout: Timeout | null = null

  return {
    start: () => {
      startTime = Date.now()
    },
    end: (callback: () => void) => {
      if (!startTime) {
        callback()
        return
      }

      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDisplayTime - elapsed)

      if (remaining > 0) {
        minDisplayTimeout = setTimeout(callback, remaining)
      } else {
        callback()
      }
    },
    clear: () => {
      if (minDisplayTimeout) {
        clearTimeout(minDisplayTimeout)
        minDisplayTimeout = null
      }
      startTime = null
    },
  }
}
