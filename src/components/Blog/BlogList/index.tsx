"use client";

import React, { useState, useEffect, useMemo } from "react";
import BlogCard from "@/components/SharedComponent/Blog/blogCard";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost, BLOG_CATEGORIES, defaultBlogPosts } from "@/types/blog";

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchPosts = async () => {
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

          list.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          if (list.length > 0) {
            setPosts(list);
          }
        }
      } catch (err) {
        console.error("Error fetching blog list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Collect all unique categories from posts
  const availableCategories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    BLOG_CATEGORIES.forEach((c) => cats.add(c));
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCategory =
        selectedCategory === "All" || p.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  return (
    <section className="flex flex-wrap justify-center pt-8 pb-20 dark:bg-darkmode" id="blog-list">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* Search & Filter Controls Bar */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-gray-100 dark:border-dark_border shadow-xs">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-dark dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Results count pill */}
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Showing <strong className="text-primary">{filteredPosts.length}</strong> of {posts.length} articles
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {availableCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                    : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border border-border/70 dark:border-dark_border hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Blog Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-gray-100 dark:bg-darklight p-5 h-96 animate-pulse border border-border/40 dark:border-dark_border/40 flex flex-col justify-between"
              >
                <div className="h-52 bg-gray-200 dark:bg-darkmode rounded-2xl w-full" />
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 dark:bg-darkmode rounded-md w-1/3" />
                  <div className="h-5 bg-gray-200 dark:bg-darkmode rounded-md w-4/5" />
                  <div className="h-3.5 bg-gray-200 dark:bg-darkmode rounded-md w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredPosts.map((blog, i) => (
              <div
                key={blog.id || i}
                className="w-full"
                data-aos="fade-up"
                data-aos-delay={`${(i % 3) * 100}`}
                data-aos-duration="600"
              >
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-darklight rounded-2xl border border-gray-100 dark:border-dark_border">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
              No matching articles found
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              We could not find any blog posts matching &quot;{searchQuery}&quot;. Try clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default BlogList;