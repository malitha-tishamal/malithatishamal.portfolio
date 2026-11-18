import { unzipSync } from "fflate";

/**
 * Safe extraction of an uploaded landing-page ZIP.
 *
 * Everything here is pure (no filesystem / network) so the security rules can
 * be unit-tested: path traversal, absolute paths, forbidden types, zip-bomb
 * limits, wrapper folders and the mandatory root `index.html`.
 */

export const LANDING_LIMITS = {
  maxFiles: 2000,
  maxTotalUnzippedBytes: 300 * 1024 * 1024,
  maxSingleFileBytes: 25 * 1024 * 1024,
  maxPathLength: 512,
} as const;

export const MIME_BY_EXTENSION: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  webmanifest: "application/manifest+json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  eot: "application/vnd.ms-fontobject",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

/** Server-side / executable types are rejected outright (not silently dropped). */
const FORBIDDEN_EXTENSIONS = new Set([
  "php", "php3", "php4", "php5", "phtml", "phar",
  "exe", "dll", "bat", "cmd", "com", "msi", "scr", "vbs", "vbe", "wsf", "ps1",
  "sh", "bash", "zsh", "cgi", "pl", "py", "rb", "jar", "class", "jsp", "asp",
  "aspx", "htaccess", "conf", "sql", "env", "pem", "key", "crt", "p12",
]);

export interface ExtractedFile {
  path: string;
  data: Uint8Array;
  contentType: string;
}

export interface ExtractResult {
  files: ExtractedFile[];
  totalBytes: number;
  skippedCount: number;
  wrapperFolder: string | null;
}

export class LandingZipError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "LandingZipError";
    this.code = code;
  }
}

export const extensionOf = (path: string): string => {
  const base = path.split("/").pop() || "";
  const idx = base.lastIndexOf(".");
  return idx > 0 ? base.slice(idx + 1).toLowerCase() : "";
};

/**
 * Normalise a ZIP entry name to a relative POSIX path. Throws on traversal,
 * absolute paths, drive letters, control characters and overlong paths.
 */
export function normalizeZipEntryPath(rawName: string): string {
  if (!rawName) throw new LandingZipError("bad-path", "ZIP contains an unnamed entry.");
  if (rawName.length > LANDING_LIMITS.maxPathLength) {
    throw new LandingZipError("bad-path", `ZIP entry path is too long: ${rawName.slice(0, 80)}…`);
  }
  if (/[\u0000-\u001f]/.test(rawName)) {
    throw new LandingZipError("bad-path", "ZIP contains a path with control characters.");
  }
  // eslint-disable-next-line no-control-regex
  const name = rawName.replace(/\\/g, "/");
  if (name.startsWith("/") || /^[a-zA-Z]:\//.test(name)) {
    throw new LandingZipError("bad-path", `ZIP contains an absolute path: ${rawName}`);
  }
  if (name.endsWith("/")) return name; // directory marker, handled by the caller
  const parts = name.split("/");
  const clean: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      throw new LandingZipError("traversal", `ZIP contains path traversal: ${rawName}`);
    }
    clean.push(part);
  }
  if (clean.length === 0) throw new LandingZipError("bad-path", "ZIP contains an empty path.");
  return clean.join("/");
}

const isJunkPath = (path: string) =>
  path === ".DS_Store" ||
  path.startsWith("__MACOSX/") ||
  path.endsWith("/.DS_Store") ||
  path.endsWith("/Thumbs.db") ||
  path === "Thumbs.db";

/**
 * Strip a single wrapper folder: `site/index.html` → `index.html`, but only
 * when the archive has exactly one top-level directory.
 */
export function stripWrapperFolder(paths: string[]): {
  prefix: string | null;
  paths: string[];
} {
  if (paths.includes("index.html")) return { prefix: null, paths };
  const tops = new Set(paths.map((p) => p.split("/")[0]));
  if (tops.size !== 1) return { prefix: null, paths };
  const [top] = [...tops];
  const nested = paths.filter((p) => p.startsWith(`${top}/`));
  if (!nested.some((p) => p === `${top}/index.html`)) {
    return { prefix: null, paths };
  }
  return {
    prefix: top,
    paths: nested.map((p) => p.slice(top.length + 1)),
  };
}

