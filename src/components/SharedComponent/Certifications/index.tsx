"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CertificationItem, defaultCertifications } from "@/types/certification";
import {
  CERT_CARD_WIDTH,
  CertificationCardItem,
  CertificationCardSkeleton,
} from "@/components/Certifications/CertificationCardItem";
import { CertificationDetailModal } from "@/components/Certifications/CertificationDetailModal";
import { MarqueeRows } from "@/components/SharedComponent/MarqueeRows";
import { MARQUEE_LANE } from "@/components/SharedComponent/MarqueeRows/lane";
import { getCertificateIssueDate } from "@/utils/certificateDate";

const LATEST_COUNT = 6;
const SCROLL_SPEED = 50;

const Certifications: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<CertificationItem | null>(null);

  // Real-time Firestore sync
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

  return (
    <section
      id="certifications"
      className="overflow-x-clip scroll-mt-24 bg-white py-16 transition-colors sm:py-24 dark:bg-darkmode"
    >
      {/* Heading keeps the centred container; the rows below break out full width */}
      <div className={`mx-auto w-full max-w-[1280px] ${MARQUEE_LANE}`}>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Credentials &amp; Accreditation
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-midnight_text sm:text-4xl dark:text-white">
              Licenses &amp; Certifications
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-grey sm:text-base dark:text-gray-300">
              Industry-recognized technical certifications, security credentials, and
              specialized engineering badges.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/certifications"
              className="group inline-flex items-center gap-2 text-sm font-bold text-midnight_text transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
            >
              <span>View All Certifications</span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Two-row endless marquee — full-bleed rows, no card in both rows */}
      <MarqueeRows<CertificationItem>
        items={items}
        getKey={(item) => item.id}
        getUpdatedAt={getCertificateIssueDate}
        latestCount={LATEST_COUNT}
        speed={SCROLL_SPEED}
        rowCount={2}
        loading={loading}
        skeletonCount={8}
        renderSkeleton={() => <CertificationCardSkeleton widthClass={CERT_CARD_WIDTH} />}
        ariaLabel="Certifications"
        previousLabel="Previous certificates"
        nextLabel="Next certificates"
        emptyState={
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            No certifications published yet.
          </p>
        }
        renderCard={(item, { latestLabel }) => (
          <CertificationCardItem
            item={item}
            latestLabel={latestLabel}
            widthClass={CERT_CARD_WIDTH}
            onPreview={setSelectedItem}
          />
        )}
      />

      {/* Detail / Preview Lightbox Modal */}
      <CertificationDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  );
};

export default Certifications;
