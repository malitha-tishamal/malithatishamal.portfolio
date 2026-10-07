/**
 * Input validation & normalization helpers for API routes.
 * All untrusted client input must pass through these before use.
 */

// Pragmatic email regex — rejects control chars, spaces, multiple @, etc.
const EMAIL_RE = /^[^\s@,;:<>()[\]\\"]+@[^\s@,;:<>()[\]\\"]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

/** Strip control characters (incl. CR/LF used for header injection) and trim. */
export function cleanString(value: unknown, maxLen = 2000): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLen);
}

/**
 * Guard against SMTP header injection: reject any value containing CR/LF or
 * other control characters that could add extra mail headers.
 */
export function isSafeHeaderValue(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u001F\u007F]/.test(value);
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