/** Remove script vectors from SVG files before they are published. */
export function sanitizeSvg(source: string): string {
  return source
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*script\b[^>]*\/\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi, "")
    .replace(/\s(?:xlink:)?href\s*=\s*("|')\s*(?:javascript|vbscript|data:text\/html)[^"']*\1/gi, "")
    .replace(/<\s*foreignObject\b[\s\S]*?<\s*\/\s*foreignObject\s*>/gi, "");
}

export interface ExtractOptions {
  maxFiles?: number;
  maxTotalUnzippedBytes?: number;
  maxSingleFileBytes?: number;
}

/**
 * Extract a ZIP held in memory with every safety check applied *before* the
 * data is inflated (sizes come from the ZIP directory, so a zip bomb cannot
 * allocate memory first).
 */
export function extractLandingZip(
  zipData: Uint8Array,
  options: ExtractOptions = {}
): ExtractResult {
  const maxFiles = options.maxFiles ?? LANDING_LIMITS.maxFiles;
  const maxTotal = options.maxTotalUnzippedBytes ?? LANDING_LIMITS.maxTotalUnzippedBytes;
  const maxSingle = options.maxSingleFileBytes ?? LANDING_LIMITS.maxSingleFileBytes;

  const errors: string[] = [];
  const accepted = new Map<string, number>(); // normalized path -> original size
  let skippedCount = 0;
  let declaredTotal = 0;

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(zipData, {
      filter: (file) => {
        // Directory entries carry no data.
        if (file.name.endsWith("/") || file.name.endsWith("\\")) return false;

        let path: string;
        try {
          path = normalizeZipEntryPath(file.name);
        } catch (err) {
          errors.push(
            err instanceof LandingZipError ? err.message : "Invalid path inside ZIP."
          );
          return false;
        }

        if (isJunkPath(path)) {
          skippedCount += 1;
          return false;
        }

        const ext = extensionOf(path);
        if (FORBIDDEN_EXTENSIONS.has(ext)) {
          errors.push(`Forbidden file type ".${ext}" inside ZIP: ${path}`);
          return false;
        }
        if (!MIME_BY_EXTENSION[ext]) {
          // Unknown types are dropped, not fatal (e.g. .psd, .DS_Store, sources).
          skippedCount += 1;
          return false;
        }

        if (file.compression !== 0 && file.compression !== 8) {
          errors.push(`Unsupported compression for ${path} (only store/deflate allowed).`);
          return false;
        }
        if (file.originalSize > maxSingle) {
          errors.push(
            `File too large after unzip: ${path} (${formatBytes(file.originalSize)} > ${formatBytes(maxSingle)}).`
          );
          return false;
        }
        declaredTotal += file.originalSize;
        if (declaredTotal > maxTotal) {
          errors.push(
            `Unzipped content is too large (over ${formatBytes(maxTotal)}).`
          );
          return false;
        }
        if (accepted.size >= maxFiles) {
          errors.push(`ZIP contains more than ${maxFiles} files.`);
          return false;
        }

        const key = path.toLowerCase();
        if (accepted.has(key)) {
          errors.push(`ZIP contains duplicate file: ${path}`);
          return false;
        }
        accepted.set(key, file.originalSize);
        return true;
      },
    });
  } catch (err) {
    if (errors.length === 0) {
      errors.push("The ZIP file is corrupt or uses an unsupported compression method.");
    }
    throw new LandingZipError("invalid-zip", errors[0]);
  }

  if (errors.length > 0) {
    throw new LandingZipError("rejected", errors[0]);
  }
  if (accepted.size === 0) {
    throw new LandingZipError("empty", "The ZIP file contains no publishable web files.");
  }

  // `unzipped` is keyed by the archive's original names; map the normalised
  // (lower-cased) path back to both the original name and its bytes.
  const byNormalized = new Map<string, { originalName: string; data: Uint8Array }>();
  for (const sourceName of Object.keys(unzipped)) {
    let normalized: string;
    try {
      normalized = normalizeZipEntryPath(sourceName);
    } catch {
      continue;
    }
    byNormalized.set(normalized.toLowerCase(), {
      originalName: normalized,
      data: unzipped[sourceName],
    });
  }

  const entries = [...byNormalized.values()];
  const wrapper = stripWrapperFolder(entries.map((entry) => entry.originalName));
  const prefix = wrapper.prefix;
  const dataByPath = new Map(entries.map((entry) => [entry.originalName, entry.data]));

  const files: ExtractedFile[] = [];
  let totalBytes = 0;
  for (const entryPath of wrapper.paths) {
    const entryData = dataByPath.get(prefix ? `${prefix}/${entryPath}` : entryPath);
    if (!entryData) continue;
    const relative =
      prefix && entryPath.startsWith(`${prefix}/`)
        ? entryPath.slice(prefix.length + 1)
        : entryPath;
    let data = entryData;
    const ext = extensionOf(relative);
    if (ext === "svg") {
      data = new TextEncoder().encode(
        sanitizeSvg(new TextDecoder().decode(data))
      );
    }
    totalBytes += data.byteLength;
    files.push({
      path: relative,
      data,
      contentType: MIME_BY_EXTENSION[ext] || "application/octet-stream",
    });
  }

  if (!files.some((f) => f.path === "index.html")) {
    throw new LandingZipError(
      "no-index",
      "The ZIP must contain an index.html at its root (or inside a single top-level folder)."
    );
  }

  return {
    files,
    totalBytes,
    skippedCount,
    wrapperFolder: prefix,
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
