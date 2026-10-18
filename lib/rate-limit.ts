/**
 * In-memory rate limiter utility for Builder Portal.
 * Protects login, registration, OTP endpoints, and public uploads.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);

  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Checks whether key is within rate limits.
 * @param key       Unique identifier (e.g. `login:${ip}`)
 * @param max       Max requests allowed within windowMs
 * @param windowMs  Window length in milliseconds
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, newEntry);
    return { allowed: true, remaining: max - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

/**
 * Extracts client IP from standard reverse proxy and CDN headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1'
  );
}
