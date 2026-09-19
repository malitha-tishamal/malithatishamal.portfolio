/**
 * Expert SEO Generator - Automatic SEO optimization for all content types
 * This utility automatically generates optimal SEO metadata, structured data, and sitemap entries
 */

export interface SEOContent {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  imageUrl?: string;
  url: string;
  type: 'blog' | 'project' | 'portfolio' | 'document' | 'post' | 'page';
  category?: string;
  tags?: string[];
}

export interface GeneratedSEO {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    locale: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
    creator: string;
  };
  structuredData: any;
  canonicalUrl: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://malithatishamal.vercel.app';
const AUTHOR_NAME = 'Malitha Tishamal';
const AUTHOR_ROLE = 'Expert Software Developer, DevOps Engineer & Network Specialist';

/**
 * Generate optimized title based on content type and keywords
 */
export const generateOptimizedTitle = (content: SEOContent): string => {
  const { title, type, category, tags } = content;
  
  // Add category and tags for better SEO
  const categoryPart = category ? ` | ${category}` : '';
  const tagsPart = tags && tags.length > 0 ? ` | ${tags.slice(0, 2).join(', ')}` : '';
  
  // Length optimization (50-60 characters ideal)
  let optimizedTitle = `${title}${categoryPart}${tagsPart}`;
  
  if (optimizedTitle.length > 60) {
    optimizedTitle = `${title}${categoryPart}`;
  }
  
  if (optimizedTitle.length > 60) {
    optimizedTitle = title;
  }
  
  return `${optimizedTitle} | ${AUTHOR_NAME}`;
};

/**
 * Generate SEO-optimized description with keywords
 */
export const generateOptimizedDescription = (content: SEOContent): string => {
  const { description, type, keywords, tags, category } = content;
  
  // Base description
  let optimizedDesc = description;
  
  // Add type-specific context
  const typeContext = {
    blog: 'comprehensive technical blog post',
    project: 'professional software development project',
    portfolio: 'portfolio showcase',
    document: 'technical documentation',
    post: 'informative article',
    page: 'comprehensive resource'
  };
  
  // Add keywords naturally
  const mainKeywords = keywords?.slice(0, 3) || tags?.slice(0, 3) || [];
  const keywordText = mainKeywords.length > 0 
    ? ` This ${typeContext[type]} covers ${mainKeywords.join(', ')}.` 
    : '';
  
  // Add author context
  const authorContext = ` Written by ${AUTHOR_NAME}, ${AUTHOR_ROLE}.`;
  
  // Combine and optimize length (150-160 characters ideal)
  optimizedDesc = `${optimizedDesc}${keywordText}${authorContext}`;
  
  if (optimizedDesc.length > 160) {
    optimizedDesc = `${description}${keywordText}`;
  }
  
  if (optimizedDesc.length > 160) {
    optimizedDesc = description;
  }
  
  return optimizedDesc;
};

/**
 * Generate comprehensive keywords list
 */
export const generateKeywords = (content: SEOContent): string[] => {
  const { title, description, type, category, tags, keywords } = content;
  
  const baseKeywords = [
    AUTHOR_NAME,
    'Software Developer',
    'DevOps Engineer',
    'Network Engineer',
    'Full Stack Developer',
    'Software Engineering',
    'Sri Lanka'
  ];
  
  // Extract keywords from title
  const titleKeywords = extractKeywordsFromText(title);
  
  // Extract keywords from description
  const descKeywords = extractKeywordsFromText(description);
  
  // Type-specific keywords
  const typeKeywords = {
    blog: ['Technical Blog', 'Software Development Blog', 'Programming Tutorial'],
    project: ['Software Project', 'Development Project', 'Tech Project'],
    portfolio: ['Portfolio', 'Developer Portfolio', 'Project Showcase'],
    document: ['Technical Documentation', 'Dev Docs', 'Software Documentation'],
    post: ['Tech Article', 'Programming Article', 'Developer Post'],
    page: ['Resource', 'Guide', 'Tutorial']
  };
  
  // Combine all keywords
  const allKeywords = [
    ...baseKeywords,
    ...titleKeywords,
    ...descKeywords,
    ...(typeKeywords[type] || []),
    ...(category ? [category] : []),
    ...(tags || []),
    ...(keywords || [])
  ];
  
  // Remove duplicates and limit to 15-20 keywords
  return [...new Set(allKeywords)].slice(0, 20);
};

/**
 * Extract keywords from text using simple NLP
 */
const extractKeywordsFromText = (text: string): string[] => {
  if (!text) return [];
  
  // Remove common words and extract meaningful terms
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  return [...new Set(words)].slice(0, 5);
};

