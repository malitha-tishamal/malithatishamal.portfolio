"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ExperienceItem,
  defaultExperiences,
  ExperienceCategory,
} from "@/types/experience";

// Organization Logo with smart error fallback
const OrganizationLogo: React.FC<{
  logoUrl?: string;
  organization: string;
  category: ExperienceCategory;
  logoShape?: string;
}> = ({ logoUrl, organization, category, logoShape }) => {
  const [hasError, setHasError] = useState(false);

  const shapeClass =
    logoShape === "circle"
      ? "rounded-full"
      : logoShape === "square"
      ? "rounded-xl"
      : "rounded-2xl";

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
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    };
  };

  const style = getGradientAndIcon();

  if (!logoUrl || hasError) {
    return (
      <div
        className={`w-12 h-12 sm:w-13 sm:h-13 ${shapeClass} bg-gradient-to-br ${style.bg} ${style.shadow} shadow-md flex items-center justify-center shrink-0 text-white font-bold transition-transform duration-300 group-hover:scale-105 border ${style.border}`}
      >
        {style.icon}
      </div>
    );
  }

  return (
    <div
      className={`w-12 h-12 sm:w-13 sm:h-13 ${shapeClass} bg-white dark:bg-darklight border border-slate-200 dark:border-dark_border flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative p-1.5 transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-md group-hover:scale-105`}
    >
      <Image
        src={logoUrl}
        alt={organization}
        width={52}
        height={52}
        className="w-full h-full object-contain"
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export const ExperienceEducation: React.FC = () => {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeExpFilter, setActiveExpFilter] = useState<"all" | "work" | "volunteer">("all");
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [id: string]: boolean }>({});

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

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="experience-education" className="py-16 md:py-24 dark:bg-darkmode border-b border-border/40 dark:border-dark_border/40 relative overflow-hidden">
      {/* Ambient decorative background glows */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-primary/25 shadow-2xs mb-3.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Career &amp; Academic Pathway
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-midnight_text dark:text-white leading-tight tracking-tight">
            Work Experience <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">&amp; Education</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-3 max-w-xl mx-auto">
            Professional track record, academic milestones, specialized engineering competencies, and community leadership.
          </p>
        </div>

        {/* 2-Column Side-by-Side Grid (LinkedIn Style) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            {[1, 2].map((col) => (
              <div
                key={col}
                className="bg-white dark:bg-darklight rounded-3xl border border-border/80 dark:border-dark_border p-6 sm:p-8 animate-pulse space-y-6"
              >
                <div className="flex items-center gap-3 pb-5 border-b border-border/60 dark:border-dark_border/60">
                  <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-darkmode shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-darkmode rounded-md w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2" />
                  </div>
                </div>
                {[1, 2].map((row) => (
                  <div key={row} className="flex gap-4 items-start pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-darkmode shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-darkmode rounded-md w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* ═══════════ LEFT COLUMN: WORK & VOLUNTEER EXPERIENCE ═══════════ */}
          <div
            data-aos="fade-right"
            className="bg-white/90 dark:bg-darklight/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-dark_border p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top colorful gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            {/* Header with Title & Filter Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-dark_border/80 mb-5 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-lg shadow-md shadow-blue-500/25 shrink-0">
                  💼
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark dark:text-white leading-tight">
                    Experience
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Professional, contract &amp; volunteer roles
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-darkmode p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/60 dark:border-dark_border/60">
                <button
                  onClick={() => setActiveExpFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeExpFilter === "all"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  All ({items.filter((i) => i.category === "work" || i.category === "volunteer").length})
                </button>
                <button
                  onClick={() => setActiveExpFilter("work")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeExpFilter === "work"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  Work ({items.filter((i) => i.category === "work").length})
                </button>
                <button
                  onClick={() => setActiveExpFilter("volunteer")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeExpFilter === "volunteer"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  Volunteer ({items.filter((i) => i.category === "volunteer").length})
                </button>
              </div>
            </div>

            {/* Experience Items List - Dynamic Color Cards */}
            <div className="space-y-3.5">
              {experienceItems.map((item) => {
                const isExpanded = !!expandedDescriptions[item.id];
                const isVolunteer = item.category === "volunteer";
                const accent = item.accentColor || (isVolunteer ? "#057642" : "#0a66c2");
                const badge = item.badgeColor || accent;

                return (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex gap-3.5 sm:gap-4 items-start group ${
                      isVolunteer
                        ? "bg-gradient-to-br from-white via-white to-emerald-50/25 dark:from-darkmode/80 dark:via-darkmode/60 dark:to-emerald-950/15 border-slate-200/90 dark:border-dark_border"
                        : "bg-gradient-to-br from-white via-white to-blue-50/25 dark:from-darkmode/80 dark:via-darkmode/60 dark:to-blue-950/15 border-slate-200/90 dark:border-dark_border"
                    }`}
                    style={{ ["--hover-border" as string]: `${accent}99` }}
                  >
                    {/* Left Accent Glow Line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2"
                      style={{ background: accent }}
                    />

                    {/* Organization Logo with Error Fallback */}
                    <div className="shrink-0 pl-1">
                      <OrganizationLogo
                        logoUrl={item.logoUrl}
                        organization={item.organization}
                        category={item.category}
                        logoShape={item.logoShape}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-bold text-dark dark:text-white text-[15px] sm:text-base leading-snug group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>

                        {/* Live Pulsing "Present" Badge */}
                        {item.isCurrent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Present
                          </span>
                        )}

                        {/* Employment Type Badge */}
                        {item.employmentType && (
                          <span
                            className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
                            style={{
                              color: badge,
                              borderColor: `${badge}40`,
                              backgroundColor: `${badge}15`,
                            }}
                          >
                            {item.employmentType}
                          </span>
                        )}

                        {/* Volunteer Pill */}
                        {isVolunteer && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Volunteer
                          </span>
                        )}
                      </div>

                      {/* Organization Name */}
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: accent }}
                        />
                        {item.organization}
                      </p>

                      {/* Meta: Dates, Location, Location Type */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium">
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
                          <span className="inline-flex items-center gap-1 px-1.5 rounded-md bg-slate-100 dark:bg-darkmode text-[10px] font-semibold text-gray-600 dark:text-gray-300 border border-slate-200/70 dark:border-dark_border/70">
                            {item.locationType}
                          </span>
                        )}
                      </div>

                      {/* Description with Expand/Collapse */}
                      {item.description && (
                        <div className="mt-2 text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          <p className={!isExpanded ? "line-clamp-2" : ""}>
                            {item.description}
                          </p>
                          {item.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(item.id)}
                              className="text-xs font-bold hover:underline mt-1 cursor-pointer inline-flex items-center gap-1"
                              style={{ color: accent }}
                            >
                              {isExpanded ? "Show less ↑" : "...see more ↓"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Micro Skill Chips */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-dark_border/60">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.skills.slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                                style={{
                                  color: accent,
                                  borderColor: `${accent}30`,
                                  backgroundColor: `${accent}12`,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* LinkedIn Diamond Bar */}
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold"
                            style={{
                              color: accent,
                              borderColor: `${accent}30`,
                              backgroundColor: `${accent}0d`,
                            }}
                          >
                            <span className="text-sm">💎</span>
                            <span>
                              Skills:{" "}
                              <span className="font-normal text-slate-600 dark:text-slate-300">
                                {item.skills.slice(0, 3).join(", ")}
                                {item.skills.length > 3 && (
                                  <strong className="font-bold" style={{ color: accent }}>
                                    {" "}and +{item.skills.length - 3} skills
                                  </strong>
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {experienceItems.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No experience items found in this category.
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: EDUCATION ═══════════ */}
          <div
            data-aos="fade-left"
            className="bg-white/90 dark:bg-darklight/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-dark_border p-5 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top colorful gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-violet-600 to-pink-500" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-dark_border/80 mb-5 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-lg shadow-md shadow-purple-500/25 shrink-0">
                  🎓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark dark:text-white leading-tight">
                    Education
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Degrees, diplomas &amp; certified training
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs">
                🎓 {educationItems.length} Milestones
              </span>
            </div>

            {/* Education Items List - Dynamic Color Cards */}
            <div className="space-y-3.5">
              {educationItems.map((item) => {
                const isExpanded = !!expandedDescriptions[item.id];
                const eduAccent = item.accentColor || "#7c3aed";
                const eduBadge = item.badgeColor || eduAccent;

                return (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-dark_border bg-gradient-to-br from-white via-white to-purple-50/25 dark:from-darkmode/80 dark:via-darkmode/60 dark:to-purple-950/15 p-4 sm:p-5 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 flex gap-3.5 sm:gap-4 items-start group"
                  >
                    {/* Left Accent Glow Line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 group-hover:w-2 transition-all duration-300"
                      style={{ background: eduAccent }}
                    />

                    {/* Institution Logo with Error Fallback */}
                    <div className="shrink-0 pl-1">
                      <OrganizationLogo
                        logoUrl={item.logoUrl}
                        organization={item.organization}
                        category={item.category}
                        logoShape={item.logoShape}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Institution Name */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-bold text-dark dark:text-white text-[15px] sm:text-base leading-snug transition-colors" style={{ ["--tw-text-opacity" as string]: "1" }}>
                          {item.organization}
                        </h4>

                        {/* Ongoing Live Pulse Badge */}
                        {item.isCurrent && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs"
                            style={{
                              color: eduAccent,
                              borderColor: `${eduAccent}40`,
                              backgroundColor: `${eduAccent}18`,
                            }}
                          >
                            <span className="relative flex h-2 w-2">
                              <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ backgroundColor: eduAccent }}
                              />
                              <span
                                className="relative inline-flex rounded-full h-2 w-2"
                                style={{ backgroundColor: eduAccent }}
                              />
                            </span>
                            Ongoing
                          </span>
                        )}

                        {/* Employment / Level Badge */}
                        {item.employmentType && (
                          <span
                            className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border"
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
                      <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: eduAccent }}>
                        {item.title}
                        {item.fieldOfStudy && !item.title.includes(item.fieldOfStudy) && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">
                            {" "}· {item.fieldOfStudy}
                          </span>
                        )}
                      </p>

                      {/* Dates & Highlighted Grade Badge */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium">
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
                        {/* Highlighted Grade Badge */}
                        {item.grade && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/15 to-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-[11px] shadow-2xs">
                            🏆 Grade: {item.grade}
                          </span>
                        )}
                      </div>

                      {/* Highlighted Activities & Societies Box */}
                      {item.activities && (
                        <div
                          className="mt-2.5 flex items-start gap-2 p-2.5 rounded-xl border text-xs"
                          style={{
                            backgroundColor: `${eduAccent}0d`,
                            borderColor: `${eduAccent}30`,
                            color: eduAccent,
                          }}
                        >
                          <span className="text-sm shrink-0">🎯</span>
                          <span>
                            <strong className="font-bold">Activities &amp; Societies:</strong>{" "}
                            {item.activities}
                          </span>
                        </div>
                      )}

                      {/* Description with Expand/Collapse */}
                      {item.description && (
                        <div className="mt-2 text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          <p className={!isExpanded ? "line-clamp-2" : ""}>
                            {item.description}
                          </p>
                          {item.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(item.id)}
                              className="text-xs font-bold hover:underline mt-1 cursor-pointer inline-flex items-center gap-1"
                              style={{ color: eduAccent }}
                            >
                              {isExpanded ? "Show less ↑" : "...see more ↓"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Micro Skill Chips */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-dark_border/60">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.skills.slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                                style={{
                                  color: eduAccent,
                                  borderColor: `${eduAccent}30`,
                                  backgroundColor: `${eduAccent}12`,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* LinkedIn Diamond Bar */}
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold"
                            style={{
                              color: eduAccent,
                              borderColor: `${eduAccent}30`,
                              backgroundColor: `${eduAccent}0d`,
                            }}
                          >
                            <span className="text-sm">💎</span>
                            <span>
                              Skills:{" "}
                              <span className="font-normal text-slate-600 dark:text-slate-300">
                                {item.skills.slice(0, 3).join(", ")}
                                {item.skills.length > 3 && (
                                  <strong className="font-bold" style={{ color: eduAccent }}>
                                    {" "}and +{item.skills.length - 3} skills
                                  </strong>
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {educationItems.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No education records found.
                </div>
              )}
            </div>
          </div>

        </div>
        )}

      </div>
    </section>
  );
};

export default ExperienceEducation;
