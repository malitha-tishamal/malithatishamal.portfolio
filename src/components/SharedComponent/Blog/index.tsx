"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost, defaultBlogPosts } from "@/types/blog";
import { MarqueeRows } from "@/components/SharedComponent/MarqueeRows";
import { MARQUEE_LANE } from "@/components/SharedComponent/MarqueeRows/lane";
import BlogCard, { BLOG_CARD_WIDTH, BlogCardSkeleton } from "./blogCard";
import { isPostVisible, sortPostsByDate } from "@/utils/blogPosts";

const LATEST_COUNT = 6;
const SCROLL_SPEED = 50;
/** Below this count MarqueeRows renders one static, manually scrollable row. */
const MIN_FOR_TWO_ROWS = 6;

const fallbackPosts = () =>
  sortPostsByDate(defaultBlogPosts.filter((post) => isPostVisible(post)));

interface BlogProps {
  initialPosts?: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ initialPosts }) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [loading, setLoading] = useState<boolean>(!initialPosts);
  const [paused, setPaused] = useState<boolean>(false);
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let active = true;

    const useFallback = () => {
      if (!active) return;
      if (!initialPosts || initialPosts.length === 0) {
        setPosts(fallbackPosts());
      }
      setLoading(false);
    };

    try {
      const unsubscribe = onSnapshot(
        collection(db, "blogs"),
        (snapshot) => {
          if (!active) return;
          if (!snapshot.empty) {
            const list: BlogPost[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<BlogPost, "id">),
            }));
            const visible = sortPostsByDate(list.filter((post) => isPostVisible(post)));
            setPosts(visible);
          } else if (!initialPosts || initialPosts.length === 0) {
            setPosts(fallbackPosts());
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Blog listener notice:", error.message);
          useFallback();
        }
      );
      return () => {
        active = false;
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up blog listener:", error);
      useFallback();
    }
  }, [initialPosts]);

  const showPause = !loading && !reduced && posts.length >= MIN_FOR_TWO_ROWS;

  return (
    <section
      id="blog"
      className="overflow-x-clip scroll-mt-24 bg-white py-16 transition-colors sm:py-24 dark:bg-darkmode">
      {/* Header keeps the centred container; the marquee rows use the full lane */}
      <div className={`mx-auto w-full max-w-[1280px] ${MARQUEE_LANE}`}>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Insights &amp; Articles
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-midnight_text sm:text-4xl dark:text-white">
              Latest blog &amp; news
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-grey sm:text-base dark:text-gray-300">
              Deep-dives into architecture, cloud, security and the tools I build with.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {showPause ? (
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-pressed={paused}
                aria-label={paused ? "Play scrolling blog posts" : "Pause scrolling blog posts"}
                className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white px-4 py-2.5 text-sm font-semibold text-midnight_text shadow-xs transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden dark:border-dark_border dark:bg-darklight dark:text-white dark:hover:text-primary">
                <Icon
                  icon={paused ? "solar:play-bold" : "solar:pause-bold"}
                  width={16}
                  height={16}
                  aria-hidden="true"
                />
                <span>{paused ? "Play" : "Pause"}</span>
              </button>
            ) : null}

            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white px-5 py-2.5 text-sm font-semibold text-midnight_text shadow-xs transition-colors hover:border-primary hover:text-primary dark:border-dark_border dark:bg-darklight dark:text-white dark:hover:text-primary">
              <span>View More</span>
              <span className="transition-transform group-hover:translate-x-1">
                <Icon icon="solar:arrow-right-outline" width="20" height="20" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <MarqueeRows<BlogPost>
        items={posts}
        getKey={(post) => post.slug || post.id}
        getUpdatedAt={(post) => post.date}
        latestCount={LATEST_COUNT}
        speed={SCROLL_SPEED}
        rowCount={2}
        minForTwoRows={MIN_FOR_TWO_ROWS}
        staticSingleRow
        externalPaused={paused}
        labelPrefix="posts"
        ariaLabel="Blog posts"
        loading={loading}
        skeletonCount={8}
        renderSkeleton={() => <BlogCardSkeleton widthClass={BLOG_CARD_WIDTH} />}
        emptyState={
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            No articles published yet.
          </p>
        }
        renderCard={(post, ctx) => (
          <BlogCard
            blog={post}
            latest={ctx.latest}
            priority={ctx.rowIndex === 0 && ctx.index < 2}
          />
        )}
      />
    </section>
  );
};

export default Blog;
