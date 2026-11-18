import type { ProjectItem } from "./project";

/** Lifecycle of the uploaded landing page ZIP on a project record. */
export type LandingPageStatus = "uploading" | "processing" | "ready" | "failed";

export interface LandingPageVersion {
  id: string;
  createdAt: string;
  fileCount: number;
  totalBytes: number;
  status: "processing" | "ready" | "failed";
  zipUrl?: string;
  zipPublicId?: string;
  error?: string;
}

/**
 * One document per slug in the public `landingPages` collection. The serving
 * route reads it to find the live version; the admin panel uses it for
 * version history / rollback.
 */
export interface LandingPageManifest {
  slug: string;
  projectId: string;
  projectTitle: string;
  currentVersion: string | null;
  backButton: boolean;
  versions: LandingPageVersion[];
  updatedAt?: string;
}

export const LANDING_PAGES_COLLECTION = "landingPages";
export const KEEP_LANDING_VERSIONS = 3;
export const MAX_LANDING_ZIP_MB = 100;
export const MAX_LANDING_ZIP_BYTES = MAX_LANDING_ZIP_MB * 1024 * 1024;

/** Storage layout shared by every driver: `landing-pages/{slug}/{versionId}/...` */
export const landingPageStoragePrefix = (slug: string, versionId?: string) =>
  versionId ? `landing-pages/${slug}/${versionId}` : `landing-pages/${slug}`;

/** Public URL of a published landing page. */
export const landingPagePath = (slug: string) => `/projects/${slug}/`;

export const slugifyProjectTitle = (title: string, fallbackId = "project") => {
  const base = (title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  if (base) return base;
  const fallback = (fallbackId || "project")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return fallback || "project";
};

const isHttpUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export interface VisitSiteTarget {
  kind: "internal" | "external";
  url: string;
}

/**
 * Resolution order: a ready uploaded landing page wins, otherwise the
 * project's external "Live Demo / Project URL". Null hides the button.
 */
export function getVisitSiteTarget(
  project: Partial<ProjectItem> | null | undefined
): VisitSiteTarget | null {
  if (!project) return null;
  if (
    project.landingPageStatus === "ready" &&
    project.landingPageUrl &&
    project.landingPageUrl.trim()
  ) {
    return { kind: "internal", url: project.landingPageUrl.trim() };
  }
  const external = project.projectUrl?.trim();
  if (external && isHttpUrl(external)) {
    return { kind: "external", url: external };
  }
  return null;
}

export const landingPageStatusLabel = (status?: LandingPageStatus) => {
  switch (status) {
    case "uploading":
      return "Uploading…";
    case "processing":
      return "Processing (unzipping)…";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return "No landing page";
  }
};
