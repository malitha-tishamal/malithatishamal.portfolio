import { getVerifiedAdminEmail } from "./adminAuth";
import { NextResponse } from "next/server";

/**
 * Shared helpers for the admin-only landing-page / settings API routes.
 */

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, bucket] of buckets) {
      if (bucket.reset <= now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export const clientIp = (req: Request): string => {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
};

export interface AdminContext {
  email: string;
  idToken: string;
}

/**
 * Verify the bearer token and the admin allowlist. Returns either the identity
 * (including the raw ID token, needed for token-scoped Firestore writes) or a
 * ready-made 401/403/429 response.
 */
export async function requireAdmin(
  req: Request,
  options: { bucket: string; limit?: number; windowMs?: number }
): Promise<{ admin: AdminContext } | { response: NextResponse }> {
  const ip = clientIp(req);
  const limited = rateLimit(
    `${options.bucket}:${ip}`,
    options.limit ?? 20,
    options.windowMs ?? 60_000
  );
  if (!limited.ok) {
    return {
      response: NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      ),
    };
  }

  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized. Admin sign-in required." },
        { status: 401 }
      ),
    };
  }
  const idToken = match[1].trim();
  const email = await getVerifiedAdminEmail(req);
  if (!email) {
    return {
      response: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }
  return { admin: { email, idToken } };
}
