import React from "react";
import { Metadata } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost, defaultBlogPosts } from "@/types/blog";
import { BlogDetailView } from "@/components/Blog/BlogDetailView";
import {
  generateSeoTitle,
  generateSeoDescription,
  generateSeoKeywords,
  generateArticleSchema,
  generateBreadcrumbSchema,
  DEFAULT_SITE_URL,
} from "@/utils/seo";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPostData(slug: string): Promise<{
  post: BlogPost | null;
  allPosts: BlogPost[];
}> {
  try {
    const blogsRef = collection(db, "blogs");
    const snapshot = await getDocs(blogsRef);

    let posts: BlogPost[] = [];
    if (!snapshot.empty) {
      posts = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BlogPost, "id">),
      }));
    } else {
      posts = defaultBlogPosts;
    }

    const decodedSlug = decodeURIComponent(slug);
    const matched = posts.find(
      (p) => p.slug === slug || p.id === slug || p.slug === decodedSlug
    );

    if (matched) {
      return { post: matched, allPosts: posts };
    }

    const fallbackMatched = defaultBlogPosts.find(
      (p) => p.slug === slug || p.id === slug || p.slug === decodedSlug
    );

    return { post: fallbackMatched || null, allPosts: posts };
  } catch (err) {
    console.error("Error fetching blog post for SEO:", err);
    const decodedSlug = decodeURIComponent(slug);
    const fallbackMatched = defaultBlogPosts.find(
      (p) => p.slug === slug || p.id === slug || p.slug === decodedSlug
    );
    return { post: fallbackMatched || null, allPosts: defaultBlogPosts };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await getPostData(slug);

  if (!post) {
    return {
      title: "Article Not Found | Malitha Tishamal",
      description: "The requested technical article could not be found.",
    };
  }

  const title = generateSeoTitle(post.title, post.category);
  const description = generateSeoDescription(post.excerpt || post.content, post.title);
  const keywords = generateSeoKeywords(post.title, post.tags, post.category);
  const postUrl = `${DEFAULT_SITE_URL}/blog/${post.slug || post.id}`;
  const coverImage = post.coverImage || `${DEFAULT_SITE_URL}/images/hero/hero-image.png`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: post.author?.name || "Malitha Tishamal", url: DEFAULT_SITE_URL }],
    creator: "Malitha Tishamal",
    publisher: "Malitha Tishamal",
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: postUrl,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      authors: [post.author?.name || "Malitha Tishamal"],
      section: post.category,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
      creator: "@malithatishamal",
    },
  };
}

export default async function SingleBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const { post, allPosts } = await getPostData(slug);

  if (!post) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-32 pb-20 dark:bg-darkmode px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            404
          </div>
          <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">
            Article Not Found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            The blog article you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition"
          >
            ← Back to Blog & News
          </Link>
        </div>
      </div>
    );
  }

  const related = allPosts.filter((p) => p.id !== post.id && p.slug !== post.slug);

  const articleSchema = generateArticleSchema(post);
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog & News", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug || post.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <BlogDetailView post={post} relatedPosts={related} />
    </>
  );
}