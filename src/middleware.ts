import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Advanced edge security middleware.
 *
 * Runs on the Edge runtime BEFORE the request reaches any route/page. It is the
 * first line of defence and complements (never replaces) the Firestore rules,
 * DOMPurify sanitisation, CSP headers and per-route rate limiting.
 *
 * Responsibilities:
 *  1. Block known malicious scanner/bot user-agents.
 *  2. Reject requests carrying SQLi / XSS / command-injection / path-traversal
 *     signatures in the path, query string, referer or user-agent.
 *  3. Restrict HTTP methods to the set the app actually uses.
 *  4. Coarse per-IP rate limiting to blunt scanning / brute-force bursts.
 *
 * NOTE: node:crypto is unavailable on the Edge runtime, so no encryption happens
 * here — that lives in server routes via src/lib/crypto.ts.
 */

// ─── Edge in-memory rate limiter (per isolate, best-effort) ──────────────────
type Bucket = { count: number; reset: number };
const hits = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
}

function withinLimit(ip: string, limit: number, windowMs: number, now: number): boolean {
  const b = hits.get(ip);
  if (!b || b.reset <= now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

// ─── Detection signatures ────────────────────────────────────────────────────
const BLOCKED_UA =
  /(sqlmap|nikto|nmap|masscan|acunetix|nessus|openvas|dirbuster|dirsearch|gobuster|wfuzz|hydra|zgrab|censys|shodan|nuclei|fscan|commix|john\b|hashcat|metasploit|burpsuite)/i;

// Classic attack payloads. Deliberately narrow to avoid false positives on
// legitimate URLs (no bare quote/keyword matching).
const ATTACK_PATTERNS: RegExp[] = [
  /union[\s\S]{0,40}select/i,
  /select[\s\S]{0,40}from[\s\S]{0,40}information_schema/i,
  /(\bor\b|\band\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // or 1=1
  /['"]\s*(or|and)\s*['"]/i, // ' or '
  /;\s*(drop|delete|update|insert|alter|create|truncate|exec|shutdown)\b/i,
  /\/\*[\s\S]*?\*\//, // SQL block comment
  /<\s*script[\s>]/i,
  /<\s*iframe[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:[^,]*;base64/i,
  /on(error|load|click|mouseover|focus|submit)\s*=/i,
  /document\s*\.\s*cookie/i,
  /base64_decode\s*\(/i,
  /(\.\.\/|\.\.\\|%2e%2e)/i, // path traversal
  /%00|\x00/i, // null byte
  /etc\/passwd/i,
  /wp-(admin|login|config)/i,
  /\/(\.git|\.env|\.aws|phpmyadmin|adminer)\b/i,
  /(\bcmd\b|\bcommand\b)\s*=/i,
];

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);

function isMalicious(input: string): boolean {
  if (!input) return false;
  for (const re of ATTACK_PATTERNS) if (re.test(input)) return true;
  return false;
}

/** Best-effort URL decode — attackers percent-encode payloads (%27, %3C, %2e). */
function safeDecode(value: string): string {
  try {
    // Decode twice to catch double-encoded payloads; ignore malformed input.
    return decodeURIComponent(decodeURIComponent(value));
  } catch {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}

/** Test both the raw and percent-decoded forms of a URL component. */
function isMaliciousUrlPart(raw: string): boolean {
  if (!raw) return false;
  return isMalicious(raw) || isMalicious(safeDecode(raw));
}

function blocked(status: number, message: string): NextResponse {
  const res = NextResponse.json({ error: message }, { status });
  // Defence-in-depth: attach core headers even on our own short-circuit
  // responses (these bypass next.config headers()).
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function clientIp(req: NextRequest): string {
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

export function middleware(req: NextRequest): NextResponse {
  const now = Date.now();
  sweep(now);

  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";
  const { pathname, search } = req.nextUrl;

  // 1. Scanner / attack-tool user agents
  if (BLOCKED_UA.test(ua)) {
    return blocked(403, "Forbidden");
  }

  // 2. HTTP method restriction
  if (!ALLOWED_METHODS.has(req.method)) {
    return blocked(405, "Method Not Allowed");
  }

  // 3. Injection signatures across path, query, referer, UA
  if (
    isMaliciousUrlPart(pathname) ||
    isMaliciousUrlPart(search) ||
    isMaliciousUrlPart(referer) ||
    isMalicious(ua)
  ) {
    return blocked(403, "Forbidden");
  }

  // 4. Coarse per-IP rate limit (120 req / 10s). Route-level limiters add
  //    stricter, per-endpoint caps on top of this.
  if (!withinLimit(ip, 120, 10_000, now)) {
    return blocked(429, "Too Many Requests");
  }

  return NextResponse.next();
}

export const config = {
  // Run everywhere except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|map|txt|xml)$).*)",
  ],
};
