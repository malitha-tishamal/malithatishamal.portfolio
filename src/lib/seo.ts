// src/lib/seo.ts
// Helper utilities for SEO metadata, Open Graph images and JSON‑LD structured data.

import type { Metadata } from "next";
import { generateSlug } from "@/utils/seo";

/**
 * Create a safe slug from a title.
 */
export const toSlug = (title: string): string => {
  return generateSlug(title);
};

/**
 * Build the default metadata object for a page.
 *
 * `seo` is an optional object coming from the DB. When a field is missing we fall
 * back to sensible defaults (title, description, cover image).
 */
export const buildMetadata = (params: {
  title: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  canonicalBase?: string; // e.g. https://malithatishamal.vercel.app
  seo?: {
    seo_title?: string;
    seo_description?: string;
    og_image?: string;
    canonical?: string;
    noindex?: boolean;
  };
}): Metadata => {
  const {
    title,
    description,
    slug,
    imageUrl,
    canonicalBase = "https://malithatishamal.vercel.app",
    seo = {},
  } = params;

  const seoTitle = seo.seo_title?.trim() || `${title} | Malitha Tishamal`;
  const seoDescription =
    seo.seo_description?.trim() ||
    description?.replace(/<[^>]+>/g, "").slice(0, 155).trim();
  const ogImage = seo.og_image || imageUrl;
  const canonical = seo.canonical
    ? `${canonicalBase}${seo.canonical}`
    : slug
    ? `${canonicalBase}/${slug}`
    : canonicalBase;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonical,
      siteName: "Malitha Tishamal",
      locale: "en_US",
      type: "website",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: seo.noindex === true ? false : true,
      follow: true,
    },
    alternates: {
      canonical,
    },
  };
};

/**
 * JSON‑LD helpers – each returns a plain object that can be stringified and
 * injected with <script type="application/ld+json">.
 */
export const jsonLdPerson = (params: {
  name: string;
  jobTitle: string;
  url: string;
  image: string;
  sameAs: string[];
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    jobTitle: params.jobTitle,
    url: params.url,
    image: params.image,
    sameAs: params.sameAs,
  };
};

export const jsonLdProject = (params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  dateModified?: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image,
    dateModified: params.dateModified,
  };
};

// Additional JSON‑LD generators for events, certificates, etc. can be added here.
