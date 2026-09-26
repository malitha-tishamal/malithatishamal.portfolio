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
import { getTechInfo } from "@/data/techDescriptions";

// ── Icon renderer ─────────────────────────────────────────────────────────────
function TechIcon({ item }: { item: TechItem }) {
  if (item.iconType === "devicon") {
    return (
      <i
        className={`${item.iconValue} text-4xl`}
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
        className="w-10 h-10 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  // emoji
  return (
    <span className="text-4xl leading-none" role="img" aria-label={item.name}>
      {item.iconValue}
    </span>
  );
}

// ── Proficiency dots ──────────────────────────────────────────────────────────
function ProficiencyDots({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <div className="flex gap-0.5 mt-1 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TechStack() {
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
    <section className="py-20 bg-white dark:bg-blacksection">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {sectionContent.badge}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-dark dark:text-white mb-3">
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
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-gray-50 dark:bg-white/[0.05] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
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
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  activeCategory === cat.id
                    ? "text-white shadow-md"
                    : "bg-gray-50 dark:bg-white/[0.05] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
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
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            {filteredItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const cardColor = cat?.color ?? "#0a66c2";
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
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl
                    bg-gray-50 dark:bg-[#141b2d]
                    border border-gray-200 dark:border-white/[0.08]
                    hover:shadow-xl hover:-translate-y-1.5
                    transition-all duration-200 cursor-pointer text-center select-none"
                >
                  <TechIcon item={item} />
                  <span className="text-xs font-semibold text-center text-gray-700 dark:text-gray-200 leading-tight">
                    {item.name}
                  </span>
                  <ProficiencyDots level={item.proficiency} />

                  {/* Hover accent border glow */}
                  <span
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1.5px ${cardColor}99, 0 8px 28px -6px ${cardColor}40`,
                    }}
                  />

                  {/* ══ Premium Glass Tooltip ══════════════════════════════════ */}
                  <div
                    className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2
                      invisible opacity-0 -translate-y-1
                      group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                      transition-all duration-200 ease-out
                      z-50 pointer-events-none w-56"
                  >
                    {/* Glass panel */}
                    <div
                      className="relative rounded-2xl overflow-hidden text-left px-3.5 pt-3.5 pb-3"
                      style={{
                        background: `linear-gradient(135deg, ${cardColor}1a 0%, rgba(8,14,28,0.86) 70%)`,
                        border: `1px solid ${cardColor}50`,
                        backdropFilter: "blur(22px) saturate(200%)",
                        WebkitBackdropFilter: "blur(22px) saturate(200%)",
                        boxShadow: `0 20px 60px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`,
                      }}
                    >
                      {/* Top shimmer line */}
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${cardColor}cc 40%, ${cardColor} 50%, ${cardColor}cc 60%, transparent)`,
                        }}
                      />

                      {/* Corner radial glow */}
                      <div
                        className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-25"
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
                            boxShadow: `0 0 7px ${cardColor}`,
                          }}
                        />
                        <span className="font-bold text-[12.5px] text-white leading-none">{item.name}</span>
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
                          style={{ color: `${cardColor}dd` }}
                        >
                          {cat.name}
                        </div>
                      )}

                      {/* Description */}
                      <p className="relative z-10 text-[11px] leading-[1.55] text-gray-200/85 line-clamp-3">
                        {hoverDesc}
                      </p>

                      {/* CTA footer */}
                      <div
                        className="relative z-10 mt-2.5 pt-2 border-t flex items-center gap-1.5 text-[10px] font-bold"
                        style={{
                          borderColor: `${cardColor}28`,
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
                          background: "rgba(8,14,28,0.86)",
                          borderRight: `1px solid ${cardColor}50`,
                          borderBottom: `1px solid ${cardColor}50`,
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
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
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
