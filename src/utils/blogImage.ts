/**
 * Client-side guard for blog cover images, used by the admin editor on save.
 * A reachability probe through <img> works cross-origin; content-type and size
 * checks run on top when the response is readable.
 */

export const MAX_BLOG_COVER_BYTES = 5 * 1024 * 1024;

export interface CoverCheck {
  ok: boolean;
  error?: string;
}

export function isValidCoverImageSource(source: string): boolean {
  const value = (source || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function loadImage(src: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.Image === "undefined") {
      resolve(true);
      return;
    }
    const image = new window.Image();
    let settled = false;
    let timer = 0;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      window.clearTimeout(timer);
      resolve(ok);
    };
    timer = window.setTimeout(() => finish(false), timeoutMs);
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    image.src = src;
  });
}

export async function checkCoverImage(source: string, timeoutMs = 8000): Promise<CoverCheck> {
  const value = (source || "").trim();
  if (!isValidCoverImageSource(value)) {
    return { ok: false, error: "Cover image must be a reachable URL or a /path." };
  }

  if (!(await loadImage(value, timeoutMs))) {
    return { ok: false, error: "Cover image URL is not reachable." };
  }

  try {
    const response = await fetch(value, { method: "GET" });
    if (response.ok) {
      const type = (response.headers.get("content-type") || "").toLowerCase();
      if (type && !type.startsWith("image/")) {
        return { ok: false, error: "Cover image must be an image file (PNG, JPG, WebP…)." };
      }
      const length = Number(response.headers.get("content-length") || 0);
      if (Number.isFinite(length) && length > MAX_BLOG_COVER_BYTES) {
        return { ok: false, error: "Cover image must be 5 MB or smaller." };
      }
    }
  } catch {
    // Opaque or CORS-blocked response: the <img> probe already proved it renders.
  }

  return { ok: true };
}
