/** Small helper for calling the admin-only API routes with the Firebase token. */

export class AdminApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function adminJson<T>(
  url: string,
  options: { method?: string; body?: unknown; token: string }
): Promise<T> {
  const resp = await fetch(url, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let payload: any = null;
  try {
    payload = await resp.json();
  } catch {
    payload = null;
  }
  if (!resp.ok) {
    throw new AdminApiError(
      payload?.error || `Request failed (${resp.status}).`,
      resp.status
    );
  }
  return payload as T;
}

export const formatMegabytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${mb.toFixed(1)} MB` : `${mb.toFixed(2)} MB`;
};
