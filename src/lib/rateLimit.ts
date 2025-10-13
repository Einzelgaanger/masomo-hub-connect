/**
 * Client-side rate limiting utility
 * Prevents excessive API calls and protects against abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier for the rate limit (e.g., 'upload', 'message', 'api:endpoint')
   * @param config - Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous entry or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Within window, check count
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset in milliseconds
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    if (!entry) return null;
    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // File uploads: 10 per minute
  UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },
  
  // Messages: 30 per minute
  MESSAGE: { maxRequests: 30, windowMs: 60 * 1000 },
  
  // Comments: 20 per minute
  COMMENT: { maxRequests: 20, windowMs: 60 * 1000 },
  
  // Likes/reactions: 50 per minute
  REACTION: { maxRequests: 50, windowMs: 60 * 1000 },
  
  // Search queries: 30 per minute
  SEARCH: { maxRequests: 30, windowMs: 60 * 1000 },
  
  // Profile updates: 5 per minute
  PROFILE_UPDATE: { maxRequests: 5, windowMs: 60 * 1000 },
  
  // Authentication attempts: 5 per 5 minutes
  AUTH: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
} as const;

/**
 * Decorator/wrapper for rate-limited functions
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  config: RateLimitConfig,
  onRateLimited?: () => void
): T {
  return ((...args: Parameters<T>) => {
    if (!rateLimiter.checkLimit(key, config)) {
      const resetTime = rateLimiter.getResetTime(key);
      const resetSeconds = resetTime ? Math.ceil(resetTime / 1000) : 0;
      
      if (onRateLimited) {
        onRateLimited();
      } else {
        throw new Error(
          `Rate limit exceeded. Please try again in ${resetSeconds} seconds.`
        );
      }
      return;
    }
    return fn(...args);
  }) as T;
}
