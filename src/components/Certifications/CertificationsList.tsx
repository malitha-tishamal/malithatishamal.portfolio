"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CertificationItem,
  CERTIFICATION_CATEGORIES,
  defaultCertifications,
} from "@/types/certification";
import { CertificationCardItem } from "./CertificationCardItem";
import { CertificationDetailModal } from "./CertificationDetailModal";

export const CertificationsList: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CertificationItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "certifications"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: CertificationItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as CertificationItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setItems(fetched.filter((c) => c.published !== false));
          } else {
            setItems([]);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Certifications listener notice:", error.message);
          setItems([]);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error in certifications listener:", err);
      setItems([]);
      setLoading(false);
    }
  }, []);

  // Available unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    CERTIFICATION_CATEGORIES.forEach((c) => cats.add(c));
    items.forEach((it) => {
      if (it.category) cats.add(it.category);
    });
    return Array.from(cats);
  }, [items]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchCat =
        selectedCategory === "All" ||
        it.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.issuer.toLowerCase().includes(q) ||
        it.credentialId?.toLowerCase().includes(q) ||
        it.skills?.some((s) => s.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <section className="pt-8 pb-20 dark:bg-darkmode">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* Search & Counter Bar */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-gray-100 dark:border-dark_border shadow-xs">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, issuer, skill, ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-dark dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Showing <strong className="text-primary">{filtered.length}</strong> of {items.length} credentials
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 font-bold"
                    : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border border-border/70 dark:border-dark_border hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Certifications Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-white dark:bg-darklight p-5 h-80 animate-pulse border border-border/60 dark:border-dark_border/60 flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-darkmode shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-darkmode rounded-md w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-4/5" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border/40 dark:border-dark_border/40">
                  <div className="h-4 bg-gray-200 dark:bg-darkmode rounded-md w-24" />
                  <div className="h-8 bg-gray-200 dark:bg-darkmode rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div key={item.id} className="h-full">
                <CertificationCardItem
                  item={item}
                  onPreview={(it) => setSelectedItem(it)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-darklight rounded-2xl border border-gray-100 dark:border-dark_border">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🎓
            </div>
            <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
              No matching credentials found
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              We could not find any credentials matching &quot;{searchQuery}&quot;. Try resetting filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Detail / Preview Modal */}
      <CertificationDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
};