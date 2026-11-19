/**
 * Server-side reads of the public content collections.
 *
 * Public pages are Server Components that fetch here, so visitors get real
 * HTML (and an eager LCP image) instead of an empty shell that waits for the
 * Firestore SDK to boot in the browser. Cache tags let the admin revalidate a
 * single collection on publish.
 */
import { getFirestoreCollection, getFirestoreDoc } from "@/lib/firestoreRest";
import type { ProjectItem } from "@/types/project";
import type { PortfolioItem } from "@/types/portfolio";
import type { BlogPost } from "@/types/blog";
import { defaultBlogPosts } from "@/types/blog";
import type { FooterContent } from "@/types/footer";
import { defaultFooterContent } from "@/types/footer";
import type { FeaturedProjectsSettings } from "@/types/featuredProjects";
import {
  FEATURED_PROJECTS_DEFAULTS,
  FEATURED_PROJECTS_DOC_PATH,
  normalizeFeaturedProjectsSettings,
} from "@/types/featuredProjects";
import { isPostVisible, sortPostsByDate } from "@/utils/blogPosts";
import { toDateValue } from "@/utils/relativeTime";

export const CACHE_TAGS = {
  projects: "projects",
  portfolio: "portfolio",
  blogs: "blogs",
  certifications: "certifications",
  services: "services",
  tech: "tech-stack",
  site: "site-content",
} as const;

const REVALIDATE_SECONDS = 300;

export const getProjectsServer = async (): Promise<ProjectItem[]> => {
  try {
    const rows = await getFirestoreCollection<ProjectItem>("projects", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.projects],
    });
    return rows.sort((a, b) => {
      const aTime = toDateValue(a.updatedAt || a.createdAt)?.getTime() ?? 0;
      const bTime = toDateValue(b.updatedAt || b.createdAt)?.getTime() ?? 0;
      return bTime - aTime || (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  } catch (error) {
    console.error("Server read failed for projects:", (error as Error).message);
    return [];
  }
};

const normalizePortfolioCategory = (category: string): string => {
  const value = category.trim();
  if (
    value === "Health & Lifestyle Community" ||
    value === "Events & wins" ||
    value === "Events , wins & Achivements"
  ) {
    return "Events";
  }
  return value;
};

export const getPortfolioServer = async (): Promise<PortfolioItem[]> => {
  try {
    const rows = await getFirestoreCollection<PortfolioItem>("portfolio", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.portfolio],
    });
    return rows
      .map((item) => ({
        ...item,
        subtitle: normalizePortfolioCategory(item.subtitle || "Events"),
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error("Server read failed for portfolio:", (error as Error).message);
    return [];
  }
};

export const getBlogsServer = async (): Promise<BlogPost[]> => {
  const fallback = () =>
    sortPostsByDate(defaultBlogPosts.filter((post) => isPostVisible(post)));
  try {
    const rows = await getFirestoreCollection<BlogPost>("blogs", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.blogs],
    });
    const visible = sortPostsByDate(rows.filter((post) => isPostVisible(post)));
    return visible.length > 0 ? visible : fallback();
  } catch (error) {
    console.error("Server read failed for blogs:", (error as Error).message);
    return fallback();
  }
};

export const getPortfolioCategoriesServer = async (): Promise<string[]> => {
  try {
    const doc = await getFirestoreDoc<{ categories?: unknown }>(
      "siteContent/portfolioCategories",
      { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAGS.portfolio] }
    );
    const categories = doc?.categories;
    return Array.isArray(categories)
      ? categories.filter((value): value is string => typeof value === "string" && !!value)
      : [];
  } catch (error) {
    console.error(
      "Server read failed for portfolio categories:",
      (error as Error).message
    );
    return [];
  }
};

const SECRET_FOOTER_KEYS = [
  "gmailSmtpAppPassword",
  "gmailSmtpUser",
  "gmailNotificationRecipient",
  "gmailSmtpEnabled",
  "newsletterNotificationEmail",
] as const;

export const getFooterContentServer = async (): Promise<FooterContent> => {
  try {
    const doc = await getFirestoreDoc<Record<string, unknown>>("siteContent/footer", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.site],
    });
    if (!doc) return defaultFooterContent;
    const clean = { ...doc };
    SECRET_FOOTER_KEYS.forEach((key) => delete clean[key]);
    return { ...defaultFooterContent, ...(clean as unknown as FooterContent) };
  } catch (error) {
    console.error("Server read failed for footer:", (error as Error).message);
    return defaultFooterContent;
  }
};

export const getVisitorCountServer = async (): Promise<number> => {
  try {
    const doc = await getFirestoreDoc<{ totalVisitors?: number }>(
      "siteContent/visitorCounter",
      { revalidate: 60, tags: [CACHE_TAGS.site] }
    );
    return typeof doc?.totalVisitors === "number" ? doc.totalVisitors : 0;
  } catch {
    return 0;
  }
};

export const getFeaturedProjectsSettingsServer =
  async (): Promise<FeaturedProjectsSettings> => {
    try {
      const doc = await getFirestoreDoc<Record<string, unknown>>(
        FEATURED_PROJECTS_DOC_PATH,
        { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAGS.site] }
      );
      return doc
        ? normalizeFeaturedProjectsSettings(doc)
        : FEATURED_PROJECTS_DEFAULTS;
    } catch {
      return FEATURED_PROJECTS_DEFAULTS;
    }
  };
