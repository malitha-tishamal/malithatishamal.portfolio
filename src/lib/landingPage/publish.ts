import { createHash } from "node:crypto";
import type { LandingPageManifest, LandingPageVersion } from "@/types/landingPage";
import {
  KEEP_LANDING_VERSIONS,
  MAX_LANDING_ZIP_BYTES,
  landingPagePath,
  landingPageStoragePrefix,
} from "@/types/landingPage";
import { getFirestoreDoc, patchFirestoreDoc } from "@/lib/firestoreRest";
import {
  deleteStagedZip,
  getLandingStorage,
  putMany,
  readStagedZip,
  type LandingStorage,
} from "./storage";
import { readManifest, writeManifest } from "./manifest";
import { extractLandingZip, LandingZipError } from "./zip";

export type ZipSource =
  | { kind: "cloudinary"; url: string; publicId?: string }
  | { kind: "staging"; token: string };

export class PublishError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const versionId = () => {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS
  const rand = createHash("sha1")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 4);
  return `v${stamp}-${rand}`;
};

export const isSafeCloudinaryUrl = (rawUrl: string): boolean => {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "res.cloudinary.com") return false;
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    if (!cloud) return false;
    return url.pathname.startsWith(`/${cloud}/raw/upload/`);
  } catch {
    return false;
  }
};

async function loadZip(source: ZipSource): Promise<{ bytes: Uint8Array; publicId?: string }> {
  if (source.kind === "staging") {
    const bytes = await readStagedZip(source.token);
    if (!bytes) throw new PublishError("The uploaded ZIP is no longer available. Please upload it again.", 410);
    return { bytes };
  }
  if (!isSafeCloudinaryUrl(source.url)) {
    throw new PublishError("Invalid ZIP location.", 400);
  }
  const resp = await fetch(source.url, { cache: "no-store" });
  if (!resp.ok) {
    throw new PublishError(`Could not download the uploaded ZIP (${resp.status}).`, 502);
  }
  const bytes = new Uint8Array(await resp.arrayBuffer());
  return { bytes, publicId: source.publicId };
}

interface ProjectRecord {
  title?: string;
  landingPageSlug?: string;
  showBackToPortfolio?: boolean;
  landingPageVersions?: LandingPageVersion[];
}

export interface PublishResult {
  slug: string;
  version: LandingPageVersion;
  fileCount: number;
  totalBytes: number;
  skippedCount: number;
  wrapperFolder: string | null;
  manifest: LandingPageManifest;
}

export interface PublishOptions {
  projectId: string;
  slug: string;
  source: ZipSource;
  idToken: string;
  storage?: LandingStorage;
}

/**
 * Download → validate/unzip → publish → update the manifest and the project.
 * The new version only becomes live once every file has been written.
 */
export async function publishLandingPage(
  options: PublishOptions
): Promise<PublishResult> {
  const storage = options.storage || getLandingStorage();
  const { projectId, slug, idToken } = options;

  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) {
    throw new PublishError("Invalid project slug.", 400);
  }

  const project = await getFirestoreDoc<ProjectRecord>(`projects/${projectId}`, {
    cache: "no-store",
  });
  if (!project) throw new PublishError("Project not found.", 404);
  if (project.landingPageSlug && project.landingPageSlug !== slug) {
    throw new PublishError(
      "This project already owns a different landing-page slug.",
      409
    );
  }

  const existingManifest = await readManifest(slug, { idToken });
  if (existingManifest && existingManifest.projectId !== projectId) {
    throw new PublishError(
      `The slug "${slug}" is already used by another project. Change the project title or slug.`,
      409
    );
  }

  const { bytes, publicId } = await loadZip(options.source);
  if (bytes.byteLength > MAX_LANDING_ZIP_BYTES) {
    throw new PublishError(
      `The ZIP is larger than the ${Math.round(MAX_LANDING_ZIP_BYTES / (1024 * 1024))} MB limit.`,
      413
    );
  }

  let extracted;
  try {
    extracted = extractLandingZip(bytes);
  } catch (err) {
    if (err instanceof LandingZipError) {
      const message =
        err.code === "no-index"
          ? err.message
          : `Upload rejected: ${err.message}`;
      throw new PublishError(message, 422);
    }
    throw err;
  }

  const id = versionId();
  const prefix = landingPageStoragePrefix(slug, id);

  try {
    await putMany(
      storage,
      extracted.files.map((file) => ({
        key: `${prefix}/${file.path}`,
        data: file.data,
        contentType: file.contentType,
      }))
    );
  } catch (err) {
    await storage.removePrefix(prefix).catch(() => 0);
    throw new PublishError(
      `Storing the landing page files failed: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
      500
    );
  }

  const version: LandingPageVersion = {
    id,
    createdAt: new Date().toISOString(),
    fileCount: extracted.files.length,
    totalBytes: extracted.totalBytes,
    status: "ready",
    zipUrl: options.source.kind === "cloudinary" ? options.source.url : undefined,
    zipPublicId:
      options.source.kind === "cloudinary" ? publicId : undefined,
  };

  const previousVersions = (existingManifest?.versions || []).filter(
    (v) => v.id !== id
  );
  const keptVersions = [version, ...previousVersions].slice(0, KEEP_LANDING_VERSIONS);
  const droppedVersions = [version, ...previousVersions].slice(KEEP_LANDING_VERSIONS);

  const manifest: LandingPageManifest = {
    slug,
    projectId,
    projectTitle: project.title || existingManifest?.projectTitle || "",
    currentVersion: id,
    backButton:
      project.showBackToPortfolio ??
      existingManifest?.backButton ??
      true,
    versions: keptVersions,
    updatedAt: new Date().toISOString(),
  };

  try {
    await writeManifest(manifest, idToken);
  } catch (err) {
    await storage.removePrefix(prefix).catch(() => 0);
    throw new PublishError(
      `Saving the landing page manifest failed: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
      500
    );
  }

  await patchFirestoreDoc(
    `projects/${projectId}`,
    {
      landingPageSlug: slug,
      landingPageUrl: landingPagePath(slug),
      landingPageVersion: id,
      landingPageUploadedAt: version.createdAt,
      landingPageStatus: "ready",
      landingPageFileCount: version.fileCount,
      landingPageTotalBytes: version.totalBytes,
      landingPageVersions: keptVersions,
      showBackToPortfolio: manifest.backButton,
    },
    idToken
  );

  // Old versions are deleted only after the new one is confirmed live.
  await pruneVersions(storage, slug, droppedVersions);

  if (options.source.kind === "staging") {
    await deleteStagedZip(options.source.token);
  }

  return {
    slug,
    version,
    fileCount: version.fileCount,
    totalBytes: version.totalBytes,
    skippedCount: extracted.skippedCount,
    wrapperFolder: extracted.wrapperFolder,
    manifest,
  };
}

