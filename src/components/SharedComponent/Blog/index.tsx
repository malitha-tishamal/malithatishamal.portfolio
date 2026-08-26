"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import BlogCard from "./blogCard";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost, defaultBlogPosts } from "@/types/blog";

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(defaultBlogPosts.slice(0, 3));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsRef = collection(db, "blogs");
        const q = query(blogsRef);
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const list: BlogPost[] = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<BlogPost, "id">),
            }))
            .filter((p) => p.published !== false);

          // Sort by order ascending or date descending
          list.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          if (list.length > 0) {
            setPosts(list.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Error fetching homepage blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <section className="flex flex-wrap justify-center py-16 md:py-20 dark:bg-darkmode" id="blog">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
              Insights & Articles
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-midnight_text dark:text-white">
              Latest blog & news
            </h2>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/80 dark:border-dark_border bg-white dark:bg-darklight text-midnight_text dark:text-white font-semibold text-sm hover:border-primary hover:text-primary dark:hover:text-primary transition group shadow-xs cursor-pointer"
          >
            <span>View More</span>
            <span className="transition-transform group-hover:translate-x-1">
              <Icon icon="solar:arrow-right-outline" width="20" height="20" />
            </span>
          </Link>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {posts.map((blog, i) => (
            <div
              key={blog.id || i}
              className="w-full"
              data-aos="fade-up"
              data-aos-delay={`${i * 150}`}
              data-aos-duration="800"
            >
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;