"use client";

import React, { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

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

export function CounterManager() {
  const [config, setConfig] = useState<CounterConfig>(defaultConfig);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Live counts from Firestore
  const [liveTestimonials, setLiveTestimonials] = useState(0);
  const [liveAvgRating, setLiveAvgRating] = useState(0);
  const [liveProjectsThisYear, setLiveProjectsThisYear] = useState(0);
  const [liveTotalProjects, setLiveTotalProjects] = useState(0);

  const currentYear = new Date().getFullYear();

  // Load config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "counter"), (snap) => {
      if (snap.exists()) setConfig({ ...defaultConfig, ...(snap.data() as CounterConfig) });
    });
    return () => unsub();
  }, []);

  // Live testimonial count + avg rating
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "testimonials"), (snap) => {
      let count = 0;
      let ratingSum = 0;
      let ratingCount = 0;
      snap.forEach((d) => {
        const data = d.data();
        if (data.status === "approved" || data.status === "published" || !data.status) count++;
        if (typeof data.rating === "number" && data.rating > 0) {
          ratingSum += data.rating;
          ratingCount++;
        }
      });
      setLiveTestimonials(count);
      setLiveAvgRating(ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0);
    });
    return () => unsub();
  }, []);

  // Live project counts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "projects"), (snap) => {
      let thisYear = 0;
      let total = 0;
      snap.forEach((d) => {
        total++;
        const ts = d.data().createdAt;
        if (ts) {
          const year = ts.toDate ? ts.toDate().getFullYear() : new Date(ts).getFullYear();
          if (year === currentYear) thisYear++;
        }
      });
      setLiveProjectsThisYear(thisYear);
      setLiveTotalProjects(total);
    });
    return () => unsub();
  }, [currentYear]);

  const update = (patch: Partial<CounterConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "counter"), config, { merge: true });
      setDirty(false);
      toast.success("Stats configuration saved!");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Display values
  const displayRating = config.ratingMode === "google" ? config.googleRating : liveAvgRating;
  const displayTestimonials = config.testimonialsOverride > 0 ? config.testimonialsOverride : liveTestimonials;
  const displayThisYear = config.projectsThisYearOverride > 0 ? config.projectsThisYearOverride : liveProjectsThisYear;
  const displayTotal = config.totalProjectsOverride > 0 ? config.totalProjectsOverride : liveTotalProjects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Stats & Counter Section</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure the 4 stats shown below your hero section
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-primary/20"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Live Preview */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Live Preview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: "⭐",
              value: displayRating > 0 ? displayRating.toFixed(1) : "—",
              label: config.ratingMode === "google"
                ? `Out of 5 · Google${config.googleReviewCount > 0 ? ` (${config.googleReviewCount.toLocaleString()})` : ""}`
                : "Out of 5 · Site reviews avg",
              color: "text-amber-500",
            },
            {
              icon: "👥",
              value: displayTestimonials > 0 ? `${displayTestimonials}+` : "—",
              label: `${config.testimonialsLabel} ${currentYear}`,
              color: "text-primary",
            },
            {
              icon: "✅",
              value: displayThisYear > 0 ? `${displayThisYear}+` : "—",
              label: `${config.projectsThisYearLabel} ${currentYear}`,
              color: "text-green-500",
            },
            {
              icon: "🏆",
              value: displayTotal > 0 ? `${displayTotal}+` : "—",
              label: config.totalProjectsLabel,
              color: "text-violet-500",
            },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat 1: Rating ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <h2 className="text-base font-bold text-dark dark:text-white">Stat 1 — Rating</h2>
        </div>

        {/* Mode toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Rating Source</label>
          <div className="flex gap-3">
            <button
              onClick={() => update({ ratingMode: "site" })}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition text-left ${
                config.ratingMode === "site"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border dark:border-dark_border text-gray-500 hover:border-primary/40"
              }`}
            >
              <div className="font-bold">⭐ Site Reviews</div>
              <div className="text-xs opacity-70 mt-0.5">Auto-calculated from testimonials ratings</div>
              {liveAvgRating > 0 && (
                <div className="text-xs mt-1 font-bold text-green-500">
                  Current avg: {liveAvgRating.toFixed(1)} / 5 ({liveTestimonials} reviews)
                </div>
              )}
            </button>
            <button
              onClick={() => update({ ratingMode: "google" })}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition text-left ${
                config.ratingMode === "google"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border dark:border-dark_border text-gray-500 hover:border-primary/40"
              }`}
            >
              <div className="font-bold">🌐 Google Reviews</div>
              <div className="text-xs opacity-70 mt-0.5">Manual rating + link to your Google page</div>
            </button>
          </div>
        </div>

        {config.ratingMode === "google" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Google Rating (e.g. 4.9)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={config.googleRating}
                onChange={(e) => update({ googleRating: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Review Count</label>
              <input
                type="number"
                min="0"
                value={config.googleReviewCount}
                onChange={(e) => update({ googleReviewCount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Google Review URL</label>
              <input
                type="url"
                value={config.googleReviewUrl}
                onChange={(e) => update({ googleReviewUrl: e.target.value })}
                placeholder="https://g.page/r/..."
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stat 2: Testimonials ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <h2 className="text-base font-bold text-dark dark:text-white">Stat 2 — Client Testimonials</h2>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
            Auto-count: {liveTestimonials} from Firestore
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Label text <span className="normal-case text-primary">(year auto-appended)</span>
            </label>
            <input
              type="text"
              value={config.testimonialsLabel}
              onChange={(e) => update({ testimonialsLabel: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Override value <span className="normal-case">(0 = auto from Firestore)</span>
            </label>
            <input
              type="number"
              min="0"
              value={config.testimonialsOverride}
              onChange={(e) => update({ testimonialsOverride: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* ── Stat 3: Projects This Year ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <h2 className="text-base font-bold text-dark dark:text-white">Stat 3 — Projects This Year</h2>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold">
            Auto-count: {liveProjectsThisYear} in {currentYear}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Label text <span className="normal-case text-green-500">(year auto-appended)</span>
            </label>
            <input
              type="text"
              value={config.projectsThisYearLabel}
              onChange={(e) => update({ projectsThisYearLabel: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Override value <span className="normal-case">(0 = auto from Firestore)</span>
            </label>
            <input
              type="number"
              min="0"
              value={config.projectsThisYearOverride}
              onChange={(e) => update({ projectsThisYearOverride: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* ── Stat 4: Total Projects ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h2 className="text-base font-bold text-dark dark:text-white">Stat 4 — Total Projects Completed</h2>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 font-semibold">
            Auto-count: {liveTotalProjects} total
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Label text</label>
            <input
              type="text"
              value={config.totalProjectsLabel}
              onChange={(e) => update({ totalProjectsLabel: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Override value <span className="normal-case">(0 = auto from Firestore)</span>
            </label>
            <input
              type="number"
              min="0"
              value={config.totalProjectsOverride}
              onChange={(e) => update({ totalProjectsOverride: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="bg-white dark:bg-darklight rounded-2xl border border-primary/30 shadow-xl shadow-primary/10 px-5 py-3 flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Unsaved changes</span>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition shadow-md shadow-primary/20"
            >
              {saving ? "Saving..." : "Save Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
