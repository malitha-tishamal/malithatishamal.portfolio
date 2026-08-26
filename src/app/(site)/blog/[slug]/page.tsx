"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost, defaultBlogPosts } from "@/types/blog";
import { BlogDetailView } from "@/components/Blog/BlogDetailView";
import Link from "next/link";

export default function SingleBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        // Try fetching from Firestore collection "blogs"
        const blogsRef = collection(db, "blogs");
        const q = query(blogsRef);
        const querySnapshot = await getDocs(q);

        let posts: BlogPost[] = [];
        if (!querySnapshot.empty) {
          posts = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<BlogPost, "id">),
          }));
        } else {
          posts = defaultBlogPosts;
        }

        setAllPosts(posts);

        // Find matching post by slug or by id
        const matched = posts.find(
          (p) => p.slug === slug || p.id === slug || p.slug === decodeURIComponent(slug)
        );

        if (matched) {
          setPost(matched);
        } else {
          // Fallback check in defaultBlogPosts
          const fallbackMatched = defaultBlogPosts.find(
            (p) => p.slug === slug || p.id === slug || p.slug === decodeURIComponent(slug)
          );
          setPost(fallbackMatched || null);
        }
      } catch (err) {
        console.error("Error fetching blog post:", err);
        const fallbackMatched = defaultBlogPosts.find(
          (p) => p.slug === slug || p.id === slug || p.slug === decodeURIComponent(slug)
        );
        setPost(fallbackMatched || null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-20 dark:bg-darkmode">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

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

  return <BlogDetailView post={post} relatedPosts={related} />;
}