"use client";

import React, { useState, useEffect, useMemo } from "react";
import BlogCard, { BlogCardSkeleton } from "@/components/SharedComponent/Blog/blogCard";
import { BlogPost, BLOG_CATEGORIES, defaultBlogPosts } from "@/types/blog";
import { isPostVisible, sortPostsByDate } from "@/utils/blogPosts";

const PAGE_SIZE = 9;
const LATEST_COUNT = 6;

interface BlogListProps {
  /** Server-rendered posts (the page is statically regenerated). */
  initialPosts?: BlogPost[];
}

const resolveInitialPosts = (initialPosts?: BlogPost[]) => {
  const visible = sortPostsByDate((initialPosts || []).filter((post) => isPostVisible(post)));
  return visible.length > 0
    ? visible
    : sortPostsByDate(defaultBlogPosts.filter((post) => isPostVisible(post)));
};

const BlogList: React.FC<BlogListProps> = ({ initialPosts }) => {
  const [posts] = useState<BlogPost[]>(() => resolveInitialPosts(initialPosts));
  const loading = false;
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    document.getElementById("blog-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
                aria-label="Clear search"
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
                aria-pressed={isActive}
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
              <BlogCardSkeleton key={i} widthClass="w-full" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {pagePosts.map((blog, i) => {
                const rank = (currentPage - 1) * PAGE_SIZE + i;
                return (
                  <div key={blog.id || i} className="w-full">
                    <BlogCard
                      blog={blog}
                      widthClass="w-full"
                      latest={rank < LATEST_COUNT}
                      priority={rank === 0}
                    />
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="mt-12 flex items-center justify-center gap-2"
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border/70 dark:border-dark_border bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => goToPage(number)}
                    aria-current={number === currentPage ? "page" : undefined}
                    className={`h-10 min-w-10 px-3 rounded-xl text-sm font-bold transition ${
                      number === currentPage
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "border border-border/70 dark:border-dark_border bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-border/70 dark:border-dark_border bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </nav>
            )}
          </>
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
