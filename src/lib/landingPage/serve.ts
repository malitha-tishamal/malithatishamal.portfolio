import type { LandingPageManifest } from "@/types/landingPage";
import { extensionOf, MIME_BY_EXTENSION } from "./zip";

/**
 * Request handling for published landing pages, decoupled from Next internals
 * (and from storage) so it can be unit-tested.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.vercel.app";

/**
 * The uploaded page is untrusted. `sandbox` without `allow-same-origin` gives
 * it an opaque origin: no cookies, no localStorage, no access to the portfolio
 * origin. Resource directives stay permissive because the origin barrier — not
 * the CSP — is the protection here.
 */
export const LANDING_PAGE_CSP = [
  "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads",
  "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "style-src * data: blob: 'unsafe-inline'",
  "img-src * data: blob:",
  "font-src * data:",
  "media-src * data: blob:",
  "connect-src * https: http: ws: wss:",
  "base-uri *",
  "form-action *",
  "frame-ancestors 'self'",
].join("; ");

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

export const contentTypeFor = (filePath: string): string =>
  MIME_BY_EXTENSION[extensionOf(filePath)] || "application/octet-stream";

const isHtml = (filePath: string) => {
  const ext = extensionOf(filePath);
  return ext === "html" || ext === "htm";
};

const isCss = (filePath: string) => extensionOf(filePath) === "css";

/**
 * Map the URL path segments to a storage-relative file path.
 * `/projects/{slug}/` → `index.html`; traversal and absolute paths → null.
 */
export function resolveLandingFilePath(segments?: string[]): string | null {
  const raw = segments && segments.length > 0 ? segments.join("/") : "";
  if (!raw) return "index.html";
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.length > 512) return null;
  const normalized = decoded.replace(/\\/g, "/");
  const parts: string[] = [];
  for (const part of normalized.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") return null;
    parts.push(part);
  }
  if (parts.length === 0) return "index.html";
  const joined = parts.join("/");
  if (/^[a-zA-Z]:/.test(joined)) return null;
  return normalized.endsWith("/") ? `${joined}/index.html` : joined;
}

/**
 * Root-absolute paths (`/assets/app.css`) are rewritten to the project base so
 * archives built for a domain root still work. Relative paths already resolve
 * against `/projects/{slug}/...` and are left untouched.
 *
 * Limits: only markup attributes and CSS `url()`/`@import` are rewritten — a
 * root-absolute URL built inside JavaScript at runtime is not.
 */
