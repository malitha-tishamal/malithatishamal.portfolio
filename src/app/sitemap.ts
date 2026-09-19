import { MetadataRoute } from 'next';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://malithatishamal.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;
  
  // Static pages with their priorities and update frequencies
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/#about`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#services`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#testimonials`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/#contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/#blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Dynamic content from Firestore
  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // Fetch blog posts
    const blogsQuery = query(
      collection(db, 'blogs'),
      orderBy('publishedAt', 'desc'),
      limit(50)
    );
    const blogsSnapshot = await getDocs(blogsQuery);
    
    blogsSnapshot.forEach((doc) => {
      const data = doc.data();
      const publishedAt = data.publishedAt?.toDate?.() || new Date();
      const slug = data.slug || doc.id;
      
      dynamicPages.push({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: data.updatedAt?.toDate?.() || publishedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    });

    // Fetch projects
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      const slug = data.slug || doc.id;
      
      dynamicPages.push({
        url: `${baseUrl}/projects/${slug}`,
        lastModified: data.updatedAt?.toDate?.() || createdAt,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      });
    });

    // Fetch portfolio items
    const portfolioQuery = query(
      collection(db, 'portfolio'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const portfolioSnapshot = await getDocs(portfolioQuery);
    
    portfolioSnapshot.forEach((doc) => {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() || new Date();
      const slug = data.slug || doc.id;
      
      dynamicPages.push({
        url: `${baseUrl}/portfolio/${slug}`,
        lastModified: updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      });
    });

  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    // Return static pages only if dynamic content fails
  }

  return [...staticPages, ...dynamicPages];
}