"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CertificationItem, defaultCertifications } from "@/types/certification";
import { CertificationCardItem } from "@/components/Certifications/CertificationCardItem";
import { CertificationDetailModal } from "@/components/Certifications/CertificationDetailModal";

const Certifications: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<CertificationItem | null>(null);

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
            setItems(defaultCertifications);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Certifications listener notice:", error.message);
          setItems(defaultCertifications);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up certifications listener:", err);
      setItems(defaultCertifications);
      setLoading(false);
    }
  }, []);

  const sliderSettings = {
    dots: false,
    arrows: true,
    infinite: items.length > 3,
    speed: 600,
    autoplay: true,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    slidesToShow: Math.min(items.length, 3),
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(items.length, 3),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(items.length, 2),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        },
      },
    ],
  };

  return (
    <section id="certifications" className="py-16 md:py-20 dark:bg-darkmode">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Credentials & Accreditation
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-midnight_text dark:text-white leading-tight">
              Licenses & Certifications
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
              Industry-recognized technical certifications, security credentials, and specialized engineering badges.
            </p>
          </div>

          <Link
            href="/certifications"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-darklight border border-border/80 dark:border-dark_border text-midnight_text dark:text-white font-bold text-xs sm:text-sm hover:border-primary hover:text-primary transition shadow-xs group shrink-0 cursor-pointer"
          >
            <span>View All Certifications</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Carousel Slider or Centered Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 dark:bg-darklight p-6 h-96 animate-pulse border border-border/40 dark:border-dark_border/40 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-darkmode rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-darkmode rounded-md w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-darkmode rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-48 bg-gray-200 dark:bg-darkmode rounded-xl w-full" />
                <div className="h-10 bg-gray-200 dark:bg-darkmode rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        ) : items.length === 1 ? (
          <div className="max-w-md mx-auto py-2">
            <CertificationCardItem
              item={items[0]}
              onPreview={(it) => setSelectedItem(it)}
            />
          </div>
        ) : items.length === 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto py-2">
            {items.map((item) => (
              <CertificationCardItem
                key={item.id}
                item={item}
                onPreview={(it) => setSelectedItem(it)}
              />
            ))}
          </div>
        ) : (
          <div className="certifications-slider -mx-3">
            <Slider {...sliderSettings}>
              {items.map((item) => (
                <div key={item.id} className="px-3 pb-4 h-full">
                  <CertificationCardItem
                    item={item}
                    onPreview={(it) => setSelectedItem(it)}
                  />
                </div>
              ))}
            </Slider>
          </div>
        )}

      </div>

      {/* Detail / Preview Lightbox Modal */}
      <CertificationDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </section>
  );
};

export default Certifications;