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
    <section id="experience-education" className="py-16 md:py-20 dark:bg-darkmode border-b border-border/40 dark:border-dark_border/40">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14" data-aos="fade-up">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Career & Academic Pathway
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-midnight_text dark:text-white leading-tight">
            Work Experience & Education
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5">
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
            className="bg-white dark:bg-darklight rounded-2xl border border-border/80 dark:border-dark_border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            {/* Header with Title & Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/70 dark:border-dark_border/70 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center text-base shrink-0">
                  💼
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-white leading-tight">
                    Experience
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Professional, contract & volunteer roles
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-darkmode p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setActiveExpFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeExpFilter === "all"
                      ? "bg-white dark:bg-darklight text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveExpFilter("work")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeExpFilter === "work"
                      ? "bg-white dark:bg-darklight text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  Work
                </button>
                <button
                  onClick={() => setActiveExpFilter("volunteer")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeExpFilter === "volunteer"
                      ? "bg-white dark:bg-darklight text-primary shadow-xs font-bold"
                      : "text-gray-500 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  Volunteer
                </button>
              </div>
            </div>

            {/* Experience Items List - Highlighted & Compact Cards */}
            <div className="space-y-3">
              {experienceItems.map((item) => {
                const logoShape =
                  item.logoShape === "circle"
                    ? "rounded-full"
                    : item.logoShape === "square"
                    ? "rounded-md"
                    : "rounded-xl";

                const isExpanded = !!expandedDescriptions[item.id];

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/90 dark:bg-darkmode/50 dark:hover:bg-darkmode/80 border border-border/60 dark:border-dark_border/60 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex gap-3 sm:gap-3.5 items-start group"
                  >
                    {/* Organization Logo */}
                    <div
                      className={`w-10 h-10 ${logoShape} bg-white dark:bg-darklight border border-border/80 dark:border-dark_border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative mt-0.5`}
                    >
                      {item.logoUrl ? (
                        <Image
                          src={item.logoUrl}
                          alt={item.organization}
                          width={40}
                          height={40}
                          className="w-full h-full object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {item.organization.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-dark dark:text-white text-sm sm:text-[15px] leading-snug group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        {item.employmentType && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/10 text-primary border border-primary/20">
                            {item.employmentType}
                          </span>
                        )}
                        {item.category === "volunteer" && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Volunteer
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                        {item.organization}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>
                          {item.startDate} – {item.endDate || (item.isCurrent ? "Present" : "")}
                        </span>
                        {item.location && (
                          <>
                            <span>·</span>
                            <span>{item.location}</span>
                          </>
                        )}
                        {item.locationType && (
                          <>
                            <span>·</span>
                            <span className="text-gray-400">{item.locationType}</span>
                          </>
                        )}
                      </div>

                      {/* Description with Expand/Collapse */}
                      {item.description && (
                        <div className="mt-1.5">
                          <p
                            className={`text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed ${
                              !isExpanded ? "line-clamp-2" : ""
                            }`}
                          >
                            {item.description}
                          </p>
                          {item.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(item.id)}
                              className="text-[10px] font-bold text-primary hover:underline mt-0.5 cursor-pointer"
                            >
                              {isExpanded ? "Show less" : "...see more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* LinkedIn Diamond Skills Pill */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/50 px-2.5 py-0.8 rounded-lg border border-primary/20 w-fit">
                          <span className="text-xs">💎</span>
                          <span>
                            {item.skills.slice(0, 2).join(", ")}
                            {item.skills.length > 2 && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                {" "}and +{item.skills.length - 2} skills
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {experienceItems.length === 0 && (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No experience items found in this category.
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: EDUCATION ═══════════ */}
          <div
            data-aos="fade-left"
            className="bg-white dark:bg-darklight rounded-2xl border border-border/80 dark:border-dark_border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/70 dark:border-dark_border/70 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base shrink-0">
                  🎓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-white leading-tight">
                    Education
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Degrees, diplomas & certified training
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300">
                {educationItems.length} Milestones
              </span>
            </div>

            {/* Education Items List - Highlighted & Compact Cards */}
            <div className="space-y-3">
              {educationItems.map((item) => {
                const logoShape =
                  item.logoShape === "circle"
                    ? "rounded-full"
                    : item.logoShape === "square"
                    ? "rounded-md"
                    : "rounded-xl";

                const isExpanded = !!expandedDescriptions[item.id];

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/90 dark:bg-darkmode/50 dark:hover:bg-darkmode/80 border border-border/60 dark:border-dark_border/60 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex gap-3 sm:gap-3.5 items-start group"
                  >
                    {/* Institution Logo */}
                    <div
                      className={`w-10 h-10 ${logoShape} bg-white dark:bg-darklight border border-border/80 dark:border-dark_border flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative mt-0.5`}
                    >
                      {item.logoUrl ? (
                        <Image
                          src={item.logoUrl}
                          alt={item.organization}
                          width={40}
                          height={40}
                          className="w-full h-full object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs font-bold text-purple-600">
                          {item.organization.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-dark dark:text-white text-sm sm:text-[15px] leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.organization}
                      </h4>

                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                        {item.title}
                        {item.fieldOfStudy && !item.title.includes(item.fieldOfStudy) && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal">, {item.fieldOfStudy}</span>
                        )}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>
                          {item.startDate} – {item.endDate || (item.isCurrent ? "Present" : "")}
                        </span>
                        {item.grade && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Grade: {item.grade}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Activities & societies */}
                      {item.activities && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 italic">
                          Activities: {item.activities}
                        </p>
                      )}

                      {/* Description */}
                      {item.description && (
                        <div className="mt-1.5">
                          <p
                            className={`text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed ${
                              !isExpanded ? "line-clamp-2" : ""
                            }`}
                          >
                            {item.description}
                          </p>
                          {item.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(item.id)}
                              className="text-[10px] font-bold text-purple-600 hover:underline mt-0.5 cursor-pointer"
                            >
                              {isExpanded ? "Show less" : "...see more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* LinkedIn Diamond Skills Pill */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-950/50 px-2.5 py-0.8 rounded-lg border border-purple-500/20 w-fit">
                          <span className="text-xs">💎</span>
                          <span>
                            {item.skills.slice(0, 2).join(", ")}
                            {item.skills.length > 2 && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                {" "}and +{item.skills.length - 2} skills
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {educationItems.length === 0 && (
                <div className="py-6 text-center text-gray-400 text-xs">
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
