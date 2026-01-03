/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for rate limiting
 * Following enterprise-grade rate limiting patterns
 */

export interface RateLimitConfig {
  messagesPerSecond?: number;
  messagesPerMinute?: number;
  messagesPerHour?: number;
  messagesPerDay?: number;
  burstSize?: number; // Max burst allowed
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry
}

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.refillRate = refillRate;
  }

  /**
   * Try to consume tokens
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token is available
   */
  getRetryAfter(): number {
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    const msNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(msNeeded / 1000); // Convert to seconds
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Reset bucket
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Rate Limit Middleware
 */
export class RateLimitMiddleware {
  private buckets: Map<string, Map<string, TokenBucket>> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Configure rate limits for a provider
   */
  configure(providerId: string, config: RateLimitConfig): void {
    this.configs.set(providerId, config);
    
    // Initialize buckets for this provider
    const providerBuckets = new Map<string, TokenBucket>();
    
    if (config.messagesPerSecond) {
      providerBuckets.set('second', new TokenBucket(
        config.burstSize || config.messagesPerSecond,
        config.messagesPerSecond / 1000
      ));
    }
    
    if (config.messagesPerMinute) {
      providerBuckets.set('minute', new TokenBucket(
        config.burstSize || config.messagesPerMinute,
        config.messagesPerMinute / 60000
      ));
    }
    
    if (config.messagesPerHour) {
      providerBuckets.set('hour', new TokenBucket(
        config.messagesPerHour,
        config.messagesPerHour / 3600000
      ));
    }
    
    if (config.messagesPerDay) {
      providerBuckets.set('day', new TokenBucket(
        config.messagesPerDay,
        config.messagesPerDay / 86400000
      ));
    }
    
    this.buckets.set(providerId, providerBuckets);
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(providerId: string, count: number = 1): Promise<RateLimitStatus> {
    const providerBuckets = this.buckets.get(providerId);
    
    if (!providerBuckets) {
      // No rate limit configured, allow by default
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 86400000) // 1 day from now
      };
    }

    // Check all buckets
    for (const [_period, bucket] of providerBuckets.entries()) {
      if (!bucket.tryConsume(count)) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + bucket.getRetryAfter() * 1000),
          retryAfter: bucket.getRetryAfter()
        };
      }
    }

    // Get minimum remaining across all buckets
    let minRemaining = Infinity;
    let maxRetryAfter = 0;
    
    for (const bucket of providerBuckets.values()) {
      minRemaining = Math.min(minRemaining, bucket.getRemaining());
      maxRetryAfter = Math.max(maxRetryAfter, bucket.getRetryAfter());
    }

    return {
      allowed: true,
      remaining: minRemaining,
      resetAt: new Date(Date.now() + maxRetryAfter * 1000)
    };
  }

  /**
   * Get remaining quota for a provider
   */
  async getRemainingQuota(providerId: string): Promise<number> {
    const providerBuckets = this.buckets.get(providerId);
    
    if (!providerBuckets) {
      return Infinity;
    }

    let minRemaining = Infinity;
    
    for (const bucket of providerBuckets.values()) {
      minRemaining = Math.min(minRemaining, bucket.getRemaining());
    }

    return minRemaining;
  }

  /**
   * Get reset time for a provider
   */
  async getResetTime(providerId: string): Promise<Date> {
    const providerBuckets = this.buckets.get(providerId);
    
    if (!providerBuckets) {
      return new Date(Date.now() + 86400000);
    }

    let maxRetryAfter = 0;
    
    for (const bucket of providerBuckets.values()) {
      maxRetryAfter = Math.max(maxRetryAfter, bucket.getRetryAfter());
    }

    return new Date(Date.now() + maxRetryAfter * 1000);
  }

  /**
   * Update usage for a provider (called after successful send)
   */
  async updateUsage(providerId: string, count: number): Promise<void> {
    // Token bucket already updates on tryConsume
    // This is a no-op but kept for interface compatibility
    return;
  }

  /**
   * Reset rate limits for a provider
   */
  resetLimits(providerId: string): void {
    const providerBuckets = this.buckets.get(providerId);
    
    if (providerBuckets) {
      for (const bucket of providerBuckets.values()) {
        bucket.reset();
      }
    }
  }

  /**
   * Remove rate limit configuration for a provider
   */
  removeProvider(providerId: string): void {
    this.buckets.delete(providerId);
    this.configs.delete(providerId);
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get configuration for a provider
   */
  getConfig(providerId: string): RateLimitConfig | undefined {
    return this.configs.get(providerId);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly retryAfter: number,
    public readonly resetAt: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Helper function to wait for rate limit reset
 */
export async function waitForRateLimit(retryAfter: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}

/**
 * Decorator for rate-limited operations
 */
export function rateLimit(middleware: RateLimitMiddleware, providerId: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const status = await middleware.checkLimit(providerId);
      
      if (!status.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for provider ${providerId}`,
          providerId,
          status.retryAfter || 0,
          status.resetAt
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
