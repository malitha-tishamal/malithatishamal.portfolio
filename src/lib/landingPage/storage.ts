import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Storage for published landing-page files.
 *
 * Two drivers:
 *  • `local`      – files on disk (dev / self-hosted Node). Default.
 *  • `cloudinary` – every file is stored as a Cloudinary `raw` asset and the
 *                   public route proxies it. Needed on read-only hosts such as
 *                   Vercel, because Cloudinary itself does not serve HTML sites.
 *
 * Keys always look like `landing-pages/{slug}/{versionId}/{relativePath}`.
 */

export type LandingStorageDriverName = "local" | "cloudinary";

export interface LandingStorage {
  readonly driver: LandingStorageDriverName;
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
  removePrefix(prefix: string): Promise<number>;
}

export const LOCAL_STORAGE_ROOT = () =>
  process.env.LANDING_PAGE_STORAGE_DIR ||
  path.join(process.cwd(), ".landing-pages");

const STAGING_ROOT = () =>
  process.env.LANDING_PAGE_STAGING_DIR ||
  path.join(os.tmpdir(), "malithatishamal-landing-zips");

const safeJoin = (root: string, key: string): string => {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, key);
  if (target !== resolvedRoot && !target.startsWith(resolvedRoot + path.sep)) {
    throw new Error("Invalid storage key.");
  }
  return target;
};

const removeDirRecursive = async (dir: string): Promise<number> => {
  let count = 0;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir, { recursive: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile()) count += 1;
    } catch {
      /* ignore */
    }
  }
  await fs.rm(dir, { recursive: true, force: true });
  return count;
};

class LocalLandingStorage implements LandingStorage {
  readonly driver = "local" as const;

  async put(key: string, data: Uint8Array): Promise<void> {
    const target = safeJoin(LOCAL_STORAGE_ROOT(), key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      const data = await fs.readFile(safeJoin(LOCAL_STORAGE_ROOT(), key));
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await fs.rm(safeJoin(LOCAL_STORAGE_ROOT(), key), { force: true });
  }

  async removePrefix(prefix: string): Promise<number> {
    return removeDirRecursive(safeJoin(LOCAL_STORAGE_ROOT(), prefix));
  }
}

const cloudinaryEnv = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  return { cloudName, apiKey, apiSecret, uploadPreset };
};

/** Everything that must be signed, sorted by key, plus the API secret. */
export const cloudinarySignature = (params: Record<string, string>, secret: string) => {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
};

class CloudinaryLandingStorage implements LandingStorage {
  readonly driver = "cloudinary" as const;
  private readonly concurrency = 6;

  private credentials() {
    const env = cloudinaryEnv();
    if (!env.cloudName) {
      throw new Error(
        "Cloudinary storage selected but NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set."
      );
    }
    if (!env.apiSecret && !env.uploadPreset) {
      throw new Error(
        "Cloudinary storage needs either CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET (signed) or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (unsigned)."
      );
    }
    return env;
  }

  async put(key: string, data: Uint8Array, contentType: string): Promise<void> {
    const { cloudName, apiKey, apiSecret, uploadPreset } = this.credentials();
    const form = new FormData();
    const file = new Blob([data], { type: contentType });
    form.append("file", file, path.posix.basename(key));
    form.append("public_id", key);
    form.append("overwrite", "true");
    form.append("invalidate", "true");

    if (apiSecret && apiKey) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = cloudinarySignature(
        { invalidate: "true", overwrite: "true", public_id: key, timestamp },
        apiSecret
      );
      form.append("api_key", apiKey);
      form.append("timestamp", timestamp);
      form.append("signature", signature);
    } else {
      form.append("upload_preset", uploadPreset);
    }

