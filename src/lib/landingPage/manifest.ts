import type { LandingPageManifest, LandingPageVersion } from "@/types/landingPage";
import { LANDING_PAGES_COLLECTION } from "@/types/landingPage";
import {
  deleteFirestoreDoc,
  getFirestoreDoc,
  patchFirestoreDoc,
} from "@/lib/firestoreRest";

export const manifestPath = (slug: string) =>
  `${LANDING_PAGES_COLLECTION}/${slug}`;

const asString = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;

const asNumber = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export function normalizeVersion(raw: unknown): LandingPageVersion | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const id = asString(v.id);
  if (!id) return null;
  const status =
    v.status === "ready" || v.status === "processing" || v.status === "failed"
      ? v.status
      : "failed";
  return {
    id,
    createdAt: asString(v.createdAt, new Date().toISOString()),
    fileCount: asNumber(v.fileCount),
    totalBytes: asNumber(v.totalBytes),
    status,
    zipUrl: asString(v.zipUrl) || undefined,
    zipPublicId: asString(v.zipPublicId) || undefined,
    error: asString(v.error) || undefined,
  };
}

export function normalizeManifest(raw: unknown): LandingPageManifest | null {
  if (!raw || typeof raw !== "object") return null;
  const doc = raw as Record<string, unknown>;
  const slug = asString(doc.slug);
  if (!slug) return null;
  const versions = Array.isArray(doc.versions)
    ? (doc.versions.map(normalizeVersion).filter(Boolean) as LandingPageVersion[])
    : [];
  const currentVersion = asString(doc.currentVersion) || null;
  return {
    slug,
    projectId: asString(doc.projectId),
    projectTitle: asString(doc.projectTitle),
    currentVersion,
    backButton: doc.backButton !== false,
    versions,
    updatedAt: asString(doc.updatedAt) || undefined,
  };
}

export async function readManifest(
  slug: string,
  options: { revalidate?: number; tags?: string[]; idToken?: string } = {}
): Promise<LandingPageManifest | null> {
  const doc = await getFirestoreDoc<Record<string, unknown>>(manifestPath(slug), {
    revalidate: options.revalidate,
    tags: options.tags,
    idToken: options.idToken,
  });
  return normalizeManifest(doc);
}

export async function writeManifest(
  manifest: LandingPageManifest,
  idToken: string
): Promise<void> {
  await patchFirestoreDoc(
    manifestPath(manifest.slug),
    {
      slug: manifest.slug,
      projectId: manifest.projectId,
      projectTitle: manifest.projectTitle,
      currentVersion: manifest.currentVersion,
      backButton: manifest.backButton,
      versions: manifest.versions,
      updatedAt: new Date().toISOString(),
    },
    idToken
  );
}

export async function deleteManifest(slug: string, idToken: string) {
  await deleteFirestoreDoc(manifestPath(slug), idToken);
}