async function pruneVersions(
  storage: LandingStorage,
  slug: string,
  versions: LandingPageVersion[]
): Promise<void> {
  for (const version of versions) {
    await storage
      .removePrefix(landingPageStoragePrefix(slug, version.id))
      .catch(() => 0);
    if (version.zipPublicId) {
      await storage.remove(version.zipPublicId).catch(() => undefined);
    }
  }
}

export interface ActivateResult {
  manifest: LandingPageManifest;
  version: LandingPageVersion;
}

export async function activateLandingVersion(options: {
  projectId: string;
  slug: string;
  versionId: string;
  idToken: string;
}): Promise<ActivateResult> {
  const manifest = await readManifest(options.slug, { idToken: options.idToken });
  if (!manifest) throw new PublishError("No landing page exists for this project.", 404);
  if (manifest.projectId !== options.projectId) {
    throw new PublishError("This landing page belongs to another project.", 403);
  }
  const version = manifest.versions.find((v) => v.id === options.versionId);
  if (!version) throw new PublishError("Version not found.", 404);
  if (version.status !== "ready") {
    throw new PublishError("Only a ready version can be activated.", 409);
  }

  const updated: LandingPageManifest = {
    ...manifest,
    currentVersion: version.id,
    updatedAt: new Date().toISOString(),
  };
  await writeManifest(updated, options.idToken);

  await patchFirestoreDoc(
    `projects/${options.projectId}`,
    {
      landingPageUrl: landingPagePath(options.slug),
      landingPageVersion: version.id,
      landingPageStatus: "ready",
      landingPageUploadedAt: version.createdAt,
      landingPageFileCount: version.fileCount,
      landingPageTotalBytes: version.totalBytes,
      landingPageVersions: updated.versions,
    },
    options.idToken
  );

  return { manifest: updated, version };
}

export async function removeLandingPage(options: {
  projectId: string;
  slug: string;
  idToken: string;
}): Promise<{ removedFiles: number }> {
  const storage = getLandingStorage();
  const manifest = await readManifest(options.slug, { idToken: options.idToken });
  if (manifest && manifest.projectId !== options.projectId) {
    throw new PublishError("This landing page belongs to another project.", 403);
  }

  const removedFiles = await storage.removePrefix(
    landingPageStoragePrefix(options.slug)
  );
  for (const version of manifest?.versions || []) {
    if (version.zipPublicId) {
      await storage.remove(version.zipPublicId).catch(() => undefined);
    }
  }
  if (storage.driver === "cloudinary") {
    await storage.removePrefix(`landing-page-zips/${options.slug}`).catch(() => 0);
  }

  const { deleteManifest } = await import("./manifest");
  await deleteManifest(options.slug, options.idToken);

  await patchFirestoreDoc(
    `projects/${options.projectId}`,
    {
      landingPageSlug: undefined,
      landingPageUrl: undefined,
      landingPageVersion: undefined,
      landingPageUploadedAt: undefined,
      landingPageStatus: undefined,
      landingPageFileCount: undefined,
      landingPageTotalBytes: undefined,
      landingPageVersions: undefined,
    },
    options.idToken
  );

  return { removedFiles };
}
