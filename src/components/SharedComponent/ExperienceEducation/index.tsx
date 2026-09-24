"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ExperienceItem,
  ExperienceMedia,
  defaultExperiences,
  ExperienceCategory,
} from "@/types/experience";
import {
  trackExperienceClick,
  trackExperienceHover,
} from "@/utils/experienceAnalytics";

// ── Organization Logo with smart error fallback & sizing ────────────────────
const OrganizationLogo: React.FC<{
  logoUrl?: string;
  organization: string;
  category: ExperienceCategory;
  logoShape?: string;
  size?: "sm" | "md" | "lg";
}> = ({ logoUrl, organization, category, logoShape, size = "md" }) => {
  const [hasError, setHasError] = useState(false);

  const shapeClass =
    logoShape === "circle"
      ? "rounded-full"
      : logoShape === "square"
      ? "rounded-xl"
      : "rounded-2xl";

  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11 sm:w-12 sm:h-12",
    lg: "w-14 h-14 sm:w-16 sm:h-16",
  };

  const getGradientAndIcon = () => {
    const org = organization.toLowerCase();
    if (
      category === "education" ||
      org.includes("sliate") ||
      org.includes("university") ||
      org.includes("college") ||
      org.includes("school")
    ) {
      return {
        bg: "from-purple-600 via-indigo-600 to-violet-700",
        shadow: "shadow-purple-500/25",
        border: "border-purple-300 dark:border-purple-800",
        icon: (
          <svg className={size === "lg" ? "w-8 h-8" : "w-5 h-5 sm:w-6 sm:h-6"} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
          </svg>
        ),
      };
    }
    if (org.includes("sitec") || org.includes("design") || org.includes("web")) {
      return {
        bg: "from-cyan-500 via-blue-600 to-indigo-600",
        shadow: "shadow-cyan-500/25",
        border: "border-cyan-300 dark:border-cyan-800",
        icon: (
          <svg className={size === "lg" ? "w-8 h-8" : "w-5 h-5 sm:w-6 sm:h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      };
    }
    if (category === "volunteer" || org.includes("volunteer") || org.includes("community")) {
      return {
        bg: "from-emerald-500 via-teal-600 to-green-600",
        shadow: "shadow-emerald-500/25",
        border: "border-emerald-300 dark:border-emerald-800",
        icon: (
          <svg className={size === "lg" ? "w-8 h-8" : "w-5 h-5 sm:w-6 sm:h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
      };
    }
    return {
      bg: "from-blue-600 via-indigo-600 to-violet-600",
      shadow: "shadow-blue-500/25",
      border: "border-blue-300 dark:border-blue-800",
      icon: (
        <svg className={size === "lg" ? "w-8 h-8" : "w-5 h-5 sm:w-6 sm:h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    };
  };

  const style = getGradientAndIcon();

  if (!logoUrl || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} ${shapeClass} bg-gradient-to-br ${style.bg} ${style.shadow} shadow-md flex items-center justify-center shrink-0 text-white font-bold transition-transform duration-300 border ${style.border}`}
      >
        {style.icon}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${shapeClass} bg-white dark:bg-darklight border border-slate-200 dark:border-dark_border flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative p-1 transition-all duration-300`}
    >
      <Image
        src={logoUrl}
        alt={organization}
        width={size === "lg" ? 64 : 48}
        height={size === "lg" ? 64 : 48}
        className="w-full h-full object-contain"
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// ── Media / Certificate / Document Thumbnail with PDF & fallback support ───
const getMediaThumbnailUrl = (url?: string, thumbnailUrl?: string): string => {
  if (thumbnailUrl && !thumbnailUrl.toLowerCase().endsWith(".pdf")) return thumbnailUrl;
  if (!url) return "";
  if (url.toLowerCase().endsWith(".pdf")) {
    return url.replace(/\.pdf$/i, ".jpg");
  }
  return url;
};

const MediaThumbnail: React.FC<{
  url?: string;
  thumbnailUrl?: string;
  type?: string;
  title?: string;
  className?: string;
}> = ({ url, thumbnailUrl, type, title, className = "w-5 h-5" }) => {
  const [hasError, setHasError] = useState(false);
  const displaySrc = getMediaThumbnailUrl(url, thumbnailUrl);
  const isPdf = url?.toLowerCase().includes(".pdf");

  if (!displaySrc || hasError) {
    return (
      <div
        className={`${className} rounded-md bg-purple-100 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-purple-700 dark:text-purple-300`}
        title={title}
      >
        {isPdf ? "PDF" : type === "award" ? "🏆" : type === "certificate" ? "📜" : "📄"}
      </div>
    );
  }

  return (
    <div
      className={`relative ${className} rounded-md overflow-hidden bg-white dark:bg-darkmode border border-purple-200 dark:border-purple-800 shrink-0 shadow-2xs`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={title || "Attachment"}
        className="w-full h-full object-cover group-hover/med:scale-110 transition-transform duration-200"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

// ── Main ExperienceEducation Component ──────────────────────────────────────
export const ExperienceEducation: React.FC = () => {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeExpFilter, setActiveExpFilter] = useState<"all" | "work" | "volunteer">("all");
  const [selectedItem, setSelectedItem] = useState<ExperienceItem | null>(null);
  const [previewMedia, setPreviewMedia] = useState<ExperienceMedia | null>(null);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "experiences"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: ExperienceItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as ExperienceItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setItems(fetched.filter((e) => e.published !== false));
          } else {
            setItems(defaultExperiences);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Experiences listener notice:", error.message);
          setItems(defaultExperiences);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error in experiences listener:", err);
      setItems(defaultExperiences);
      setLoading(false);
    }
  }, []);

  // Lock body scroll when modal is open + ESC to close
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedItem(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedItem]);

  // Filter Education items
  const educationItems = useMemo(() => {
    return items
      .filter((i) => i.category === "education")
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [items]);

  // Filter Experience items (Work & Volunteer)
  const experienceItems = useMemo(() => {
    return items
      .filter((i) => {
        if (activeExpFilter === "all") {
          return i.category === "work" || i.category === "volunteer";
        }
        return i.category === activeExpFilter;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [items, activeExpFilter]);

  return (
    <section id="experience-education" className="py-14 md:py-20 dark:bg-darkmode border-b border-border/40 dark:border-dark_border/40 relative overflow-hidden">
      {/* Ambient decorative background glows */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-primary/25 shadow-2xs mb-2.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
              Career &amp; Academic Pathway
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight_text dark:text-white leading-tight tracking-tight">
            Work Experience <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">&amp; Education</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            Click on any milestone below to inspect full responsibilities, achievements, credentials and competencies.
          </p>
        </div>

        {/* 2-Column Side-by-Side Grid (LinkedIn Timeline Style) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {[1, 2].map((col) => (
              <div
                key={col}
                className="bg-white dark:bg-darklight rounded-3xl border border-border/80 dark:border-dark_border p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-darkmode" />
                  <div className="h-5 bg-gray-200 dark:bg-darkmode rounded w-1/3" />
                </div>
                {[1, 2].map((row) => (
                  <div key={row} className="flex gap-4 items-start pt-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-darkmode shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-darkmode rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-darkmode rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          
            {/* ═══════════ LEFT COLUMN: WORK & VOLUNTEER EXPERIENCE ═══════════ */}
            <div
              data-aos="fade-right"
              className="bg-white/95 dark:bg-darklight/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-dark_border p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

              {/* Header with Title & Filter Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-dark_border/80 mb-5 pt-0.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-base shadow-sm shadow-blue-500/20 shrink-0">
                    💼
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark dark:text-white leading-tight">
                      Experience
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      Professional, contract &amp; volunteer roles
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-darkmode p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/60 dark:border-dark_border/60">
                  <button
                    onClick={() => setActiveExpFilter("all")}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeExpFilter === "all"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    All ({items.filter((i) => i.category === "work" || i.category === "volunteer").length})
                  </button>
                  <button
                    onClick={() => setActiveExpFilter("work")}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeExpFilter === "work"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    Work ({items.filter((i) => i.category === "work").length})
                  </button>
                  <button
                    onClick={() => setActiveExpFilter("volunteer")}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeExpFilter === "volunteer"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    Volunteer ({items.filter((i) => i.category === "volunteer").length})
                  </button>
                </div>
              </div>

              {/* Experience Items List - LinkedIn Connected Chain Style */}
              <div className="relative space-y-3.5">
                {experienceItems.map((item, index) => {
                  const isVolunteer = item.category === "volunteer";
                  const accent = item.accentColor || (isVolunteer ? "#057642" : "#0a66c2");
                  const badge = item.badgeColor || accent;
                  const isLast = index === experienceItems.length - 1;

                  return (
                    <div key={item.id} className="relative flex gap-3 items-start group">
                      {/* LinkedIn Vertical Timeline Connecting Chain Line */}
                      {!isLast && (
                        <div
                          className="absolute left-[20px] sm:left-[22px] top-11 bottom-[-16px] w-[2px] z-0 transition-colors"
                          style={{
                            background: `linear-gradient(to bottom, ${accent}80 0%, ${accent}30 60%, rgba(148, 163, 184, 0.25) 100%)`,
                          }}
                        />
                      )}

                      {/* Timeline Node: Organization Logo */}
                      <div className="relative z-10 shrink-0">
                        <OrganizationLogo
                          logoUrl={item.logoUrl}
                          organization={item.organization}
                          category={item.category}
                          logoShape={item.logoShape}
                          size="md"
                        />
                        {/* Chain Node Glow */}
                        {item.isCurrent && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-darklight"
                            style={{ backgroundColor: accent }}
                          />
                        )}
                      </div>

                      {/* Clickable Compact Card */}
                      <div
                        onClick={() => {
                          setSelectedItem(item);
                          trackExperienceClick(item.id);
                        }}
                        onMouseEnter={() => trackExperienceHover(item.id)}
                        className="flex-1 min-w-0 cursor-pointer rounded-2xl border border-slate-200/90 dark:border-dark_border bg-slate-50/60 dark:bg-darkmode/50 hover:bg-white dark:hover:bg-darkmode hover:border-primary/50 dark:hover:border-primary/50 p-3.5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group/card"
                      >
                        {/* Title & Status Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <h4 className="font-bold text-dark dark:text-white text-sm sm:text-[15px] leading-snug group-hover/card:text-primary transition-colors">
                                {item.title}
                              </h4>

                              {/* Present Live Pulse Badge */}
                              {item.isCurrent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Present
                                </span>
                              )}

                              {item.employmentType && (
                                <span
                                  className="px-2 py-0.2 text-[9px] font-bold rounded-full border"
                                  style={{
                                    color: badge,
                                    borderColor: `${badge}40`,
                                    backgroundColor: `${badge}15`,
                                  }}
                                >
                                  {item.employmentType}
                                </span>
                              )}
                            </div>

                            {/* Organization Name */}
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: accent }}
                              />
                              {item.organization}
                            </p>
                          </div>

                          {/* Click Hint Arrow */}
                          <span className="shrink-0 text-gray-400 group-hover/card:text-primary transition-colors text-xs font-bold p-1">
                            ↗
                          </span>
                        </div>

                        {/* Date & Location Meta */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span>📅</span>
                            <span>
                              {item.startDate} – {item.endDate || (item.isCurrent ? "Present" : "")}
                            </span>
                          </span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1">
                              <span>·</span>
                              <span>📍</span>
                              <span>{item.location}</span>
                            </span>
                          )}
                          {item.locationType && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                              {item.locationType}
                            </span>
                          )}
                        </div>

                        {/* Description Teaser (1-line clean snippet) */}
                        {item.description && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Compact Skills Diamond Chip */}
                        {item.skills && item.skills.length > 0 && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-dark_border/60">
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                              style={{
                                color: accent,
                                backgroundColor: `${accent}12`,
                                border: `1px solid ${accent}25`,
                              }}
                            >
                              <span>💎</span>
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                {item.skills.slice(0, 3).join(", ")}
                                {item.skills.length > 3 && (
                                  <strong className="font-bold ml-1" style={{ color: accent }}>
                                    +{item.skills.length - 3} more
                                  </strong>
                                )}
                              </span>
                            </div>

                            <span className="text-[10px] font-semibold text-primary group-hover/card:underline">
                              View details
                            </span>
                          </div>
                        )}

                        {/* Attached Certificates, Event Awards & Documents (Thumbnail + Highlighted Name on Card) */}
                        {item.media && item.media.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-dark_border/60">
                            {item.media.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMedia(med);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/90 dark:bg-purple-950/50 dark:hover:bg-purple-900/70 border border-purple-300 dark:border-purple-700/80 hover:border-purple-500 shadow-xs hover:shadow-sm transition-all duration-200 group/med cursor-pointer max-w-full"
                                title={`Click to view: ${med.title}`}
                              >
                                <MediaThumbnail
                                  url={med.url}
                                  thumbnailUrl={med.thumbnailUrl}
                                  type={med.type}
                                  title={med.title}
                                  className="w-6 h-6"
                                />
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs shrink-0">
                                    {med.type === "award" ? "🏆" : med.type === "certificate" ? "📜" : "📄"}
                                  </span>
                                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-100 group-hover/med:text-purple-950 dark:group-hover/med:text-white tracking-wide">
                                    {med.title}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {experienceItems.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No experience items found in this category.
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════ RIGHT COLUMN: EDUCATION ═══════════ */}
            <div
              data-aos="fade-left"
              className="bg-white/95 dark:bg-darklight/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-dark_border p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-violet-600 to-pink-500" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-dark_border/80 mb-5 pt-0.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-base shadow-sm shadow-purple-500/20 shrink-0">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark dark:text-white leading-tight">
                      Education
                    </h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      Degrees, diplomas &amp; certified training
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs">
                  🎓 {educationItems.length} Milestones
                </span>
              </div>

              {/* Education Items List - LinkedIn Connected Chain Style */}
              <div className="relative space-y-3.5">
                {educationItems.map((item, index) => {
                  const eduAccent = item.accentColor || "#7c3aed";
                  const eduBadge = item.badgeColor || eduAccent;
                  const isLast = index === educationItems.length - 1;

                  return (
                    <div key={item.id} className="relative flex gap-3 items-start group">
                      {/* LinkedIn Vertical Timeline Connecting Chain Line */}
                      {!isLast && (
                        <div
                          className="absolute left-[20px] sm:left-[22px] top-11 bottom-[-16px] w-[2px] z-0 transition-colors"
                          style={{
                            background: `linear-gradient(to bottom, ${eduAccent}80 0%, ${eduAccent}30 60%, rgba(148, 163, 184, 0.25) 100%)`,
                          }}
                        />
                      )}

                      {/* Timeline Node: Institution Logo */}
                      <div className="relative z-10 shrink-0">
                        <OrganizationLogo
                          logoUrl={item.logoUrl}
                          organization={item.organization}
                          category={item.category}
                          logoShape={item.logoShape}
                          size="md"
                        />
                        {/* Chain Node Glow */}
                        {item.isCurrent && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-darklight"
                            style={{ backgroundColor: eduAccent }}
                          />
                        )}
                      </div>

                      {/* Clickable Compact Card */}
                      <div
                        onClick={() => {
                          setSelectedItem(item);
                          trackExperienceClick(item.id);
                        }}
                        onMouseEnter={() => trackExperienceHover(item.id)}
                        className="flex-1 min-w-0 cursor-pointer rounded-2xl border border-slate-200/90 dark:border-dark_border bg-slate-50/60 dark:bg-darkmode/50 hover:bg-white dark:hover:bg-darkmode hover:border-purple-500/50 dark:hover:border-purple-500/50 p-3.5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group/card"
                      >
                        {/* Organization & Ongoing Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <h4 className="font-bold text-dark dark:text-white text-sm sm:text-[15px] leading-snug group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400 transition-colors">
                                {item.organization}
                              </h4>

                              {/* Ongoing Pulse Badge */}
                              {item.isCurrent && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-extrabold border"
                                  style={{
                                    color: eduAccent,
                                    borderColor: `${eduAccent}40`,
                                    backgroundColor: `${eduAccent}18`,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: eduAccent }}
                                  />
                                  Ongoing
                                </span>
                              )}

                              {item.employmentType && (
                                <span
                                  className="px-2 py-0.2 text-[9px] font-bold rounded-full border"
                                  style={{
                                    color: eduBadge,
                                    borderColor: `${eduBadge}40`,
                                    backgroundColor: `${eduBadge}15`,
                                  }}
                                >
                                  {item.employmentType}
                                </span>
                              )}
                            </div>

                            {/* Degree / Program Title */}
                            <p className="text-xs font-semibold" style={{ color: eduAccent }}>
                              {item.title}
                              {item.fieldOfStudy && !item.title.includes(item.fieldOfStudy) && (
                                <span className="text-gray-500 dark:text-gray-400 font-normal">
                                  {" "}· {item.fieldOfStudy}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Click Hint Arrow */}
                          <span className="shrink-0 text-gray-400 group-hover/card:text-purple-500 transition-colors text-xs font-bold p-1">
                            ↗
                          </span>
                        </div>

                        {/* Date & Location Meta */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span>📅</span>
                            <span>
                              {item.startDate} – {item.endDate || (item.isCurrent ? "Present" : "")}
                            </span>
                          </span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1">
                              <span>·</span>
                              <span>📍</span>
                              <span>{item.location}</span>
                            </span>
                          )}
                          {item.grade && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/20">
                              🏆 Grade: {item.grade}
                            </span>
                          )}
                        </div>

                        {/* Activities teaser */}
                        {item.activities && (
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 line-clamp-1 mt-1.5 font-medium">
                            🎯 <span className="font-bold">Activities:</span> {item.activities}
                          </p>
                        )}

                        {/* Skills Chip */}
                        {item.skills && item.skills.length > 0 && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-dark_border/60">
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                              style={{
                                color: eduAccent,
                                backgroundColor: `${eduAccent}12`,
                                border: `1px solid ${eduAccent}25`,
                              }}
                            >
                              <span>💎</span>
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                {item.skills.slice(0, 3).join(", ")}
                                {item.skills.length > 3 && (
                                  <strong className="font-bold ml-1" style={{ color: eduAccent }}>
                                    +{item.skills.length - 3} more
                                  </strong>
                                )}
                              </span>
                            </div>

                            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 group-hover/card:underline">
                              View details
                            </span>
                          </div>
                        )}

                        {/* Attached Certificates, Event Awards & Documents (Thumbnail + Highlighted Name on Card) */}
                        {item.media && item.media.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-dark_border/60">
                            {item.media.map((med, mIdx) => (
                              <div
                                key={mIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMedia(med);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/90 dark:bg-purple-950/50 dark:hover:bg-purple-900/70 border border-purple-300 dark:border-purple-700/80 hover:border-purple-500 shadow-xs hover:shadow-sm transition-all duration-200 group/med cursor-pointer max-w-full"
                                title={`Click to view: ${med.title}`}
                              >
                                <MediaThumbnail
                                  url={med.url}
                                  thumbnailUrl={med.thumbnailUrl}
                                  type={med.type}
                                  title={med.title}
                                  className="w-6 h-6"
                                />
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs shrink-0">
                                    {med.type === "award" ? "🏆" : med.type === "certificate" ? "📜" : "📄"}
                                  </span>
                                  <span className="text-xs font-extrabold text-purple-900 dark:text-purple-100 group-hover/med:text-purple-950 dark:group-hover/med:white tracking-wide">
                                    {med.title}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {educationItems.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No education records found.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ═══════════ DETAILED LINKEDIN-STYLE MODAL POPUP ═══════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md transition-all duration-300 animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Bar */}
            <div
              className="h-2 w-full shrink-0"
              style={{
                background:
                  selectedItem.accentColor ||
                  (selectedItem.category === "education"
                    ? "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)"
                    : selectedItem.category === "volunteer"
                    ? "linear-gradient(90deg, #057642, #10b981, #06b6d4)"
                    : "linear-gradient(90deg, #0a66c2, #2563eb, #06b6d4)"),
              }}
            />

            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-dark dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-base font-bold transition cursor-pointer z-10"
              aria-label="Close dialog"
            >
              ✕
            </button>

            {/* Scrollable Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Header: Logo, Title, Badges */}
              <div className="flex items-start gap-4 pr-6">
                <OrganizationLogo
                  logoUrl={selectedItem.logoUrl}
                  organization={selectedItem.organization}
                  category={selectedItem.category}
                  logoShape={selectedItem.logoShape}
                  size="lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${selectedItem.accentColor || "#0a66c2"}15`,
                        color: selectedItem.accentColor || "#0a66c2",
                        border: `1px solid ${selectedItem.accentColor || "#0a66c2"}30`,
                      }}
                    >
                      {selectedItem.category === "education"
                        ? "🎓 Education"
                        : selectedItem.category === "volunteer"
                        ? "🤝 Volunteer"
                        : "💼 Experience"}
                    </span>

                    {selectedItem.isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedItem.category === "education" ? "Ongoing" : "Present"}
                      </span>
                    )}

                    {selectedItem.employmentType && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {selectedItem.employmentType}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                    {selectedItem.title}
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedItem.accentColor || "#0a66c2" }}
                    />
                    {selectedItem.organization}
                  </p>
                </div>
              </div>

              {/* Metadata Grid: Dates, Location, Honors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📅</span>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Timeline
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedItem.startDate} – {selectedItem.endDate || (selectedItem.isCurrent ? "Present" : "")}
                    </span>
                  </div>
                </div>

                {selectedItem.location && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📍</span>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Location
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedItem.location} {selectedItem.locationType && `(${selectedItem.locationType})`}
                      </span>
                    </div>
                  </div>
                )}

                {selectedItem.grade && (
                  <div className="flex items-center gap-2.5 sm:col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-lg">🏆</span>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Grade / Academic Honor
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {selectedItem.grade}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activities & Societies (Education) */}
              {selectedItem.activities && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                  <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 text-xs">
                    <span>🎯</span> Activities and Societies:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {selectedItem.activities}
                  </p>
                </div>
              )}

              {/* Full Description */}
              {selectedItem.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📝</span> Full Overview &amp; Responsibilities
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                    {selectedItem.description}
                  </div>
                </div>
              )}

              {/* Full Skills Showcase */}
              {selectedItem.skills && selectedItem.skills.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💎</span> Associated Skills &amp; Competencies ({selectedItem.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-3 py-1 rounded-xl text-xs font-bold border transition hover:scale-105"
                        style={{
                          backgroundColor: `${selectedItem.accentColor || "#0a66c2"}12`,
                          color: selectedItem.accentColor || "#0a66c2",
                          borderColor: `${selectedItem.accentColor || "#0a66c2"}35`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media & Certificate Attachments in Modal */}
              {selectedItem.media && selectedItem.media.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📜</span> Attached Certificates, Event Awards &amp; Documents ({selectedItem.media.length})
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {selectedItem.media.map((med, mIdx) => (
                      <div
                        key={mIdx}
                        onClick={() => setPreviewMedia(med)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-100/80 hover:bg-purple-50/80 dark:bg-slate-800/80 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 transition cursor-pointer group"
                      >
                        <MediaThumbnail
                          url={med.url}
                          thumbnailUrl={med.thumbnailUrl}
                          type={med.type}
                          title={med.title}
                          className="w-12 h-12"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-dark dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {med.type === "award" ? "🏆" : med.type === "certificate" ? "📜" : "📄"} {med.title}
                          </p>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                            <span>🔍 Click to inspect full image</span>
                            <span>↗</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-400 font-medium">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> to close
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CERTIFICATE / DOCUMENT LIGHTBOX VIEWER ═══════════ */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white dark:bg-darklight rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:px-6 border-b border-border dark:border-dark_border flex items-center justify-between bg-gray-50/80 dark:bg-darkmode/80 shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-bold text-dark dark:text-white truncate flex items-center gap-2">
                  <span>{previewMedia.type === "award" ? "🏆" : previewMedia.type === "certificate" ? "📜" : "📄"}</span>
                  <span>{previewMedia.title}</span>
                </h3>
                <span className="text-xs text-gray-500 capitalize">{previewMedia.type || "Document"}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Open Original</span>
                  <span>↗</span>
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-dark dark:text-white font-bold text-sm flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Media Image Content */}
            <div className="p-4 overflow-auto flex items-center justify-center bg-gray-900/5 dark:bg-black/30 min-h-[300px]">
              {previewMedia.url && (previewMedia.url.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  className="w-full h-[70vh] rounded-xl border border-border"
                />
              ) : (
                <div className="relative max-w-full max-h-[72vh] flex items-center justify-center">
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.title}
                    className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExperienceEducation;
