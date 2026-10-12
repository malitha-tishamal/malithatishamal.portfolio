"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CertificationItem,
  CERTIFICATION_CATEGORIES,
} from "@/types/certification";
import { CertificationCardItem } from "./CertificationCardItem";
import { CertificationDetailModal } from "./CertificationDetailModal";
import { trackCertificationSectionView } from "@/utils/certificationAnalytics";

export const CertificationsList: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<CertificationItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const sliderRef = useRef<Slider | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    trackCertificationSectionView();
    try {
      const unsubscribeCerts = onSnapshot(
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

      const unsubscribeCategories = onSnapshot(
        doc(db, "siteContent", "certificationCategories"),
        (snap) => {
          if (snap.exists() && Array.isArray(snap.data()?.categories)) {
            setCustomCategories(snap.data().categories);
          }
        },
        (err) => console.warn("Custom categories listener notice:", err)
      );

      return () => {
        unsubscribeCerts();
        unsubscribeCategories();
      };
    } catch (err) {
      console.error("Error in certifications listener:", err);
      setItems([]);
      setLoading(false);
    }
  }, []);

  // Available unique categories (built-in + custom + from items)
  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    CERTIFICATION_CATEGORIES.forEach((c) => cats.add(c));
    customCategories.forEach((c) => {
      if (c && c.trim()) cats.add(c.trim());
    });
    items.forEach((it) => {
      if (it.category) cats.add(it.category);
    });
    return Array.from(cats);
  }, [items, customCategories]);

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

  const slidesToShow = Math.min(filtered.length, 3);

  const sliderSettings = {
    dots: false,
    arrows: false, // Using our custom arrow buttons
    infinite: filtered.length > 3,
    slidesToShow,
    slidesToScroll: 1,
    swipe: true,
    swipeToSlide: true,
    draggable: true,
    touchMove: true,
    touchThreshold: 8,
    cssEase: "ease-out",
    speed: 400,
    waitForAnimate: false,
    beforeChange: () => {
      isDraggingRef.current = true;
    },
    afterChange: () => {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 80);
    },
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(filtered.length, 2),
          slidesToScroll: 1,
          swipeToSlide: true,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          swipeToSlide: true,
        },
      },
    ],
  };

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

        {/* Certifications Slider */}
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
          <div className="relative px-14 sm:px-16 md:px-20 select-none">

            {/* LEFT ARROW */}
            <button
              type="button"
              onClick={() => sliderRef.current?.slickPrev()}
              aria-label="Scroll Left"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-darklight border-2 border-red-500 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90"
              title="Scroll Left"
            >
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 stroke-current stroke-[3] -translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* RIGHT ARROW */}
            <button
              type="button"
              onClick={() => sliderRef.current?.slickNext()}
              aria-label="Scroll Right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-darklight border-2 border-red-500 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90"
              title="Scroll Right"
            >
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 stroke-current stroke-[3] translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <Slider ref={sliderRef} {...sliderSettings}>
              {filtered.map((item) => (
                <div key={item.id} className="px-3 py-2 h-full">
                  <CertificationCardItem
                    item={item}
                    onPreview={(it) => {
                      if (!isDraggingRef.current) setSelectedItem(it);
                    }}
                  />
                </div>
              ))}
            </Slider>
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