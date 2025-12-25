import { useCallback, useEffect, useRef, useState } from 'react'

type Timeout = ReturnType<typeof setTimeout>

export interface UseProgressiveLoadingOptions {
  batchSize?: number
  initialBatchSize?: number
  threshold?: number
  delay?: number
}

export interface UseProgressiveLoadingReturn<T> {
  visibleItems: T[]
  loadMore: () => void
  hasMore: boolean
  reset: () => void
}

/**
 * Hook for progressively loading large lists of items
 * Improves performance by rendering items in batches
 */
export const useProgressiveLoading = <T>(
  items: T[],
  options: UseProgressiveLoadingOptions = {}
): UseProgressiveLoadingReturn<T> => {
  const { batchSize = 20, initialBatchSize = 20, threshold = 100, delay = 100 } = options

  const [visibleCount, setVisibleCount] = useState(initialBatchSize)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<Timeout>()

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = items.length > visibleCount

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    // Add a small delay to prevent UI blocking
    timeoutRef.current = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + batchSize, items.length))
      setIsLoading(false)
    }, delay)
  }, [batchSize, delay, hasMore, isLoading, items.length])

  const reset = useCallback(() => {
    setVisibleCount(initialBatchSize)
    setIsLoading(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [initialBatchSize])

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoading) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Load more when user is within threshold pixels of bottom
      if (scrollTop + windowHeight >= documentHeight - threshold) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, loadMore, threshold])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    visibleItems,
    loadMore,
    hasMore,
    reset,
  }
}
