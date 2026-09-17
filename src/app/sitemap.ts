import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.com";
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/certifications`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/testimonials`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];

  // Dynamic Blog routes (automatically included when new articles are published in Firestore)
  let dynamicBlogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogSnap = await getDocs(collection(db, "blogs"));
    if (!blogSnap.empty) {
      dynamicBlogRoutes = blogSnap.docs
        .filter((d) => d.data().published !== false)
        .map((d) => {
          const data = d.data();
          return {
            url: `${baseUrl}/blog/${d.id}`,
            lastModified: data.updatedAt
              ? new Date(data.updatedAt)
              : data.date
              ? new Date(data.date)
              : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          };
        });
    }
  } catch (err) {
    console.warn("[Sitemap] Notice fetching dynamic blogs:", err);
  }

  return [...staticRoutes, ...dynamicBlogRoutes];
}
