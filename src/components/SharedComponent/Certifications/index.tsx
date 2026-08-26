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
  const [items, setItems] = useState<CertificationItem[]>(defaultCertifications);
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
        },
        (error) => {
          console.warn("Certifications listener notice:", error.message);
          setItems(defaultCertifications);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up certifications listener:", err);
      setItems(defaultCertifications);
    }
  }, []);

  const sliderSettings = {
    dots: false,
    arrows: true,
    infinite: items.length > 2,
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
          slidesToShow: Math.min(items.length, 2),
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
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
      <div className="container mx-auto max-w-6xl px-4">
        
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

        {/* Carousel Slider */}
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