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

// ── Icon renderer ─────────────────────────────────────────────────────────────
function TechIcon({ item }: { item: TechItem }) {
  if (item.iconType === "devicon") {
    return (
      <i
        className={`${item.iconValue} text-4xl`}
        title={item.name}
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

  // Get accent color for active category
  const activeCat = categories.find((c) => c.id === activeCategory);
  const accentColor = activeCat?.color ?? "#0a66c2";

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
                  : "bg-white dark:bg-darklight border-gray-200 dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
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
                    : "bg-white dark:bg-darklight border-gray-200 dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:text-primary"
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
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-darklight border border-gray-100 dark:border-dark_border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <TechIcon item={item} />
                <span className="text-xs font-semibold text-center text-gray-700 dark:text-gray-300 leading-tight">
                  {item.name}
                </span>
                <ProficiencyDots level={item.proficiency} />

                {/* Hover accent glow */}
                <span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${
                      categories.find((c) => c.id === item.categoryId)?.color ?? "#0a66c2"
                    }55`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Category legend (shown when "all" is selected) */}
        {activeCategory === "all" && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-10 pt-8 border-t border-gray-100 dark:border-dark_border" data-aos="fade-up">
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
    </section>
  );
}
