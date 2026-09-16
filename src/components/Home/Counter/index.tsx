"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CounterConfig {
  ratingMode: "site" | "google";
  googleRating: number;
  googleReviewCount: number;
  googleReviewUrl: string;
  testimonialsLabel: string;
  projectsThisYearLabel: string;
  totalProjectsLabel: string;
  testimonialsOverride: number;
  projectsThisYearOverride: number;
  totalProjectsOverride: number;
}

const defaultConfig: CounterConfig = {
  ratingMode: "site",
  googleRating: 4.9,
  googleReviewCount: 0,
  googleReviewUrl: "",
  testimonialsLabel: "Client testimonials received in the year",
  projectsThisYearLabel: "Projects completed in",
  totalProjectsLabel: "Total projects completed",
  testimonialsOverride: 0,
  projectsThisYearOverride: 0,
  totalProjectsOverride: 0,
};

// ── Star renderer ─────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.4;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          {i <= full ? (
            <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#f59e0b" />
          ) : i === full + 1 && half ? (
            <>
              <defs>
                <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
              <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill={`url(#half-${i})`} />
            </>
          ) : (
            <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#d1d5db" className="dark:fill-gray-600" />
          )}
        </svg>
      ))}
    </div>
  );
}

// ── Animated number ───────────────────────────────────────────────────────────
function AnimatedNumber({ target, decimals = 0, suffix = "" }: { target: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const pct = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - pct, 3);
            setDisplay(parseFloat((eased * target).toFixed(decimals)));
            if (pct < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
      {suffix}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
const Counter = ({ isColorMode }: { isColorMode: boolean }) => {
  const [config, setConfig] = useState<CounterConfig>(defaultConfig);
  const [testimonialCount, setTestimonialCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [projectsThisYear, setProjectsThisYear] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);

  const currentYear = new Date().getFullYear();

  // Load counter config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "counter"), (snap) => {
      if (snap.exists()) setConfig({ ...defaultConfig, ...(snap.data() as CounterConfig) });
    });
    return () => unsub();
  }, []);

  // Load testimonials — count + avg rating
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "testimonials"), (snap) => {
      let count = 0;
      let ratingSum = 0;
      let ratingCount = 0;
      snap.forEach((d) => {
        const data = d.data();
        if (data.status === "approved" || data.status === "published" || !data.status) {
          count++;
        }
        if (typeof data.rating === "number" && data.rating > 0) {
          ratingSum += data.rating;
          ratingCount++;
        }
      });
      setTestimonialCount(count);
      setAvgRating(ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0);
    });
    return () => unsub();
  }, []);

  // Load projects — count all + this year
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      let thisYear = 0;
      let total = 0;
      snap.forEach((d) => {
        total++;
        const data = d.data();
        // Check createdAt timestamp year
        const ts = data.createdAt;
        if (ts) {
          const year = ts.toDate ? ts.toDate().getFullYear() : new Date(ts).getFullYear();
          if (year === currentYear) thisYear++;
        }
      });
      setProjectsThisYear(thisYear);
      setTotalProjects(total);
    });
    return () => unsub();
  }, [currentYear]);

  // Final values (override or auto)
  const finalTestimonials = config.testimonialsOverride > 0 ? config.testimonialsOverride : testimonialCount;
  const finalThisYear = config.projectsThisYearOverride > 0 ? config.projectsThisYearOverride : projectsThisYear;
  const finalTotal = config.totalProjectsOverride > 0 ? config.totalProjectsOverride : totalProjects;
  const displayRating = config.ratingMode === "google" ? config.googleRating : avgRating;

  const stats = [
    {
      key: "rating",
      icon: (
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      value: displayRating,
      decimals: 1,
      suffix: "",
      label: (
        <span className="text-sm text-grey dark:text-white/50 text-center">
          {config.ratingMode === "google" ? (
            <>
              Out of 5 stars
              {config.googleReviewCount > 0 && ` from ${config.googleReviewCount.toLocaleString()} reviews`}
              {" "}on{" "}
              {config.googleReviewUrl ? (
                <a href={config.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Google
                </a>
              ) : "Google"}
            </>
          ) : (
            <>Out of 5 stars · Site reviews average</>
          )}
        </span>
      ),
      extra: <div className="mt-1"><StarRating rating={displayRating} /></div>,
    },
    {
      key: "testimonials",
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      value: finalTestimonials,
      decimals: 0,
      suffix: "+",
      label: (
        <span className="text-sm text-grey dark:text-white/50 text-center">
          {config.testimonialsLabel} <span className="font-semibold text-primary">{currentYear}</span>
        </span>
      ),
      extra: null,
    },
    {
      key: "thisyear",
      icon: (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      value: finalThisYear,
      decimals: 0,
      suffix: "+",
      label: (
        <span className="text-sm text-grey dark:text-white/50 text-center">
          {config.projectsThisYearLabel} <span className="font-semibold text-green-500">{currentYear}</span>
        </span>
      ),
      extra: null,
    },
    {
      key: "total",
      icon: (
        <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      value: finalTotal,
      decimals: 0,
      suffix: "+",
      label: (
        <span className="text-sm text-grey dark:text-white/50 text-center">
          {config.totalProjectsLabel}
        </span>
      ),
      extra: null,
    },
  ];

  return (
    <section
      className={`py-14 ${
        isColorMode ? "dark:bg-darklight bg-section" : "dark:bg-darkmode bg-white"
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className="flex flex-col items-center gap-3"
              data-aos="fade-up"
              data-aos-delay={`${index * 150}`}
              data-aos-duration="800"
            >
              {stat.icon}
              <span className="text-4xl md:text-5xl font-bold text-midnight_text dark:text-white leading-none">
                <AnimatedNumber
                  target={stat.value}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                />
              </span>
              {stat.extra}
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Counter;