    const resp = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/upload`,
      { method: "POST", body: form }
    );
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(
        `Cloudinary upload failed (${resp.status}) for ${key}${detail ? `: ${detail.slice(0, 300)}` : ""}`
      );
    }
  }

  private deliveryUrl(key: string) {
    const { cloudName } = this.credentials();
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/raw/upload/${encoded}`;
  }

  async get(key: string): Promise<Uint8Array | null> {
    const resp = await fetch(this.deliveryUrl(key), { cache: "no-store" });
    if (!resp.ok) return null;
    return new Uint8Array(await resp.arrayBuffer());
  }

  async remove(key: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = this.credentials();
    if (!apiKey || !apiSecret) {
      console.warn(
        `[landing-page] Cannot delete Cloudinary asset "${key}" without CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.`
      );
      return;
    }
    const auth = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/raw/upload?public_ids=${encodeURIComponent(
        key
      )}`,
      { method: "DELETE", headers: { Authorization: auth } }
    ).catch(() => undefined);
  }

  async removePrefix(prefix: string): Promise<number> {
    const { cloudName, apiKey, apiSecret } = this.credentials();
    if (!apiKey || !apiSecret) {
      console.warn(
        `[landing-page] Cannot delete Cloudinary assets under "${prefix}" without CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.`
      );
      return 0;
    }
    const auth = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    let removed = 0;
    let cursor: string | undefined;
    do {
      const url = new URL(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/raw/upload`
      );
      url.searchParams.set("prefix", `${prefix}/`);
      url.searchParams.set("max_results", "500");
      if (cursor) url.searchParams.set("next_cursor", cursor);
      const resp = await fetch(url, { headers: { Authorization: auth }, cache: "no-store" });
      if (!resp.ok) break;
      const data = (await resp.json()) as {
        resources?: { public_id: string }[];
        next_cursor?: string;
      };
      const ids = (data.resources || []).map((r) => r.public_id);
      if (ids.length > 0) {
        const del = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/raw/upload?public_ids=${ids
            .map(encodeURIComponent)
            .join(",")}`,
          { method: "DELETE", headers: { Authorization: auth } }
        );
        if (del.ok) removed += ids.length;
      }
      cursor = data.next_cursor;
    } while (cursor);
    return removed;
  }
}

let localSingleton: LocalLandingStorage | null = null;
let cloudSingleton: CloudinaryLandingStorage | null = null;

export function getLandingStorage(): LandingStorage {
  const configured = (process.env.LANDING_PAGE_STORAGE || "local").toLowerCase();
  if (configured === "cloudinary") {
    if (!cloudSingleton) cloudSingleton = new CloudinaryLandingStorage();
    return cloudSingleton;
  }
  if (!localSingleton) localSingleton = new LocalLandingStorage();
  return localSingleton;
}

/** Write into the bookkeeping (shared by `putMulti` batching helpers). */
export async function putMany(
  storage: LandingStorage,
  files: { key: string; data: Uint8Array; contentType: string }[],
  concurrency = 6
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
    while (index < files.length) {
      const current = files[index++];
      await storage.put(current.key, current.data, current.contentType);
    }
  });
  await Promise.all(workers);
}

// ── ZIP staging (only used when files are uploaded straight to this server) ──

const isValidToken = (token: string) => /^[a-f0-9-]{36}$/i.test(token);

export async function stageZip(buffer: Uint8Array): Promise<{ token: string; bytes: number }> {
  const token = randomUUID();
  const dir = STAGING_ROOT();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(safeJoin(dir, `${token}.zip`), buffer);
  return { token, bytes: buffer.byteLength };
}

export async function readStagedZip(token: string): Promise<Uint8Array | null> {
  if (!isValidToken(token)) return null;
  try {
    const data = await fs.readFile(safeJoin(STAGING_ROOT(), `${token}.zip`));
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } catch {
    return null;
  }
}

export async function deleteStagedZip(token: string): Promise<void> {
  if (!isValidToken(token)) return;
  await fs.rm(safeJoin(STAGING_ROOT(), `${token}.zip`), { force: true }).catch(() => {});
}
