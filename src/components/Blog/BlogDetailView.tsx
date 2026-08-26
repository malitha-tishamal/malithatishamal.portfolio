"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface BlogDetailViewProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({ post, relatedPosts = [] }) => {
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const formattedDate = (() => {
    try {
      return format(new Date(post.date), "MMMM dd, yyyy");
    } catch {
      return post.date;
    }
  })();

  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://malithatishamal.com/blog/${post.slug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      toast.success("Article link copied to clipboard!");
    }
  };

  // Render simple markdown-like content blocks
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let listBuffer: string[] = [];

    const flushList = (key: number) => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="my-5 space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300 pl-2">
            {listBuffer.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        listBuffer = [];
      }
    };

    lines.forEach((line, index) => {
      // Code blocks
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${index}`} className="my-6 rounded-xl bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto border border-gray-800 shadow-inner">
              <pre><code>{codeBuffer.join("\n")}</code></pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          flushList(index);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // List items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        listBuffer.push(line.trim().substring(2));
        return;
      } else {
        flushList(index);
      }

      // Headings
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-xl sm:text-2xl font-bold text-dark dark:text-white mt-8 mb-3 tracking-tight">
            {line.replace("### ", "")}
          </h3>
        );
        return;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={index} className="text-2xl sm:text-3xl font-bold text-dark dark:text-white mt-10 mb-4 tracking-tight border-b border-gray-200 dark:border-dark_border pb-2">
            {line.replace("## ", "")}
          </h2>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={index} className="my-6 pl-5 border-l-4 border-primary italic text-gray-700 dark:text-gray-300 bg-primary/5 dark:bg-primary/10 py-3 rounded-r-xl font-medium text-base sm:text-lg">
            {line.replace("> ", "")}
          </blockquote>
        );
        return;
      }

      // Horizontal dividers
      if (line.trim() === "---" || line.trim() === "***") {
        elements.push(
          <hr key={index} className="my-8 border-gray-200 dark:border-dark_border" />
        );
        return;
      }

      // Empty line
      if (!line.trim()) {
        return;
      }

      // Paragraphs
      elements.push(
        <p key={index} className="my-4 text-base sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {line}
        </p>
      );
    });

    flushList(lines.length);

    return elements;
  };

  return (
    <article className="pt-28 pb-20 dark:bg-darkmode">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Top Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition">Blog & News</Link>
          <span>/</span>
          <span className="text-dark dark:text-white truncate max-w-xs">{post.title}</span>
        </nav>

        {/* Header Badges & Date */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            {post.category}
          </span>
          {post.readingTime && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readingTime}
            </span>
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            • {formattedDate}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-dark dark:text-white leading-tight tracking-tight mb-4">
          {post.title}
        </h1>

        {/* Subtitle / Excerpt */}
        {post.subtitle && (
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
            {post.subtitle}
          </p>
        )}

        {/* Author Card & Share Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-y border-gray-200 dark:border-dark_border mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-primary/30 shrink-0 bg-gray-100 dark:bg-darklight">
              <Image
                src={post.author?.avatar || "/images/hero/hero-image.png"}
                alt={post.author?.name || "Author"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <p className="text-sm font-bold text-dark dark:text-white">
                {post.author?.name || "Malitha Tishamal"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {post.author?.role || "Author"}
              </p>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Share:</span>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on LinkedIn"
              className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center hover:-translate-y-0.5 transition shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.13c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63Z"/></svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center hover:-translate-y-0.5 transition shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on WhatsApp"
              className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:-translate-y-0.5 transition shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <button
              onClick={handleCopyLink}
              title="Copy Link"
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-darklight text-gray-700 dark:text-gray-300 flex items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Featured Cover Image */}
        {post.coverImage && (
          <div className="relative w-full h-72 sm:h-96 md:h-[460px] rounded-2xl overflow-hidden mb-10 shadow-lg border border-gray-100 dark:border-dark_border">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {/* Main Article Body */}
        <div className="prose prose-lg dark:prose-invert max-w-none text-dark dark:text-white">
          {renderFormattedContent(post.content || post.excerpt)}
        </div>

        {/* Additional Images / Screenshot Gallery */}
        {post.additionalImages && post.additionalImages.length > 0 && (
          <div className="my-12">
            <h3 className="text-xl font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Article Gallery & Architecture Diagrams
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.additionalImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveLightboxImage(img)}
                  className="relative h-56 rounded-xl overflow-hidden cursor-pointer group border border-gray-200 dark:border-dark_border"
                >
                  <Image
                    src={img}
                    alt={`Article screenshot ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <span className="text-xs font-semibold px-3 py-1 bg-black/60 rounded-full backdrop-blur-xs">
                      Click to expand 🔍
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Links & Resources */}
        {post.relatedLinks && post.relatedLinks.length > 0 && (
          <div className="my-10 p-6 rounded-2xl bg-gray-50 dark:bg-darklight border border-gray-200 dark:border-dark_border">
            <h4 className="text-base font-bold text-dark dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Related Links & Resources
            </h4>
            <div className="flex flex-wrap gap-3">
              {post.relatedLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-darkmode text-primary border border-primary/20 hover:border-primary font-semibold text-xs sm:text-sm hover:shadow-xs transition"
                >
                  <span>{link.title}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 my-8 pt-6 border-t border-gray-200 dark:border-dark_border">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">Tags:</span>
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-darklight text-gray-700 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back to Blog Button */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-200 dark:border-dark_border">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition shadow-md shadow-primary/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Articles
          </Link>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200 dark:border-dark_border">
            <h3 className="text-2xl font-bold text-dark dark:text-white mb-6">
              More Articles You Might Like
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group flex flex-col bg-white dark:bg-darklight rounded-xl overflow-hidden border border-gray-100 dark:border-dark_border hover:shadow-lg transition duration-200"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-gray-100 dark:bg-darkmode">
                    <Image
                      src={rel.coverImage || "/images/blog/blog_1.png"}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[11px] font-bold text-primary mb-1">{rel.category}</span>
                    <h4 className="text-sm font-bold text-dark dark:text-white group-hover:text-primary transition line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                    <span className="text-[11px] text-gray-500 mt-auto">{rel.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={activeLightboxImage}
              alt="Expanded view"
              width={1200}
              height={800}
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
              unoptimized
            />
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </article>
  );
};