/**
 * SEO Hooks for content pages - Automatic SEO generation
 */

import { useMemo } from 'react';
import { SEOContent, generateSEO, generateSitemapEntry, generateImageSEO } from '@/utils/seo/seoGenerator';

/**
 * Hook for generating SEO metadata for any content type
 */
export const useContentSEO = (content: SEOContent) => {
  const seo = useMemo(() => generateSEO(content), [content]);
  const sitemapEntry = useMemo(() => generateSitemapEntry(content), [content]);
  
  return {
    seo,
    sitemapEntry,
    metadata: {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      openGraph: seo.openGraph,
      twitter: seo.twitter,
      canonical: seo.canonicalUrl,
    },
  };
};

/**
 * Hook for blog post SEO
 */
export const useBlogSEO = (blogPost: {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: string;
  author?: string;
}) => {
  const content: SEOContent = useMemo(() => ({
    title: blogPost.title,
    description: blogPost.excerpt || blogPost.content?.substring(0, 150),
    url: `/blog/${blogPost.slug}`,
    type: 'blog',
    category: blogPost.category,
    tags: blogPost.tags,
    publishDate: blogPost.publishedAt,
    modifiedDate: blogPost.updatedAt,
    imageUrl: blogPost.featuredImage,
    author: blogPost.author,
  }), [blogPost]);

  return useContentSEO(content);
};

/**
 * Hook for project/portfolio SEO
 */
export const useProjectSEO = (project: {
  title: string;
  description: string;
  slug: string;
  category?: string;
  tags?: string[];
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  featuredImage?: string;
}) => {
  const content: SEOContent = useMemo(() => ({
    title: project.title,
    description: project.description,
    url: `/projects/${project.slug}`,
    type: 'project',
    category: project.category,
    tags: [...(project.tags || []), ...(project.technologies || [])],
    publishDate: project.createdAt,
    modifiedDate: project.updatedAt,
    imageUrl: project.featuredImage || project.images?.[0],
  }), [project]);

  return useContentSEO(content);
};

/**
 * Hook for portfolio item SEO
 */
export const usePortfolioSEO = (portfolio: {
  title: string;
  description: string;
  slug: string;
  category?: string;
  tags?: string[];
  updatedAt?: string;
  images?: string[];
}) => {
  const content: SEOContent = useMemo(() => ({
    title: portfolio.title,
    description: portfolio.description,
    url: `/portfolio/${portfolio.slug}`,
    type: 'portfolio',
    category: portfolio.category,
    tags: portfolio.tags,
    modifiedDate: portfolio.updatedAt,
    imageUrl: portfolio.images?.[0],
  }), [portfolio]);

  return useContentSEO(content);
};

/**
 * Hook for document SEO
 */
export const useDocumentSEO = (document: {
  title: string;
  description: string;
  slug: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
  thumbnail?: string;
}) => {
  const content: SEOContent = useMemo(() => ({
    title: document.title,
    description: document.description,
    url: `/docs/${document.slug}`,
    type: 'document',
    category: document.category,
    tags: document.tags,
    publishDate: document.publishedAt,
    modifiedDate: document.updatedAt,
    imageUrl: document.thumbnail,
  }), [document]);

  return useContentSEO(content);
};

/**
 * Hook for image SEO
 */
export const useImageSEO = (imageUrl: string, altText: string, context?: string) => {
  const imageSEO = useMemo(() => 
    generateImageSEO(imageUrl, altText, context), 
    [imageUrl, altText, context]
  );

  return imageSEO;
};

/**
 * Hook for generating sitemap entries from content array
 */
export const useContentSitemap = (contents: SEOContent[]) => {
  const sitemapEntries = useMemo(() => 
    contents.map(content => generateSitemapEntry(content)),
    [contents]
  );

  return sitemapEntries;
};