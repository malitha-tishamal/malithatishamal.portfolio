/**
 * Enterprise SEO & Structured Data Automation Engine
 * Automatically generates Google SERP-optimized titles, descriptions,
 * keywords, image alt text, and Schema.org JSON-LD structured data.
 */

export const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.com";

export const PRIMARY_KEYWORDS = [
  "Malitha Tishamal",
  "Malitha",
  "Tishamal",
  "Software Engineer",
  "Software Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Computer Networking",
  "Network Engineer",
  "Cybersecurity Specialist",
  "Cloud Architect",
  "Python Developer",
  "React Next.js Developer",
  "Linux Systems Administrator",
  "Sri Lanka Software Engineer",
];

/**
 * Generates clean, URL-safe slug
 */
export function generateSlug(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncates and cleans text to fit Google's optimal 150-160 char meta description
 */
export function generateSeoDescription(text: string, context?: string): string {
  if (!text) {
    return `Discover ${context || "engineering projects and software systems"} by Malitha Tishamal – Full Stack Developer, DevOps & Network Engineer.`;
  }
  // Strip markdown, HTML tags, and redundant whitespace
  const clean = text
    .replace(/#+\s*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= 155) return clean;
  return clean.slice(0, 152).trim() + "...";
}

/**
 * Generates an SEO title targeting Google search intent
 */
export function generateSeoTitle(title: string, categoryOrRole?: string): string {
  const cleanTitle = (title || "").trim();
  if (categoryOrRole) {
    return `${cleanTitle} – ${categoryOrRole} | Malitha Tishamal`;
  }
  return `${cleanTitle} | Malitha Tishamal – Software & Network Engineer`;
}

/**
 * Generates dynamic keywords array combining item tags with high-authority core terms
 */
export function generateSeoKeywords(
  title: string,
  tags: string[] = [],
  category?: string
): string[] {
  const custom = [
    title,
    category,
    ...tags,
    category ? `${category} by Malitha Tishamal` : "",
  ].filter(Boolean) as string[];

  const combined = Array.from(new Set([...custom, ...PRIMARY_KEYWORDS]));
  return combined;
}

/**
 * Generates descriptive, accessibility-compliant alt text for images
 */
export function generateImageAlt(
  title: string,
  categoryOrType?: string
): string {
  const main = title?.trim() || "Project Showcase";
  const cat = categoryOrType ? ` (${categoryOrType})` : "";
  return `${main}${cat} – Software & Engineering Portfolio of Malitha Tishamal`;
}

/**
 * Generates Schema.org BlogPosting / Article JSON-LD
 */
export function generateArticleSchema(post: {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  date?: string;
  updatedAt?: any;
  author?: { name?: string; avatar?: string };
}) {
  const postUrl = `${DEFAULT_SITE_URL}/blog/${post.slug || post.id}`;
  const authorName = post.author?.name || "Malitha Tishamal";

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}/#article`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${DEFAULT_SITE_URL}/#website`,
      name: "Malitha Tishamal Portfolio",
      url: DEFAULT_SITE_URL,
    },
    headline: post.title,
    description: generateSeoDescription(post.excerpt || post.content || ""),
    url: postUrl,
    mainEntityOfPage: postUrl,
    image: post.coverImage || `${DEFAULT_SITE_URL}/images/hero/hero-image.png`,
    datePublished: post.date || new Date().toISOString(),
    dateModified: post.updatedAt
      ? typeof post.updatedAt === "string"
        ? post.updatedAt
        : new Date().toISOString()
      : post.date || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
      url: DEFAULT_SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Malitha Tishamal",
      url: DEFAULT_SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SITE_URL}/icon.png`,
      },
    },
  };
}

/**
 * Generates Schema.org SoftwareApplication / CreativeWork JSON-LD for Projects
 */
export function generateProjectSchema(project: {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  description?: string;
  coverImage?: string;
  projectUrl?: string;
  githubUrl?: string;
  tags?: string[];
}) {
  const projectUrl = project.projectUrl || `${DEFAULT_SITE_URL}/projects`;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    headline: `${project.title} - ${project.subtitle || "Software System"}`,
    description: generateSeoDescription(
      project.summary || project.description || ""
    ),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform, Web, Cloud, Linux",
    url: projectUrl,
    image: project.coverImage || `${DEFAULT_SITE_URL}/images/hero/hero-image.png`,
    author: {
      "@type": "Person",
      name: "Malitha Tishamal",
      url: DEFAULT_SITE_URL,
    },
    keywords: (project.tags || []).join(", "),
  };
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(
  crumbs: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: crumb.url.startsWith("http")
        ? crumb.url
        : `${DEFAULT_SITE_URL}${crumb.url}`,
    })),
  };
}
