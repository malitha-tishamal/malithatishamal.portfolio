/**
 * Minimal Firestore REST client used by server routes.
 *
 * Why REST instead of firebase-admin: this project deliberately ships no
 * service-account key. Reads of public content use the public Web API key
 * (the collections are world-readable), and writes forward the signed-in
 * admin's Firebase ID token so Firestore Security Rules are still enforced.
 */

export type FirestoreValue = Record<string, unknown>;

interface FetchOptions {
  idToken?: string;
  revalidate?: number;
  tags?: string[];
  cache?: RequestCache;
}

const projectId = () =>
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "";

const apiKey = () =>
  process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

export const firestoreDocUrl = (docPath: string) => {
  const project = projectId();
  if (!project) throw new Error("Firebase project id is not configured.");
  const clean = docPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${clean}`;
};

const authHeaders = (idToken?: string): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  return headers;
};

const withKey = (url: string) => {
  const key = apiKey();
  if (!key) throw new Error("Firebase API key is not configured.");
  return `${url}?key=${encodeURIComponent(key)}`;
};

export type ToFirestoreValue = Record<string, unknown>;

export function toFirestoreFields(
  input: Record<string, unknown>
): Record<string, ToFirestoreValue> {
  const fields: Record<string, ToFirestoreValue> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

export function toFirestoreValue(value: unknown): ToFirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => toFirestoreValue(v)) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) },
    };
  }
  return { nullValue: null };
}

export function fromFirestoreValue(value: any): unknown {
  if (!value || typeof value !== "object") return null;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    const values = value.arrayValue?.values || [];
    return values.map((v: any) => fromFirestoreValue(v));
  }
  if ("mapValue" in value) {
    return fromFirestoreFields(value.mapValue?.fields || {});
  }
  return null;
}

export function fromFirestoreFields(
  fields: Record<string, any> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields || {})) {
    out[key] = fromFirestoreValue(value);
  }
  return out;
}

/** Read a document. Returns null on 404. */
export async function getFirestoreDoc<T = Record<string, unknown>>(
  docPath: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const url = options.idToken
    ? firestoreDocUrl(docPath)
    : withKey(firestoreDocUrl(docPath));
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    headers: authHeaders(options.idToken),
    cache: options.cache ?? (options.revalidate ? undefined : "no-store"),
    next:
      options.revalidate !== undefined
        ? { revalidate: options.revalidate, tags: options.tags }
        : undefined,
  };
  const resp = await fetch(url, init);
  if (resp.status === 404) return null;
  if (!resp.ok) {
    throw new Error(`Firestore read failed (${resp.status}) for ${docPath}`);
  }
  const data = (await resp.json()) as { fields?: Record<string, any> };
  return fromFirestoreFields(data.fields) as T;
}

/** Read every document in a collection (public content only). */
export async function getFirestoreCollection<T = Record<string, unknown>>(
  collectionId: string,
  options: FetchOptions & { limit?: number } = {}
): Promise<Array<T & { id: string }>> {
  const project = projectId();
  if (!project) return [];
  const url = withKey(
    `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:runQuery`
  );
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  };
  if (options.limit) structuredQuery.limit = options.limit;

  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method: "POST",
    headers: authHeaders(options.idToken),
    cache: options.cache ?? (options.revalidate !== undefined ? undefined : "no-store"),
    next:
      options.revalidate !== undefined
        ? { revalidate: options.revalidate, tags: options.tags }
        : undefined,
    body: JSON.stringify({ structuredQuery }),
  };

  const resp = await fetch(url, init);
  if (!resp.ok) {
    throw new Error(`Firestore query failed (${resp.status}) for ${collectionId}`);
  }
  const rows = (await resp.json()) as Array<{
    document?: { name: string; fields?: Record<string, any> };
  }>;
  const out: Array<T & { id: string }> = [];
  for (const row of rows) {
    if (!row.document) continue;
    const id = row.document.name.split("/").pop() || "";
    out.push({ id, ...(fromFirestoreFields(row.document.fields) as T) } as T & {
      id: string;
    });
  }
  return out;
}

/**
 * Create/merge a document with the admin's ID token. Fields listed in
 * `deleteFields` (or set to `undefined`) are removed from the document.
 */
export async function patchFirestoreDoc(
  docPath: string,
  fields: Record<string, unknown>,
  idToken: string,
  deleteFields: string[] = []
): Promise<void> {
  const cleanFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      deleteFields.push(key);
    } else {
      cleanFields[key] = value;
    }
  }
  const mask = [...Object.keys(cleanFields), ...deleteFields];
  const url = new URL(firestoreDocUrl(docPath));
  for (const field of mask) url.searchParams.append("updateMask.fieldPaths", field);
  const resp = await fetch(url.toString(), {
    method: "PATCH",
    headers: authHeaders(idToken),
    cache: "no-store",
    body: JSON.stringify({ fields: toFirestoreFields(cleanFields) }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(
      `Firestore write failed (${resp.status}) for ${docPath}${detail ? `: ${detail.slice(0, 300)}` : ""}`
    );
  }
}

export async function deleteFirestoreDoc(
  docPath: string,
  idToken: string
): Promise<void> {
  const resp = await fetch(firestoreDocUrl(docPath), {
    method: "DELETE",
    headers: authHeaders(idToken),
    cache: "no-store",
  });
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Firestore delete failed (${resp.status}) for ${docPath}`);
  }
}
