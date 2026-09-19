/**
 * SEO Automation Usage Examples
 * 
 * This file demonstrates how to use the automatic SEO generation system
 * for different content types in your application.
 */

import React from 'react';
import { DynamicSEO } from './DynamicSEO';
import { useBlogSEO, useProjectSEO, usePortfolioSEO, useDocumentSEO, useImageSEO } from '@/hooks/useContentSEO';

/**
 * Example 1: Blog Post Page with Automatic SEO
 */
export const BlogPostSEOExample: React.FC<{
  blogPost: {
    title: string;
    excerpt: string;
    content: string;
    slug: string;
    category?: string;
    tags?: string[];
    publishedAt?: string;
    updatedAt?: string;
    featuredImage?: string;
  };
}> = ({ blogPost }) => {
  const { seo } = useBlogSEO(blogPost);

  return (
    <>
      <DynamicSEO content={{
        title: blogPost.title,
        description: blogPost.excerpt,
        url: `/blog/${blogPost.slug}`,
        type: 'blog',
        category: blogPost.category,
        tags: blogPost.tags,
        publishDate: blogPost.publishedAt,
        modifiedDate: blogPost.updatedAt,
        imageUrl: blogPost.featuredImage,
      }} />
      
      {/* Your blog post content */}
      <article>
        <h1>{blogPost.title}</h1>
        <p>{blogPost.excerpt}</p>
        {/* Blog content */}
      </article>
    </>
  );
};

/**
 * Example 2: Project Page with Automatic SEO
 */
export const ProjectSEOExample: React.FC<{
  project: {
    title: string;
    description: string;
    slug: string;
    category?: string;
    tags?: string[];
    technologies?: string[];
    createdAt?: string;
    updatedAt?: string;
    featuredImage?: string;
  };
}> = ({ project }) => {
  const { seo } = useProjectSEO(project);

  return (
    <>
      <DynamicSEO content={{
        title: project.title,
        description: project.description,
        url: `/projects/${project.slug}`,
        type: 'project',
        category: project.category,
        tags: [...(project.tags || []), ...(project.technologies || [])],
        publishDate: project.createdAt,
        modifiedDate: project.updatedAt,
        imageUrl: project.featuredImage,
      }} />
      
      {/* Your project content */}
      <div>
        <h1>{project.title}</h1>
        <p>{project.description}</p>
        {/* Project content */}
      </div>
    </>
  );
};

/**
 * Example 3: Portfolio Item with Automatic SEO
 */
export const PortfolioSEOExample: React.FC<{
  portfolio: {
    title: string;
    description: string;
    slug: string;
    category?: string;
    tags?: string[];
    updatedAt?: string;
    images?: string[];
  };
}> = ({ portfolio }) => {
  const { seo } = usePortfolioSEO(portfolio);

  return (
    <>
      <DynamicSEO content={{
        title: portfolio.title,
        description: portfolio.description,
        url: `/portfolio/${portfolio.slug}`,
        type: 'portfolio',
        category: portfolio.category,
        tags: portfolio.tags,
        modifiedDate: portfolio.updatedAt,
        imageUrl: portfolio.images?.[0],
      }} />
      
      {/* Your portfolio content */}
      <div>
        <h1>{portfolio.title}</h1>
        <p>{portfolio.description}</p>
        {/* Portfolio content */}
      </div>
    </>
  );
};

/**
 * Example 4: Document Page with Automatic SEO
 */
export const DocumentSEOExample: React.FC<{
  document: {
    title: string;
    description: string;
    slug: string;
    category?: string;
    tags?: string[];
    publishedAt?: string;
    updatedAt?: string;
    thumbnail?: string;
  };
}> = ({ document }) => {
  const { seo } = useDocumentSEO(document);

  return (
    <>
      <DynamicSEO content={{
        title: document.title,
        description: document.description,
        url: `/docs/${document.slug}`,
        type: 'document',
        category: document.category,
        tags: document.tags,
        publishDate: document.publishedAt,
        modifiedDate: document.updatedAt,
        imageUrl: document.thumbnail,
      }} />
      
      {/* Your document content */}
      <div>
        <h1>{document.title}</h1>
        <p>{document.description}</p>
        {/* Document content */}
      </div>
    </>
  );
};

/**
 * Example 5: Image with Automatic SEO
 */
export const ImageSEOExample: React.FC<{
  imageUrl: string;
  altText: string;
  context?: string;
}> = ({ imageUrl, altText, context }) => {
  const imageSEO = useImageSEO(imageUrl, altText, context);

  return (
    <img
      src={imageSEO.src}
      alt={imageSEO.alt}
      title={imageSEO.title}
      loading={imageSEO.loading}
    />
  );
};

/**
 * Example 6: Custom Content Type with Manual SEO Configuration
 */
export const CustomContentSEOExample: React.FC<{
  content: {
    title: string;
    description: string;
    url: string;
    type: 'post' | 'page';
    category?: string;
    tags?: string[];
    imageUrl?: string;
  };
}> = ({ content }) => {
  return (
    <>
      <DynamicSEO content={{
        title: content.title,
        description: content.description,
        url: content.url,
        type: content.type,
        category: content.category,
        tags: content.tags,
        imageUrl: content.imageUrl,
      }} />
      
      {/* Your custom content */}
      <div>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        {/* Custom content */}
      </div>
    </>
  );
};

/**
 * Example 7: Advanced Usage with Additional Meta Tags
 */
export const AdvancedSEOExample: React.FC<{
  blogPost: {
    title: string;
    excerpt: string;
    slug: string;
    featuredImage?: string;
  };
}> = ({ blogPost }) => {
  return (
    <>
      <DynamicSEO 
        content={{
          title: blogPost.title,
          description: blogPost.excerpt,
          url: `/blog/${blogPost.slug}`,
          type: 'blog',
          imageUrl: blogPost.featuredImage,
        }}
        additionalMetaTags={[
          { name: 'article:published_time', content: new Date().toISOString() },
          { name: 'article:author', content: 'Malitha Tishamal' },
          { property: 'article:section', content: 'Technology' },
        ]}
      />
      
      {/* Your blog post content */}
      <article>
        <h1>{blogPost.title}</h1>
        <p>{blogPost.excerpt}</p>
      </article>
    </>
  );
};