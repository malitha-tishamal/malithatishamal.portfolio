"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  TechItem,
  TechCategory,
  TechStackSection,
  defaultTechStackSection,
} from "@/types/techstack";
import { TechDetailModal } from "./TechDetailModal";
import { trackTechStackHover, trackTechStackClick } from "@/utils/techStackAnalytics";
import { getTechInfo, getTechBrandColor } from "@/data/techDescriptions";
import { useTheme } from "next-themes";

// ── Icon renderer ─────────────────────────────────────────────────────────────
function TechIcon({ item, color }: { item: TechItem; color?: string }) {
  if (item.iconType === "devicon") {
    return (
      <i
        className={`${item.iconValue} text-4xl transition-transform duration-300 group-hover:scale-110`}
        aria-label={item.name}
      />
    );
  }
  if (item.iconType === "url") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.iconValue}
        alt={item.name}
        className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  // emoji
  return (
    <span
      className="text-4xl leading-none transition-transform duration-300 group-hover:scale-110"
      role="img"
      aria-label={item.name}
    >
      {item.iconValue}
    </span>
  );
}

// ── Proficiency dots ──────────────────────────────────────────────────────────
function ProficiencyDots({
  level,
  color,
  isDark,
}: {
  level?: number;
  color?: string;
  isDark?: boolean;
}) {
  if (!level) return null;
  return (
    <div className="flex gap-1 mt-1 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-all duration-200"
          style={{
            backgroundColor:
              i <= level
                ? color || "#2F73F2"
                : isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.12)",
            boxShadow: i <= level && color ? `0 0 5px ${color}80` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TechStack() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const [sectionContent, setSectionContent] = useState<TechStackSection>(
    defaultTechStackSection
  );
  const [categories, setCategories] = useState<TechCategory[]>([]);
  const [items, setItems] = useState<TechItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<TechItem | null>(null);

  // Load section heading content
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "techstack"), (snap) => {
      if (snap.exists()) {
        setSectionContent({ ...defaultTechStackSection, ...(snap.data() as TechStackSection) });
      }
    });
    return () => unsub();
  }, []);

  // Load categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "techCategories"), (snap) => {
      const cats: TechCategory[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<TechCategory, "id">) }))
        .filter((c) => c.published)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setCategories(cats);
    });
    return () => unsub();
  }, []);

  // Load tech items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "techItems"), (snap) => {
      const techItems: TechItem[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<TechItem, "id">) }))
        .filter((item) => item.published)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setItems(techItems);
    });
    return () => unsub();
  }, []);

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.categoryId === activeCategory);

  return (
    <section
      id="tech-stack"
      className="py-20 bg-white dark:bg-darkmode transition-colors duration-300 relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-12" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {sectionContent.badge}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-midnight_text dark:text-white mb-3">
            {sectionContent.heading}
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {sectionContent.subheading}
          </p>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10" data-aos="fade-up" data-aos-delay="100">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                  : "bg-gray-50 dark:bg-darklight border-gray-200 dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : {}
                }
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "text-white shadow-md"
                    : "bg-gray-50 dark:bg-darklight border-gray-200 dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Tech Grid */}
        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No technologies found.</p>
        ) : (
          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            {filteredItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const cardColor = getTechBrandColor(item.name, cat?.color);
              const fallback = getTechInfo(item.name);
              const hoverDesc = item.shortDescription || fallback.shortDescription;
              const displayExp = item.experienceYears || fallback.experienceYears;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    trackTechStackClick(item);
                    setSelectedItem(item);
                  }}
                  onMouseEnter={() => {
                    trackTechStackHover(item);
                  }}
                  style={{
                    background: isDark
                      ? `linear-gradient(145deg, ${cardColor}18 0%, rgba(13, 22, 44, 0.85) 100%)`
                      : `linear-gradient(145deg, ${cardColor}0f 0%, #ffffff 100%)`,
                    borderColor: isDark ? `${cardColor}38` : `${cardColor}30`,
                    boxShadow: isDark
                      ? `0 4px 16px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                      : `0 2px 10px -2px rgba(0, 0, 0, 0.04), 0 0 0 1px ${cardColor}12`,
                  }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                    border hover:shadow-xl hover:-translate-y-1.5
                    transition-all duration-300 cursor-pointer text-center select-none"
                >
                  <TechIcon item={item} color={cardColor} />
                  <span className="text-xs font-bold text-center text-midnight_text dark:text-gray-100 leading-tight">
                    {item.name}
                  </span>
                  <ProficiencyDots level={item.proficiency} color={cardColor} isDark={isDark} />

                  {/* Hover accent border glow */}
                  <span
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: isDark
                        ? `inset 0 0 0 1.5px ${cardColor}cc, 0 12px 30px -6px ${cardColor}55`
                        : `inset 0 0 0 1.5px ${cardColor}aa, 0 12px 28px -6px ${cardColor}40`,
                    }}
                  />

                  {/* ══ Premium Glass Tooltip ══════════════════════════════════ */}
                  <div
                    className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2
                      invisible opacity-0 -translate-y-1
                      group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                      transition-all duration-200 ease-out
                      z-50 pointer-events-none w-60"
                  >
                    {/* Glass panel */}
                    <div
                      className="relative rounded-2xl overflow-hidden text-left px-3.5 pt-3.5 pb-3"
                      style={{
                        background: isDark
                          ? `linear-gradient(140deg, rgba(22, 35, 65, 0.94) 0%, rgba(12, 19, 36, 0.97) 100%)`
                          : `linear-gradient(140deg, #ffffff 0%, rgba(248, 250, 252, 0.98) 100%)`,
                        border: `1px solid ${isDark ? `${cardColor}65` : `${cardColor}45`}`,
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        boxShadow: isDark
                          ? `0 20px 50px -10px rgba(0,0,0,0.65), 0 0 25px -5px ${cardColor}35, inset 0 1px 0 rgba(255,255,255,0.1)`
                          : `0 20px 45px -10px rgba(15,23,42,0.14), 0 0 20px -5px ${cardColor}25, inset 0 1px 0 rgba(255,255,255,0.8)`,
                      }}
                    >
                      {/* Top shimmer line */}
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${cardColor}dd 40%, ${cardColor} 50%, ${cardColor}dd 60%, transparent)`,
                        }}
                      />

                      {/* Corner radial glow */}
                      <div
                        className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-20"
                        style={{
                          background: `radial-gradient(circle at top right, ${cardColor}, transparent 70%)`,
                        }}
                      />

                      {/* Header: dot + name + exp */}
                      <div className="relative z-10 flex items-center gap-1.5 mb-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: cardColor,
                            boxShadow: `0 0 8px ${cardColor}`,
                          }}
                        />
                        <span className="font-bold text-[12.5px] text-midnight_text dark:text-white leading-none">
                          {item.name}
                        </span>
                        {displayExp && (
                          <span
                            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                            style={{
                              backgroundColor: `${cardColor}22`,
                              color: cardColor,
                              border: `1px solid ${cardColor}44`,
                            }}
                          >
                            {displayExp}
                          </span>
                        )}
                      </div>

                      {/* Category label */}
                      {cat && (
                        <div
                          className="relative z-10 text-[9px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: cardColor }}
                        >
                          {cat.name}
                        </div>
                      )}

                      {/* Description */}
                      <p className="relative z-10 text-[11px] leading-[1.55] text-gray-600 dark:text-gray-200/90 line-clamp-3">
                        {hoverDesc}
                      </p>

                      {/* CTA footer */}
                      <div
                        className="relative z-10 mt-2.5 pt-2 border-t flex items-center gap-1.5 text-[10px] font-bold"
                        style={{
                          borderColor: isDark ? `${cardColor}30` : `${cardColor}25`,
                          color: cardColor,
                        }}
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Click to view full details
                      </div>
                    </div>

                    {/* Arrow caret */}
                    <div className="flex justify-center">
                      <div
                        className="w-3 h-3 rotate-45 -mt-1.5"
                        style={{
                          background: isDark ? "rgba(12, 19, 36, 0.97)" : "#ffffff",
                          borderRight: `1px solid ${isDark ? `${cardColor}65` : `${cardColor}45`}`,
                          borderBottom: `1px solid ${isDark ? `${cardColor}65` : `${cardColor}45`}`,
                        }}
                      />
                    </div>
                  </div>
                  {/* ══ End Glass Tooltip ══════════════════════════════════════ */}
                </div>
              );
            })}
          </div>
        )}

        {/* Category legend (shown when "all" is selected) */}
        {activeCategory === "all" && categories.length > 0 && (
          <div
            className="flex flex-wrap justify-center gap-4 mt-10 pt-8 border-t border-gray-100 dark:border-white/[0.07]"
            data-aos="fade-up"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-midnight_text dark:hover:text-white transition-colors cursor-pointer"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tech Details Modal */}
      <TechDetailModal
        item={selectedItem}
        category={categories.find((c) => c.id === selectedItem?.categoryId)}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
}
