"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { BlogPost } from "@/types/blog";
import { formatBlogDate } from "@/utils/blogDate";
import { RelativeTimePill } from "@/components/SharedComponent/RelativeTimePill";
import { FitTitle } from "@/components/SharedComponent/FitTitle";

/**
 * Fixed-size blog card shared by the homepage marquee and the /blog grid.
 * Every text block reserves its clamped space and the footer is pinned, so all
 * cards line up whatever the title/excerpt length is.
 */

export const BLOG_CARD_WIDTH = "w-[76vw] shrink-0 sm:w-[270px] md:w-[290px] xl:w-[320px]";

const CATEGORY_ICONS: Record<string, string> = {
  "technology & ai": "solar:cpu-bold-duotone",
  "web development": "solar:code-square-bold-duotone",
  "cloud & devops": "solar:cloud-bold-duotone",
  cybersecurity: "solar:shield-keyhole-bold-duotone",
  "software architecture": "solar:server-square-bold-duotone",
  "tutorials & guides": "solar:book-2-bold-duotone",
};

function CoverPlaceholder({ category, title }: { category?: string; title: string }) {
  const icon =
    CATEGORY_ICONS[(category || "").toLowerCase()] || "solar:document-text-bold-duotone";
  const initial = (title.trim()[0] || "B").toUpperCase();

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-700 via-[#2563EB] to-blue-500">
      <span className="absolute text-[9rem] leading-none font-black text-white/10 select-none">
        {initial}
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-xs">
        <Icon icon={icon} width={30} height={30} className="text-white" />
      </span>
    </div>
  );
}

export interface BlogCardProps {
  blog: BlogPost;
  /** One of the six newest posts → blue "Latest · …" pill. */
  latest?: boolean;
  widthClass?: string;
  /** Eagerly load the first cards that are visible on load. */
  priority?: boolean;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  latest = false,
  widthClass = BLOG_CARD_WIDTH,
  priority = false,
  className = "",
}) => {
  const { title, coverImage, coverImageAlt, excerpt, date, slug, id, category, readingTime } =
    blog;
  const postUrl = `/blog/${slug || id}`;
  const [failed, setFailed] = useState(false);
  const source = (coverImage || "").trim();

  useEffect(() => {
    setFailed(false);
  }, [source]);

  return (
    <Link
      href={postUrl}
      data-blog-card=""
      className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-shadow duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden dark:border-dark_border dark:bg-darklight ${widthClass} ${className}`}>
      {/* Fixed 16:10 cover — no layout shift while images load */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-darkmode">
        {source && !failed ? (
          <Image
            src={source}
            alt={coverImageAlt?.trim() || title}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1280px) 320px, 400px"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CoverPlaceholder category={category} title={title} />
        )}

        <span className="absolute top-2.5 left-2.5 z-10 max-w-[55%] truncate rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider whitespace-nowrap text-white uppercase shadow-sm">
          {category || "Technology"}
        </span>

        {readingTime ? (
          <span className="absolute top-2.5 right-2.5 z-10 flex max-w-[42%] items-center gap-1 truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white backdrop-blur-xs">
            <svg
              className="h-2.5 w-2.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {readingTime}
          </span>
        ) : null}

        <RelativeTimePill
          date={date}
          latest={latest}
          verb="published"
          className="absolute bottom-2.5 left-2.5 scale-90 origin-bottom-left"
        />
      </div>

      {/* Body — compact line boxes keep cards aligned and well-proportioned */}
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-gray-500 dark:text-gray-400">
          <svg
            className="h-3 w-3 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatBlogDate(date)}
        </span>

        {/* Title — up to 3 lines, auto-fit, reserved 3-line height */}
        <div className="mb-2 min-h-[calc(3*1.3em)] h-[calc(3*1.3em)] shrink-0 text-[17px] sm:text-[18px] lg:text-[20px] leading-[1.3] font-bold text-dark transition-colors group-hover:text-primary dark:text-white">
          <FitTitle
            title={title}
            as="h3"
            className="text-dark transition-colors group-hover:text-primary dark:text-white"
          />
        </div>

        <p className="mb-3 line-clamp-2 min-h-[2.25rem] overflow-hidden text-xs leading-relaxed break-words text-gray-600 dark:text-gray-400">
          {excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-dark_border/60">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-400">
            <span>Read Article</span>
            <svg
              className="h-3 w-3 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

/** Skeleton with the exact card geometry, used while Firestore is loading. */
export const BlogCardSkeleton: React.FC<{ widthClass?: string }> = ({
  widthClass = BLOG_CARD_WIDTH,
}) => (
  <div
    data-content-card=""
    className={`flex shrink-0 animate-pulse flex-col overflow-hidden rounded-2xl border border-border/40 bg-gray-100 dark:border-dark_border/40 dark:bg-darklight ${widthClass}`}>
    <div className="aspect-[16/10] w-full shrink-0 bg-gray-200 dark:bg-darkmode" />
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-2 h-2.5 w-20 rounded-md bg-gray-200 dark:bg-darkmode" />
      <div className="mb-2 h-[calc(3*1.3em)] w-full rounded-md bg-gray-200 dark:bg-darkmode text-[17px] sm:text-[18px] lg:text-[20px]" />
      <div className="mb-1.5 h-3 w-full rounded-md bg-gray-200 dark:bg-darkmode" />
      <div className="h-3 w-4/5 rounded-md bg-gray-200 dark:bg-darkmode" />
      <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2.5 dark:border-dark_border/40">
        <div className="h-3 w-20 rounded-md bg-gray-200 dark:bg-darkmode" />
      </div>
    </div>
  </div>
);

export default BlogCard;