export function rewriteRootAbsoluteUrls(text: string, basePath: string): string {
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const prefix = (value: string) => {
    if (!value.startsWith("/") || value.startsWith("//")) return value;
    if (value.startsWith(base)) return value;
    return `${base}${value}`;
  };

  // HTML attributes: src, href, poster, action, data-src, srcset.
  let out = text.replace(
    /(\b(?:src|href|poster|action|data-src)\s*=\s*)(["'])([^"']*)\2/gi,
    (_match, lead: string, quote: string, value: string) =>
      `${lead}${quote}${prefix(value)}${quote}`
  );
  out = out.replace(
    /(\bsrcset\s*=\s*)(["'])([^"']*)\2/gi,
    (_match, lead: string, quote: string, value: string) => {
      const rewritten = value
        .split(",")
        .map((entry) => {
          const trimmed = entry.trim();
          if (!trimmed) return trimmed;
          const [url, ...descriptor] = trimmed.split(/\s+/);
          return [prefix(url), ...descriptor].join(" ");
        })
        .join(", ");
      return `${lead}${quote}${rewritten}${quote}`;
    }
  );
  // CSS: url(...) and @import "..."
  out = out.replace(
    /(@import\s+)(["'])([^"']+)\2/gi,
    (_match, lead: string, quote: string, value: string) =>
      `${lead}${quote}${prefix(value)}${quote}`
  );
  out = out.replace(
    /url\(\s*(["']?)([^)"']+)\1\s*\)/gi,
    (_match, quote: string, value: string) =>
      `url(${quote}${prefix(value.trim())}${quote})`
  );
  return out;
}

export const BACK_BUTTON_ATTR = "data-back-to-portfolio";
export const BASE_HREF_ATTR = "data-landing-base";

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Compact floating pill; inline styles keep it CSP-safe (no <style> needed). */
export function buildBackButton(siteUrl: string): string {
  const href = `${siteUrl.replace(/\/+$/, "")}/#projects`;
  return (
    `<a ${BACK_BUTTON_ATTR}="1" id="back-to-portfolio" href="${escapeAttr(href)}" ` +
    `aria-label="Back to Portfolio" ` +
    `style="position:fixed;top:12px;left:12px;z-index:2147483647;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:9999px;background:rgba(15,23,42,0.82);color:#fff;font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,0.28);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)">` +
    `<span aria-hidden="true" style="font-size:15px;line-height:1">←</span><span>Back to Portfolio</span></a>`
  );
}

/**
 * Inject the floating button right after `<body>`. Idempotent: archives that
 * already carry it (or any element with our marker) are left alone.
 *
 * `baseHref` is only passed for `index.html` documents: Next.js redirects
 * `/projects/{slug}/` to the slashless URL, so a directory base keeps relative
 * `src`/`href`/`fetch()` paths pointing at the project folder. File pages
 * (`about.html`) already resolve relative URLs correctly and get no base.
 */
export function injectLandingHtmlExtras(
  html: string,
  options: { showBackButton: boolean; siteUrl?: string; baseHref?: string }
): string {
  let out = html;

  if (options.baseHref && !/\bdata-landing-base\b/i.test(out)) {
    const baseTag = `<base ${BASE_HREF_ATTR}="1" href="${escapeAttr(options.baseHref)}">`;
    const headOpen = out.match(/<head\b[^>]*>/i);
    if (headOpen && headOpen.index !== undefined) {
      const at = headOpen.index + headOpen[0].length;
      out = out.slice(0, at) + baseTag + out.slice(at);
    } else {
      out = baseTag + out;
    }
  }

  const hasButton =
    out.includes(BACK_BUTTON_ATTR) || out.includes('id="back-to-portfolio"');
  if (!options.showBackButton || hasButton) return out;
  const button = buildBackButton(options.siteUrl || SITE_URL);
  const bodyOpen = out.match(/<body\b[^>]*>/i);
  if (bodyOpen && bodyOpen.index !== undefined) {
    const at = bodyOpen.index + bodyOpen[0].length;
    return out.slice(0, at) + button + out.slice(at);
  }
  // Fragments / minimal documents without <body>.
  return button + out;
}

export interface LandingServeDeps {
  getManifest: (slug: string) => Promise<LandingPageManifest | null>;
  readFile: (key: string) => Promise<Uint8Array | null>;
  siteUrl?: string;
}

export interface LandingServeRequest {
  slug: string;
  path?: string[];
  /** `?v={versionId}` — enables immutable caching for a pinned version. */
  pinnedVersion?: string | null;
}

const htmlResponse = (body: string, status: number, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });

export const notFoundResponse = () =>
  htmlResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Landing page not found</title></head>` +
      `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1120;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">` +
      `<div style="text-align:center;padding:24px"><p style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#60a5fa;margin:0 0 8px">404</p>` +
      `<h1 style="font-size:26px;margin:0 0 12px">This landing page is not available.</h1>` +
      `<a href="${SITE_URL}/#projects" style="display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:9999px;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600">← Back to Portfolio</a></div></body></html>`,
    404
  );

/** Full handler used by the catch-all route (and by the tests). */
export async function serveLandingPage(
  request: LandingServeRequest,
  deps: LandingServeDeps
): Promise<Response> {
  if (!SLUG_PATTERN.test(request.slug)) return notFoundResponse();

  const relative = resolveLandingFilePath(request.path);
  if (relative === null) return notFoundResponse();

  const manifest = await deps.getManifest(request.slug);
  if (!manifest || !manifest.currentVersion) return notFoundResponse();

  const version = (manifest.versions || []).find(
    (v) => v.id === manifest.currentVersion
  );
  if (!version) return notFoundResponse();
  if (version.status !== "ready") {
    return htmlResponse(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Preparing landing page…</title></head><body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0b1120;color:#fff">` +
        `<p>This landing page is still being prepared. Please try again in a moment.</p></body></html>`,
      503,
      { "Retry-After": "10" }
    );
  }

  const basePrefix = `/projects/${request.slug}`;
  const storageRoot = `landing-pages/${request.slug}/${version.id}`;

  let data = await deps.readFile(`${storageRoot}/${relative}`);
  let resolvedPath = relative;

  // Extension-less URL → try a directory index (e.g. /about → about/index.html)
  if (!data && !extensionOf(relative) && !relative.endsWith(".html")) {
    const candidate = `${relative.replace(/\/+$/, "")}/index.html`;
    const candidateData = await deps.readFile(`${storageRoot}/${candidate}`);
    if (candidateData) {
      data = candidateData;
      resolvedPath = candidate;
    }
  }

  if (!data) return notFoundResponse();

  const contentType = contentTypeFor(resolvedPath);
  const immutable =
    !!request.pinnedVersion && request.pinnedVersion === version.id;
  const cacheControl = immutable
    ? "public, max-age=31536000, immediate, immutable"
    : "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

  let body: BodyInit = data;

  if (isHtml(resolvedPath) || isCss(resolvedPath)) {
    const text = new TextDecoder().decode(data);
    let processed = rewriteRootAbsoluteUrls(text, basePrefix);
    if (isHtml(resolvedPath)) {
      const isIndexDoc = /(^|\/)index\.html$/.test(resolvedPath);
      const dir = isIndexDoc
        ? resolvedPath.slice(0, resolvedPath.length - "index.html".length)
        : "";
      const baseHref = isIndexDoc ? `${basePrefix}/${dir}` : undefined;
      processed = injectLandingHtmlExtras(processed, {
        showBackButton: manifest.backButton !== false,
        siteUrl: deps.siteUrl || SITE_URL,
        baseHref,
      });
    }
    body = processed;
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(typeof body === "string" ? new TextEncoder().encode(body).byteLength : data.byteLength),
      "Cache-Control": cacheControl,
      "Content-Security-Policy": LANDING_PAGE_CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}
