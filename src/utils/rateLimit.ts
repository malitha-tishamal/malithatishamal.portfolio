/**
 * Lightweight in-memory sliding-window rate limiter for API routes.
 *
 * NOTE: state is per-process. On a single Node/WAMP server this is effective.
 * On multi-instance serverless deployments, back this with Redis/Upstash for
 * a global limit. It still raises the cost of abuse meaningfully as-is.
 */

type Bucket = { count: number; resetAt: number };

const stores = new Map<string, Map<string, Bucket>>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * @param key      unique bucket namespace, e.g. "contact" or "newsletter"
 * @param id       caller identity, typically the client IP
 * @param limit    max requests allowed in the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  id: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  let store = stores.get(key);
  if (!store) {
    store = new Map();
    stores.set(key, store);
  }

  const now = Date.now();
  const bucket = store.get(id);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(id, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Best-effort client IP extraction from a Request. */
export function getClientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-client-ip") ||
    "unknown"
  );
}

/** Occasional cleanup so the store cannot grow unbounded. */
export function sweepExpired(key: string): void {
  const store = stores.get(key);
  if (!store) return;
  const now = Date.now();
  for (const [id, b] of store) {
    if (b.resetAt <= now) store.delete(id);
  }
}
