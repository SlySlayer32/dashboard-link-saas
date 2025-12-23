import { Context, Next } from 'hono';

/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 60000);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

const limiter = new RateLimiter();

// Cleanup every minute
setInterval(() => limiter.cleanup(), 60000);

/**
 * Rate limiting middleware
 * Default: 100 requests per minute per IP
 */
export function rateLimitMiddleware(limit = 100, windowMs = 60000) {
  return async (c: Context, next: Next) => {
    // Get client IP (handle proxies)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0] || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    const key = `ratelimit:${ip}`;
    
    if (!limiter.check(key, limit, windowMs)) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    
    await next();
  };
}

/**
 * Strict rate limiter for SMS endpoints
 * 5 requests per minute to prevent abuse
 */
export const smsRateLimitMiddleware = rateLimitMiddleware(5, 60000);
