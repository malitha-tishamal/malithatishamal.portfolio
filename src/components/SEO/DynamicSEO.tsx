'use client';

import React from 'react';
import Head from 'next/head';
import { SEOContent, generateSEO } from '@/utils/seo/seoGenerator';

interface DynamicSEOProps {
  content: SEOContent;
  additionalMetaTags?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

/**
 * Dynamic SEO Component - Automatically generates and applies SEO metadata
 * Usage: <DynamicSEO content={seoContent} />
 */
export const DynamicSEO: React.FC<DynamicSEOProps> = ({ 
  content, 
  additionalMetaTags = [] 
}) => {
  const seo = generateSEO(content);

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords.join(', ')} />
      <meta name="author" content="Malitha Tishamal" />
      <meta name="robots" content="index, follow" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seo.canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={seo.openGraph.type} />
      <meta property="og:title" content={seo.openGraph.title} />
      <meta property="og:description" content={seo.openGraph.description} />
      <meta property="og:image" content={seo.openGraph.image} />
      <meta property="og:url" content={seo.openGraph.url} />
      <meta property="og:site_name" content={seo.openGraph.siteName} />
      <meta property="og:locale" content={seo.openGraph.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={seo.twitter.card} />
      <meta name="twitter:title" content={seo.twitter.title} />
      <meta name="twitter:description" content={seo.twitter.description} />
      <meta name="twitter:image" content={seo.twitter.image} />
      <meta name="twitter:creator" content={seo.twitter.creator} />
      <meta name="twitter:site" content={seo.twitter.site} />
      
      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta
          key={index}
          {...(tag.name && { name: tag.name })}
          {...(tag.property && { property: tag.property })}
          content={tag.content}
        />
      ))}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.structuredData) }}
      />
    </>
  );
};

/**
 * Hook for using dynamic SEO in page components
 */
export const useDynamicSEO = (content: SEOContent) => {
  const seo = generateSEO(content);
  
  return {
    seo,
    metadata: {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords.join(', '),
      openGraph: seo.openGraph,
      twitter: seo.twitter,
      canonical: seo.canonicalUrl,
    },
  };
};

export default DynamicSEO;