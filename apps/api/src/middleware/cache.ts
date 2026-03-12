import { Context, Next } from 'hono'

interface CacheEntry {
  data: unknown
  timestamp: number
  etag?: string
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 100, defaultTTL = 60000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return undefined
    }

    return entry
  }

  set(key: string, data: unknown, _ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag: this.generateETag(data),
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private generateETag(data: unknown): string {
    const str = JSON.stringify(data)
    return `"${Buffer.from(str).toString('base64').slice(0, 32)}"`
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key)
      }
    }
  }

  // Get all keys (for cache invalidation)
  getKeys(): Iterable<string> {
    return this.cache.keys()
  }
}

// Global cache instance
const cache = new MemoryCache()

// Clean up expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000)

export interface CacheOptions {
  ttl?: number
  keyGenerator?: (c: Context) => string
  varyOn?: string[]
  skipCache?: (c: Context) => boolean
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 60000, // 1 minute default
    keyGenerator = (c) => c.req.url,
    varyOn = [],
    skipCache = () => false,
  } = options

  return async (c: Context, next: Next) => {
    // Skip cache for non-GET requests or when skip condition is met
    if (c.req.method !== 'GET' || skipCache(c)) {
      await next()
      return
    }

    // Generate cache key including vary parameters
    const varyParams = varyOn.map((param) => c.req.query(param) || '').join('|')
    const cacheKey = `${keyGenerator(c)}|${varyParams}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached) {
      // Set cache headers
      c.header('X-Cache', 'HIT')
      c.header('Cache-Control', `max-age=${Math.floor(ttl / 1000)}`)

      // Check ETag if available
      if (cached.etag) {
        const clientETag = c.req.header('If-None-Match')
        if (clientETag === cached.etag) {
          c.status(304)
          return c.body(null)
        }
        c.header('ETag', cached.etag)
      }

      return c.json(cached.data)
    }

    // Execute request
    await next()

    // Cache successful responses
    if (c.res.status === 200 && c.res.headers.get('Content-Type')?.includes('application/json')) {
      const responseData = await c.res.clone().json()
      cache.set(cacheKey, responseData, ttl)
      c.header('X-Cache', 'MISS')
      c.header('Cache-Control', `max-age=${Math.floor(ttl / 1000)}`)
    }
  }
}

// Specific cache configurations for different endpoints
export const createCacheConfig = (endpoint: string): CacheOptions => {
  switch (endpoint) {
    case 'dashboard':
      return { ttl: 2 * 60 * 1000 } // 2 minutes
    case 'workers':
      return { ttl: 5 * 60 * 1000 } // 5 minutes
    case 'sms-logs':
      return { ttl: 1 * 60 * 1000 } // 1 minute
    default:
      return { ttl: 60 * 1000 } // 1 minute default
  }
}

// Helper to invalidate cache
export const invalidateCache = (pattern: string | RegExp): void => {
  if (typeof pattern === 'string') {
    // Delete exact match
    cache.delete(pattern)
  } else {
    // Delete all matching keys
    const memoryCache = cache as MemoryCache
    for (const key of memoryCache.getKeys()) {
      if (pattern.test(key)) {
        cache.delete(key)
      }
    }
  }
}
