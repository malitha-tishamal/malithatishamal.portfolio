// src/app/meta.tsx
// Centralised metadata generation for Next.js App Router pages.

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

/**
 * Helper to be called from each page's `export const generateMetadata = async () => {...}`.
 *
 * `params` – the route params (e.g. `{ slug: string }`).
 * `data` – the content data fetched from your DB/API for the page.
 */
export async function generatePageMetadata(params: Record<string, any>, data: any): Promise<Metadata> {
  // Common fields shared by all pages
  const base = {
    title: data?.title ?? "Malitha Tishamal",
    description: data?.description,
    slug: params?.slug,
    imageUrl: data?.coverImage ?? data?.ogImage,
    seo: {
      seo_title: data?.seoTitle,
      seo_description: data?.seoDescription,
      og_image: data?.ogImage,
      canonical: data?.canonical,
      noindex: data?.noindex,
    },
  };

  return buildMetadata(base);
}

// Example usage in a page (you can copy‑paste this pattern):
/*
export const generateMetadata = async ({ params }) => {
  const project = await getProjectBySlug(params.slug); // your data fetcher
  return await generatePageMetadata(params, project);
};
*/