/**
 * Generate Open Graph metadata
 */
export const generateOpenGraph = (content: SEOContent) => {
  const { imageUrl, url, type } = content;
  
  return {
    title: generateOptimizedTitle(content),
    description: generateOptimizedDescription(content),
    image: imageUrl || `${SITE_URL}/images/hero/hero-image.png`,
    url: `${SITE_URL}${url}`,
    type: type === 'blog' ? 'article' : 'website',
    locale: 'en_US',
  };
};

/**
 * Generate Twitter Card metadata
 */
export const generateTwitterCard = (content: SEOContent) => {
  const { imageUrl, url } = content;
  
  return {
    card: 'summary_large_image',
    title: generateOptimizedTitle(content),
    description: generateOptimizedDescription(content),
    image: imageUrl || `${SITE_URL}/images/hero/hero-image.png`,
    creator: '@malithatishamal',
  };
};

/**
 * Generate structured data (JSON-LD) based on content type
 */
export const generateStructuredData = (content: SEOContent): any => {
  const { type, title, description, imageUrl, url, publishDate, modifiedDate, author, category, tags } = content;
  
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'blog' ? 'BlogPosting' : type === 'project' ? 'SoftwareApplication' : 'WebPage',
    headline: title,
    description: generateOptimizedDescription(content),
    image: imageUrl || `${SITE_URL}/images/hero/hero-image.png`,
    url: `${SITE_URL}${url}`,
    author: {
      '@type': 'Person',
      name: author || AUTHOR_NAME,
      url: SITE_URL,
      jobTitle: AUTHOR_ROLE,
    },
    publisher: {
      '@type': 'Organization',
      name: AUTHOR_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo/malitha-logo-white.png`,
    },
  };
  
  // Add type-specific fields
  if (type === 'blog' || type === 'post') {
    return {
      ...baseData,
      '@type': 'BlogPosting',
      datePublished: publishDate || new Date().toISOString(),
      dateModified: modifiedDate || new Date().toISOString(),
      keywords: tags?.join(', ') || '',
      articleSection: category || 'Technology',
      inLanguage: 'en-US',
    };
  }
  
  if (type === 'project' || type === 'portfolio') {
    return {
      ...baseData,
      '@type': 'SoftwareApplication',
      applicationCategory: category || 'Business',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        ratingCount: '1',
      },
    };
  }
  
  if (type === 'document') {
    return {
      ...baseData,
      '@type': 'TechArticle',
      datePublished: publishDate || new Date().toISOString(),
      dateModified: modifiedDate || new Date().toISOString(),
      keywords: tags?.join(', ') || '',
      proficiencyLevel: 'Expert',
    };
  }
  
  return baseData;
};

/**
 * Main SEO generator function
 */
export const generateSEO = (content: SEOContent): GeneratedSEO => {
  return {
    title: generateOptimizedTitle(content),
    description: generateOptimizedDescription(content),
    keywords: generateKeywords(content),
    openGraph: generateOpenGraph(content),
    twitter: generateTwitterCard(content),
    structuredData: generateStructuredData(content),
    canonicalUrl: `${SITE_URL}${content.url}`,
  };
};

/**
 * Generate sitemap entry for content
 */
export const generateSitemapEntry = (content: SEOContent) => {
  const priorities = {
    blog: 0.8,
    project: 0.9,
    portfolio: 0.9,
    document: 0.7,
    post: 0.8,
    page: 0.6,
  };
  
  const changeFrequencies = {
    blog: 'weekly',
    project: 'monthly',
    portfolio: 'monthly',
    document: 'monthly',
    post: 'weekly',
    page: 'monthly',
  };
  
  return {
    url: `${SITE_URL}${content.url}`,
    lastModified: content.modifiedDate || new Date(),
    changeFrequency: changeFrequencies[content.type] || 'monthly',
    priority: priorities[content.type] || 0.6,
  };
};

/**
 * Generate image SEO attributes
 */
export const generateImageSEO = (imageUrl: string, altText: string, context?: string) => {
  const optimizedAlt = context 
    ? `${altText} - ${context} by ${AUTHOR_NAME}`
    : `${altText} by ${AUTHOR_NAME}`;
  
  return {
    src: imageUrl,
    alt: optimizedAlt,
    title: altText,
    loading: 'lazy' as const,
    // Add structured data for images
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      url: imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`,
      caption: optimizedAlt,
      author: {
        '@type': 'Person',
        name: AUTHOR_NAME,
      },
    },
  };
};