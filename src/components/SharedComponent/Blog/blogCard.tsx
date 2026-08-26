"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { format } from "date-fns";

interface BlogCardProps {
  blog: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  const { title, coverImage, excerpt, date, slug, id, category, readingTime } = blog;
  const postUrl = `/blog/${slug || id}`;

  const formattedDate = (() => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return date;
    }
  })();

  return (
    <div className="group relative bg-white dark:bg-darklight rounded-2xl overflow-hidden border border-gray-100 dark:border-dark_border hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Cover Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-darkmode">
        <Link href={postUrl} aria-label={title} className="block w-full h-full">
          <Image
            src={coverImage || "/images/blog/blog_1.png"}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        </Link>

        {/* Category Pill on Top-Left */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary text-white shadow-sm backdrop-blur-xs">
            {category || "Technology"}
          </span>
        </div>

        {/* Reading Time on Top-Right */}
        {readingTime && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
              ⏱ {readingTime}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col flex-1">
        {/* Date */}
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </span>

        {/* Title */}
        <h3 className="mb-3">
          <Link
            href={postUrl}
            className="font-bold text-dark dark:text-white group-hover:text-primary transition-colors text-lg sm:text-xl leading-snug line-clamp-2"
          >
            {title}
          </Link>
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {excerpt}
          </p>
        )}

        {/* Read More Link Button */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-dark_border/60 flex items-center justify-between">
          <Link
            href={postUrl}
            className="text-xs sm:text-sm font-bold text-primary hover:text-blue-700 dark:hover:text-blue-400 inline-flex items-center gap-1.5 transition group-hover:gap-2.5"
          >
            <span>Read Article</span>
            <svg className="w-3.5 h-3.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;