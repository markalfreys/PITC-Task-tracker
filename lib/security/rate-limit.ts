export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
}

// Allows `limit` requests per `windowMs` for each client. Kept in memory.
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function makeRoom(time: number) {
    for (const [key, window] of windows) {
      if (window.resetAt <= time) windows.delete(key);
    }
    // Still full: drop the oldest clients.
    while (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest === undefined) break;
      windows.delete(oldest);
    }
  }

  return {
    check(key) {
      const time = now();
      let window = windows.get(key);

      if (!window || window.resetAt <= time) {
        windows.delete(key);
        if (windows.size >= maxKeys) makeRoom(time);
        window = { count: 0, resetAt: time + windowMs };
        windows.set(key, window);
      }

      window.count += 1;

      return {
        allowed: window.count <= limit,
        remaining: Math.max(0, limit - window.count),
        retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - time) / 1000)),
      };
    },
  };
}
