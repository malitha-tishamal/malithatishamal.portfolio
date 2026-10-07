"use client";

import React, { useEffect } from "react";
import { TechItem, TechCategory } from "@/types/techstack";
import { getTechInfo } from "@/data/techDescriptions";
import { sanitizeHtml } from "@/utils/sanitize";

interface TechDetailModalProps {
  item: TechItem | null;
  category?: TechCategory;
  onClose: () => void;
}

const PROFICIENCY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert / Core Specialty",
};

export const TechDetailModal: React.FC<TechDetailModalProps> = ({
  item,
  category,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const accentColor = category?.color || "#0a66c2";
  const fallback = getTechInfo(item.name);
  const displayShort = item.shortDescription || fallback.shortDescription;
  const displayDesc = item.description || fallback.description;
  const displayExp = item.experienceYears || fallback.experienceYears;
  const displayUrl = item.officialUrl || fallback.officialUrl;
  const displayProjects =
    item.projectsUsed && item.projectsUsed.length > 0
      ? item.projectsUsed
      : fallback.projectsUsed || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-darklight rounded-3xl shadow-2xl border border-gray-100 dark:border-dark_border overflow-hidden transform transition-all animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner with Category Accent Glow */}
        <div
          className="relative p-6 pb-5 border-b border-gray-100 dark:border-dark_border flex items-start justify-between"
          style={{
            background: `linear-gradient(135deg, ${accentColor}12 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* Tech Icon Container */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-darkmode border shadow-sm shrink-0"
              style={{ borderColor: `${accentColor}40` }}
            >
              {item.iconType === "devicon" ? (
                <i className={`${item.iconValue} text-4xl`} />
              ) : item.iconType === "url" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.iconValue} alt={item.name} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-4xl">{item.iconValue}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                    border: `1px solid ${accentColor}40`,
                  }}
                >
                  {category?.name || "Technology"}
                </span>
                {displayExp && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300">
                    ⏱️ {displayExp}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-dark dark:text-white">
                {item.name}
              </h3>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Proficiency Meter */}
          <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-darkmode/60 border border-gray-100 dark:border-dark_border">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-gray-500 uppercase tracking-wider text-[11px]">
                Skill Proficiency
              </span>
              <span className="font-bold text-dark dark:text-white">
                {PROFICIENCY_LABELS[item.proficiency ?? 3]} ({item.proficiency ?? 3}/5)
              </span>
            </div>
            <div className="flex gap-1.5 h-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className="flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      lvl <= (item.proficiency ?? 3) ? accentColor : "rgba(156, 163, 175, 0.25)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Short Description */}
          {displayShort && (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-primary/5 dark:bg-primary/10 p-3.5 rounded-2xl border border-primary/15 leading-relaxed">
              💡 {displayShort}
            </div>
          )}

          {/* Detailed Description */}
          {displayDesc && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Overview &amp; Practical Experience
              </h4>
              <div
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayDesc) }}
              />
            </div>
          )}

          {/* Projects Used In */}
          {displayProjects && displayProjects.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Applied in Projects &amp; Work
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {displayProjects.map((proj: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl text-xs font-medium bg-gray-100 dark:bg-darkmode border border-border/80 dark:border-dark_border text-gray-700 dark:text-gray-300"
                  >
                    🚀 {proj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-gray-100 dark:border-dark_border bg-gray-50/50 dark:bg-darkmode/30 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Click outside or press Esc to close
          </span>
          <div className="flex items-center gap-2">
            {displayUrl && (
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm hover:opacity-95"
                style={{ backgroundColor: accentColor }}
              >
                <span>Documentation / Site</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-darkmode text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark_border transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
