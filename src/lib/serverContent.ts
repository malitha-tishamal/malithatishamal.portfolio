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
import type { CertificationItem } from "@/types/certification";
import { defaultCertifications } from "@/types/certification";
import { getCertificateIssueDate } from "@/utils/certificateDate";
import type { ExperienceItem } from "@/types/experience";
import { defaultExperiences } from "@/types/experience";
import type { ServiceItem, ServicesSectionContent } from "@/types/service";
import { defaultServices, defaultServicesContent } from "@/types/service";
import type { TechItem, TechCategory, TechStackSection } from "@/types/techstack";
import { defaultTechStackSection, defaultCategories } from "@/types/techstack";
import type { HeroContent } from "@/types/hero";
import { defaultHeroContent } from "@/types/hero";
import type { TestimonialItem } from "@/types/testimonial";
import { defaultTestimonials } from "@/types/testimonial";

export const CACHE_TAGS = {
  projects: "projects",
  portfolio: "portfolio",
  blogs: "blogs",
  certifications: "certifications",
  services: "services",
  tech: "tech-stack",
  site: "site-content",
  experiences: "experiences",
  testimonials: "testimonials",
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

export const getCertificationsServer = async (): Promise<CertificationItem[]> => {
  try {
    const rows = await getFirestoreCollection<CertificationItem>("certifications", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.certifications],
    });
    const valid = rows
      .filter((c) => c.published !== false)
      .sort((a, b) => {
        const aTime = getCertificateIssueDate(a)?.getTime() ?? 0;
        const bTime = getCertificateIssueDate(b)?.getTime() ?? 0;
        return bTime - aTime || (a.displayOrder || 0) - (b.displayOrder || 0);
      });
    return valid.length > 0 ? valid : defaultCertifications;
  } catch (error) {
    console.error("Server read failed for certifications:", (error as Error).message);
    return defaultCertifications;
  }
};

export const getExperiencesServer = async (): Promise<ExperienceItem[]> => {
  try {
    const rows = await getFirestoreCollection<ExperienceItem>("experiences", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.experiences],
    });
    const valid = rows
      .filter((e) => e.published !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return valid.length > 0 ? valid : defaultExperiences;
  } catch (error) {
    console.error("Server read failed for experiences:", (error as Error).message);
    return defaultExperiences;
  }
};

export const getServicesServer = async (): Promise<{ services: ServiceItem[]; content: ServicesSectionContent }> => {
  try {
    const [services, contentDoc] = await Promise.all([
      getFirestoreCollection<ServiceItem>("services", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.services],
      }),
      getFirestoreDoc<ServicesSectionContent>("siteContent/servicesContent", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.services],
      }),
    ]);
    const sorted = services
      .filter((s) => s.published !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return {
      services: sorted.length > 0 ? sorted : defaultServices,
      content: contentDoc ? { ...defaultServicesContent, ...contentDoc } : defaultServicesContent,
    };
  } catch (error) {
    console.error("Server read failed for services:", (error as Error).message);
    return { services: defaultServices, content: defaultServicesContent };
  }
};

export const getTechStackServer = async (): Promise<{
  items: TechItem[];
  categories: TechCategory[];
  section: TechStackSection;
}> => {
  try {
    const [items, cats, sectionDoc] = await Promise.all([
      getFirestoreCollection<TechItem>("techItems", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.tech],
      }),
      getFirestoreCollection<TechCategory>("techCategories", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.tech],
      }),
      getFirestoreDoc<TechStackSection>("siteContent/techstack", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.tech],
      }),
    ]);
    const sortedCats = cats.length > 0
      ? cats.filter((c) => c.published !== false).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      : (defaultCategories as TechCategory[]);
    const sorted = items
      .filter((i) => i.published !== false)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    return {
      items: sorted,
      categories: sortedCats,
      section: sectionDoc ? { ...defaultTechStackSection, ...sectionDoc } : defaultTechStackSection,
    };
  } catch (error) {
    console.error("Server read failed for tech stack:", (error as Error).message);
    return {
      items: [],
      categories: defaultCategories as TechCategory[],
      section: defaultTechStackSection,
    };
  }
};

export const getHeroServer = async (): Promise<HeroContent> => {
  try {
    const doc = await getFirestoreDoc<HeroContent>("siteContent/hero", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.site],
    });
    return doc ? { ...defaultHeroContent, ...doc } : defaultHeroContent;
  } catch (error) {
    console.error("Server read failed for hero:", (error as Error).message);
    return defaultHeroContent;
  }
};

export const getTestimonialsServer = async (): Promise<TestimonialItem[]> => {
  try {
    const rows = await getFirestoreCollection<TestimonialItem>("testimonials", {
      revalidate: REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.testimonials],
    });
    const valid = rows.filter((t) => t.status !== "rejected");
    return valid.length > 0 ? valid : defaultTestimonials;
  } catch (error) {
    console.error("Server read failed for testimonials:", (error as Error).message);
    return defaultTestimonials;
  }
};

export interface CounterData {
  config: any;
  testimonialCount: number;
  avgRating: number;
  projectsThisYear: number;
  totalProjects: number;
}

export const getCounterServer = async (): Promise<CounterData> => {
  try {
    const [configDoc, testimonials, projects] = await Promise.all([
      getFirestoreDoc<Record<string, unknown>>("siteContent/counter", {
        revalidate: REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.site],
      }),
      getTestimonialsServer(),
      getProjectsServer(),
    ]);

    const currentYear = new Date().getFullYear();
    const approved = testimonials.filter((t) => t.status === "approved" || !t.status);
    const calculatedRating = approved.length > 0
      ? approved.reduce((sum, t) => sum + (Number(t.rating) || 5), 0) / approved.length
      : 5;

    const thisYearProjects = projects.filter((p) => {
      const d = toDateValue(p.updatedAt || p.createdAt);
      return d ? d.getFullYear() === currentYear : false;
    });

    return {
      config: configDoc || {},
      testimonialCount: approved.length,
      avgRating: calculatedRating,
      projectsThisYear: thisYearProjects.length,
      totalProjects: projects.length,
    };
  } catch {
    return {
      config: {},
      testimonialCount: 0,
      avgRating: 5,
      projectsThisYear: 0,
      totalProjects: 0,
    };
  }
};
