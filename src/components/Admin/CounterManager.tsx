"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { collection, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db, getFirebaseAuth } from "@/lib/firebase";
import toast from "react-hot-toast";

export type StatMode = "auto" | "manual";

export interface CounterConfig {
  ratingMode: "site" | "google";
  googleRating: number;
  googleReviewCount: number;
  googleReviewUrl: string;

  testimonialsMode: StatMode;
  testimonialsManualValue: number;
  testimonialsLabel: string;

  projectsThisYearMode: StatMode;
  projectsThisYearManualValue: number;
  projectsThisYearLabel: string;

  totalProjectsMode: StatMode;
  totalProjectsManualValue: number;
  totalProjectsLabel: string;

  visitorsMode: StatMode;
  visitorsManualValue: number;
  visitorsLabel: string;

  // Legacy fields preserved for backward compatibility
  testimonialsOverride?: number;
  projectsThisYearOverride?: number;
  totalProjectsOverride?: number;
  visitorsOverride?: number;

  lastEditedBy?: string;
  lastEditedEmail?: string;
  lastEditedAt?: string;
}

const defaultConfig: CounterConfig = {
  ratingMode: "site",
  googleRating: 4.9,
  googleReviewCount: 0,
  googleReviewUrl: "",

  testimonialsMode: "auto",
  testimonialsManualValue: 0,
  testimonialsLabel: "Total Client testimonials",

  projectsThisYearMode: "auto",
  projectsThisYearManualValue: 0,
  projectsThisYearLabel: "Projects completed in",

  totalProjectsMode: "auto",
  totalProjectsManualValue: 0,
  totalProjectsLabel: "Total projects completed",

  visitorsMode: "auto",
  visitorsManualValue: 0,
  visitorsLabel: "Total website visitors",

  testimonialsOverride: 0,
  projectsThisYearOverride: 0,
  totalProjectsOverride: 0,
  visitorsOverride: 0,
};

/**
 * Migrates old override data to the explicit mode/manualValue model.
 * If old override value > 0 and mode is missing, sets mode = 'manual' and manualValue = override.
 */
function migrateCounterConfig(raw: any): CounterConfig {
  if (!raw) return { ...defaultConfig };

  const testimonialsMode: StatMode =
    raw.testimonialsMode || (Number(raw.testimonialsOverride) > 0 ? "manual" : "auto");
  const testimonialsManualValue =
    typeof raw.testimonialsManualValue === "number"
      ? raw.testimonialsManualValue
      : Number(raw.testimonialsOverride) || 0;

  const projectsThisYearMode: StatMode =
    raw.projectsThisYearMode || (Number(raw.projectsThisYearOverride) > 0 ? "manual" : "auto");
  const projectsThisYearManualValue =
    typeof raw.projectsThisYearManualValue === "number"
      ? raw.projectsThisYearManualValue
      : Number(raw.projectsThisYearOverride) || 0;

  const totalProjectsMode: StatMode =
    raw.totalProjectsMode || (Number(raw.totalProjectsOverride) > 0 ? "manual" : "auto");
  const totalProjectsManualValue =
    typeof raw.totalProjectsManualValue === "number"
      ? raw.totalProjectsManualValue
      : Number(raw.totalProjectsOverride) || 0;

  const visitorsMode: StatMode =
    raw.visitorsMode || (Number(raw.visitorsOverride) > 0 ? "manual" : "auto");
  const visitorsManualValue =
    typeof raw.visitorsManualValue === "number"
      ? raw.visitorsManualValue
      : Number(raw.visitorsOverride) || 0;

  return {
    ...defaultConfig,
    ...raw,
    testimonialsMode,
    testimonialsManualValue,
    testimonialsLabel: raw.testimonialsLabel || defaultConfig.testimonialsLabel,

    projectsThisYearMode,
    projectsThisYearManualValue,
    projectsThisYearLabel: raw.projectsThisYearLabel || defaultConfig.projectsThisYearLabel,

    totalProjectsMode,
    totalProjectsManualValue,
    totalProjectsLabel: raw.totalProjectsLabel || defaultConfig.totalProjectsLabel,

    visitorsMode,
    visitorsManualValue,
    visitorsLabel: raw.visitorsLabel || defaultConfig.visitorsLabel,

    // Keep legacy overrides synced for backward compatibility
    testimonialsOverride: testimonialsMode === "manual" ? testimonialsManualValue : 0,
    projectsThisYearOverride:
      projectsThisYearMode === "manual" ? projectsThisYearManualValue : 0,
    totalProjectsOverride: totalProjectsMode === "manual" ? totalProjectsManualValue : 0,
    visitorsOverride: visitorsMode === "manual" ? visitorsManualValue : 0,
  };
}

export function CounterManager() {
  const [config, setConfig] = useState<CounterConfig>(defaultConfig);
  const [savedConfig, setSavedConfig] = useState<CounterConfig>(defaultConfig);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Live counts from Firestore
  const [liveTestimonials, setLiveTestimonials] = useState(0);
  const [liveAvgRating, setLiveAvgRating] = useState(0);
  const [liveProjectsThisYear, setLiveProjectsThisYear] = useState(0);
  const [liveTotalProjects, setLiveTotalProjects] = useState(0);
  const [liveVisitors, setLiveVisitors] = useState(0);

  const currentYear = new Date().getFullYear();
  const isInitialLoadRef = useRef(true);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Load config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "counter"), (snap) => {
      if (snap.exists()) {
        const migrated = migrateCounterConfig(snap.data());
        if (isInitialLoadRef.current) {
          setConfig(migrated);
          setSavedConfig(migrated);
          isInitialLoadRef.current = false;
        }
      }
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

  // Live visitor count
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "visitorCounter"), (snap) => {
      if (snap.exists()) {
        setLiveVisitors(snap.data()?.totalVisitors || 0);
      }
    });
    return () => unsub();
  }, []);

  const validate = useCallback((cfg: CounterConfig): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (cfg.testimonialsLabel.length > 60) errs.testimonialsLabel = "Label cannot exceed 60 characters";
    if (cfg.projectsThisYearLabel.length > 60) errs.projectsThisYearLabel = "Label cannot exceed 60 characters";
    if (cfg.totalProjectsLabel.length > 60) errs.totalProjectsLabel = "Label cannot exceed 60 characters";
    if (cfg.visitorsLabel.length > 60) errs.visitorsLabel = "Label cannot exceed 60 characters";

    if (cfg.testimonialsMode === "manual") {
      if (cfg.testimonialsManualValue < 0 || cfg.testimonialsManualValue > 9999999) {
        errs.testimonialsManualValue = "Value must be between 0 and 9,999,999";
      }
    }
    if (cfg.projectsThisYearMode === "manual") {
      if (cfg.projectsThisYearManualValue < 0 || cfg.projectsThisYearManualValue > 9999999) {
        errs.projectsThisYearManualValue = "Value must be between 0 and 9,999,999";
      }
    }
    if (cfg.totalProjectsMode === "manual") {
      if (cfg.totalProjectsManualValue < 0 || cfg.totalProjectsManualValue > 9999999) {
        errs.totalProjectsManualValue = "Value must be between 0 and 9,999,999";
      }
    }
    if (cfg.visitorsMode === "manual") {
      if (cfg.visitorsManualValue < 0 || cfg.visitorsManualValue > 9999999) {
        errs.visitorsManualValue = "Value must be between 0 and 9,999,999";
      }
    }

    return errs;
  }, []);

  const update = (patch: Partial<CounterConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      // Keep legacy overrides synced
      if ("testimonialsMode" in patch || "testimonialsManualValue" in patch) {
        next.testimonialsOverride =
          next.testimonialsMode === "manual" ? next.testimonialsManualValue : 0;
      }
      if ("projectsThisYearMode" in patch || "projectsThisYearManualValue" in patch) {
        next.projectsThisYearOverride =
          next.projectsThisYearMode === "manual" ? next.projectsThisYearManualValue : 0;
      }
      if ("totalProjectsMode" in patch || "totalProjectsManualValue" in patch) {
        next.totalProjectsOverride =
          next.totalProjectsMode === "manual" ? next.totalProjectsManualValue : 0;
      }
      if ("visitorsMode" in patch || "visitorsManualValue" in patch) {
        next.visitorsOverride = next.visitorsMode === "manual" ? next.visitorsManualValue : 0;
      }

      setValidationErrors(validate(next));
      return next;
    });
    setDirty(true);
  };

  const handleDiscard = () => {
    if (confirm("Discard all unsaved changes and revert to the last saved configuration?")) {
      setConfig({ ...savedConfig });
      setValidationErrors({});
      setDirty(false);
      toast.success("Changes discarded.");
    }
  };

  const save = async () => {
    const errs = validate(config);
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    setSaving(true);
    try {
      let savedViaApi = false;
      const authInstance = await getFirebaseAuth();
      const currentUser = authInstance.currentUser;

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const res = await fetch("/api/admin/counter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(config),
          });

          if (res.ok) {
            savedViaApi = true;
          } else {
            const errData = await res.json().catch(() => ({}));
            console.warn("API route save fallback:", errData.error);
          }
        } catch (apiErr) {
          console.warn("API save error, attempting direct Firestore save:", apiErr);
        }
      }

      // If API didn't handle it, fallback to direct client Firestore write
      if (!savedViaApi) {
        const now = new Date().toISOString();
        const payload = {
          ...config,
          testimonialsOverride:
            config.testimonialsMode === "manual" ? config.testimonialsManualValue : 0,
          projectsThisYearOverride:
            config.projectsThisYearMode === "manual" ? config.projectsThisYearManualValue : 0,
          totalProjectsOverride:
            config.totalProjectsMode === "manual" ? config.totalProjectsManualValue : 0,
          visitorsOverride: config.visitorsMode === "manual" ? config.visitorsManualValue : 0,
          lastEditedBy: currentUser?.email?.split("@")[0] || "Admin",
          lastEditedEmail: currentUser?.email || "admin",
          lastEditedAt: now,
          updatedAt: now,
        };

        await setDoc(doc(db, "siteContent", "counter"), payload, { merge: true });

        // Trigger on-demand ISR revalidation
        try {
          await fetch("/api/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag: "site", path: "/" }),
          });
        } catch (e) {
          console.warn("Revalidate error:", e);
        }
      }

      setSavedConfig({ ...config });
      setDirty(false);
      toast.success("Stats configuration saved successfully!");
    } catch (e: any) {
      console.error("Save counter failed:", e);
      toast.error(e.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Display values on site
  const displayRating = config.ratingMode === "google" ? config.googleRating : liveAvgRating;
  const displayTestimonials =
    config.testimonialsMode === "manual" ? config.testimonialsManualValue : liveTestimonials;
  const displayThisYear =
    config.projectsThisYearMode === "manual" ? config.projectsThisYearManualValue : liveProjectsThisYear;
  const displayTotal =
    config.totalProjectsMode === "manual" ? config.totalProjectsManualValue : liveTotalProjects;
  const displayVisitors =
    config.visitorsMode === "manual" ? config.visitorsManualValue : liveVisitors;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Stats &amp; Counter Section</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure the 5 stats shown below your hero section with explicit Auto or Manual controls
          </p>
          {config.lastEditedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Last saved by <span className="font-semibold text-primary">{config.lastEditedBy || "Admin"}</span> on{" "}
              {new Date(config.lastEditedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {dirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark_border text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
            >
              Discard Changes
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || Object.keys(validationErrors).length > 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-primary/20 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview On Site Mini Card */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Preview on Site (Live Result)
          </p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            Revalidates on save
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            {
              icon: "⭐",
              value: displayRating > 0 ? displayRating.toFixed(1) : "—",
              label:
                config.ratingMode === "google"
                  ? `Out of 5 · Google${config.googleReviewCount > 0 ? ` (${config.googleReviewCount.toLocaleString()})` : ""}`
                  : "Out of 5 · Site reviews avg",
              color: "text-amber-500",
              badge: config.ratingMode === "google" ? "Manual" : "Auto",
            },
            {
              icon: "👥",
              value: `${displayTestimonials.toLocaleString()}+`,
              label: `${config.testimonialsLabel} ${currentYear}`,
              color: "text-primary",
              badge: config.testimonialsMode === "manual" ? "Manual" : "Auto",
            },
            {
              icon: "✅",
              value: `${displayThisYear.toLocaleString()}+`,
              label: `${config.projectsThisYearLabel} ${currentYear}`,
              color: "text-green-500",
              badge: config.projectsThisYearMode === "manual" ? "Manual" : "Auto",
            },
            {
              icon: "🏆",
              value: `${displayTotal.toLocaleString()}+`,
              label: config.totalProjectsLabel,
              color: "text-violet-500",
              badge: config.totalProjectsMode === "manual" ? "Manual" : "Auto",
            },
            {
              icon: "👁️",
              value: `${displayVisitors.toLocaleString()}+`,
              label: config.visitorsLabel,
              color: "text-indigo-500",
              badge: config.visitorsMode === "manual" ? "Manual" : "Auto",
            },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-gray-50/70 dark:bg-darkmode/50 border border-border/40 dark:border-dark_border/40">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  s.badge === "Manual"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                }`}>
                  {s.badge}
                </span>
              </div>
              <span className={`text-2xl sm:text-3xl font-extrabold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat 1: Rating ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white">Stat 1 — Rating</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose site rating calculation or manual Google review score</p>
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-darkmode p-1 border border-border dark:border-dark_border" role="radiogroup" aria-label="Rating mode">
            <button
              type="button"
              role="radio"
              aria-checked={config.ratingMode === "site"}
              onClick={() => update({ ratingMode: "site" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.ratingMode === "site"
                  ? "bg-white dark:bg-darklight text-primary shadow-xs ring-1 ring-border/50"
                  : "text-gray-500 hover:text-dark dark:hover:text-white"
              }`}
            >
              Auto (Site Reviews)
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={config.ratingMode === "google"}
              onClick={() => update({ ratingMode: "google" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.ratingMode === "google"
                  ? "bg-primary text-white shadow-xs"
                  : "text-gray-500 hover:text-dark dark:hover:text-white"
              }`}
            >
              Manual (Google Reviews)
            </button>
          </div>
        </div>

        {config.ratingMode === "site" ? (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-darkmode border border-border/50 dark:border-dark_border/50 flex items-center justify-between">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Auto-calculated from all approved testimonials: <span className="font-bold text-amber-500">{liveAvgRating.toFixed(1)} / 5</span> ({liveTestimonials} reviews)
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
              Active on website
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Google Rating (0 – 5.0)
                </label>
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
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Review Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.googleReviewCount}
                  onChange={(e) => update({ googleReviewCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Google Review URL
                </label>
                <input
                  type="url"
                  value={config.googleReviewUrl}
                  onChange={(e) => update({ googleReviewUrl: e.target.value })}
                  placeholder="https://g.page/r/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Manual Google review score will be displayed on the website instead of the site review average.
            </p>
          </div>
        )}
      </div>

      {/* ── Stat 2: Testimonials ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white">Stat 2 — Client Testimonials</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track client recommendations or set a custom count</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              {config.testimonialsMode === "auto" ? `Auto-count: ${liveTestimonials} from Firestore` : `Auto: ${liveTestimonials}`}
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-darkmode p-1 border border-border dark:border-dark_border" role="radiogroup" aria-label="Testimonials mode">
              <button
                type="button"
                role="radio"
                aria-checked={config.testimonialsMode === "auto"}
                onClick={() => update({ testimonialsMode: "auto" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.testimonialsMode === "auto"
                    ? "bg-white dark:bg-darklight text-primary shadow-xs ring-1 ring-border/50"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={config.testimonialsMode === "manual"}
                onClick={() => update({ testimonialsMode: "manual" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.testimonialsMode === "manual"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Label text <span className="normal-case text-primary font-normal">(year auto-appended)</span>
              </label>
              <span className={`text-[11px] ${config.testimonialsLabel.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {config.testimonialsLabel.length}/60
              </span>
            </div>
            <input
              type="text"
              maxLength={70}
              value={config.testimonialsLabel}
              onChange={(e) => update({ testimonialsLabel: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                validationErrors.testimonialsLabel
                  ? "border-red-500 focus:ring-red-400/30"
                  : "border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {validationErrors.testimonialsLabel && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.testimonialsLabel}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {config.testimonialsMode === "auto" ? "Live Value (Auto)" : "Manual Value (Integer >= 0)"}
              </label>
              {config.testimonialsMode === "manual" && (
                <span className="text-[11px] text-gray-400 font-mono">
                  Preview: {config.testimonialsManualValue.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max="9999999"
              step="1"
              inputMode="numeric"
              readOnly={config.testimonialsMode === "auto"}
              value={config.testimonialsMode === "auto" ? liveTestimonials : config.testimonialsManualValue}
              onChange={(e) => update({ testimonialsManualValue: Math.max(0, parseInt(e.target.value) || 0) })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                config.testimonialsMode === "auto"
                  ? "bg-gray-100/80 dark:bg-darkmode/60 border-dashed border-gray-300 dark:border-dark_border text-gray-500 cursor-not-allowed"
                  : validationErrors.testimonialsManualValue
                    ? "bg-gray-50 dark:bg-darkmode border-red-500 focus:ring-red-400/30"
                    : "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {config.testimonialsMode === "manual" ? (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Manual value is shown on the website instead of the live count.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Live count is calculated automatically from approved testimonials in Firestore.
              </p>
            )}
            {validationErrors.testimonialsManualValue && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.testimonialsManualValue}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat 3: Projects This Year ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white">Stat 3 — Projects This Year</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Show projects delivered in current year {currentYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-semibold">
              {config.projectsThisYearMode === "auto" ? `Auto-count: ${liveProjectsThisYear} in ${currentYear}` : `Auto: ${liveProjectsThisYear}`}
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-darkmode p-1 border border-border dark:border-dark_border" role="radiogroup" aria-label="Projects this year mode">
              <button
                type="button"
                role="radio"
                aria-checked={config.projectsThisYearMode === "auto"}
                onClick={() => update({ projectsThisYearMode: "auto" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.projectsThisYearMode === "auto"
                    ? "bg-white dark:bg-darklight text-primary shadow-xs ring-1 ring-border/50"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={config.projectsThisYearMode === "manual"}
                onClick={() => update({ projectsThisYearMode: "manual" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.projectsThisYearMode === "manual"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Label text <span className="normal-case text-green-500 font-normal">(year auto-appended)</span>
              </label>
              <span className={`text-[11px] ${config.projectsThisYearLabel.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {config.projectsThisYearLabel.length}/60
              </span>
            </div>
            <input
              type="text"
              maxLength={70}
              value={config.projectsThisYearLabel}
              onChange={(e) => update({ projectsThisYearLabel: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                validationErrors.projectsThisYearLabel
                  ? "border-red-500 focus:ring-red-400/30"
                  : "border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {validationErrors.projectsThisYearLabel && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.projectsThisYearLabel}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {config.projectsThisYearMode === "auto" ? "Live Value (Auto)" : "Manual Value (Integer >= 0)"}
              </label>
              {config.projectsThisYearMode === "manual" && (
                <span className="text-[11px] text-gray-400 font-mono">
                  Preview: {config.projectsThisYearManualValue.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max="9999999"
              step="1"
              inputMode="numeric"
              readOnly={config.projectsThisYearMode === "auto"}
              value={config.projectsThisYearMode === "auto" ? liveProjectsThisYear : config.projectsThisYearManualValue}
              onChange={(e) => update({ projectsThisYearManualValue: Math.max(0, parseInt(e.target.value) || 0) })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                config.projectsThisYearMode === "auto"
                  ? "bg-gray-100/80 dark:bg-darkmode/60 border-dashed border-gray-300 dark:border-dark_border text-gray-500 cursor-not-allowed"
                  : validationErrors.projectsThisYearManualValue
                    ? "bg-gray-50 dark:bg-darkmode border-red-500 focus:ring-red-400/30"
                    : "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {config.projectsThisYearMode === "manual" ? (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Manual value is shown on the website instead of the live count.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Live count is calculated automatically from projects created in {currentYear}.
              </p>
            )}
            {validationErrors.projectsThisYearManualValue && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.projectsThisYearManualValue}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat 4: Total Projects ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white">Stat 4 — Total Projects Completed</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total project tally across your career</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 font-semibold">
              {config.totalProjectsMode === "auto" ? `Auto-count: ${liveTotalProjects} total` : `Auto: ${liveTotalProjects}`}
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-darkmode p-1 border border-border dark:border-dark_border" role="radiogroup" aria-label="Total projects mode">
              <button
                type="button"
                role="radio"
                aria-checked={config.totalProjectsMode === "auto"}
                onClick={() => update({ totalProjectsMode: "auto" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.totalProjectsMode === "auto"
                    ? "bg-white dark:bg-darklight text-primary shadow-xs ring-1 ring-border/50"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={config.totalProjectsMode === "manual"}
                onClick={() => update({ totalProjectsMode: "manual" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.totalProjectsMode === "manual"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Label text
              </label>
              <span className={`text-[11px] ${config.totalProjectsLabel.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {config.totalProjectsLabel.length}/60
              </span>
            </div>
            <input
              type="text"
              maxLength={70}
              value={config.totalProjectsLabel}
              onChange={(e) => update({ totalProjectsLabel: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                validationErrors.totalProjectsLabel
                  ? "border-red-500 focus:ring-red-400/30"
                  : "border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {validationErrors.totalProjectsLabel && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.totalProjectsLabel}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {config.totalProjectsMode === "auto" ? "Live Value (Auto)" : "Manual Value (Integer >= 0)"}
              </label>
              {config.totalProjectsMode === "manual" && (
                <span className="text-[11px] text-gray-400 font-mono">
                  Preview: {config.totalProjectsManualValue.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max="9999999"
              step="1"
              inputMode="numeric"
              readOnly={config.totalProjectsMode === "auto"}
              value={config.totalProjectsMode === "auto" ? liveTotalProjects : config.totalProjectsManualValue}
              onChange={(e) => update({ totalProjectsManualValue: Math.max(0, parseInt(e.target.value) || 0) })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                config.totalProjectsMode === "auto"
                  ? "bg-gray-100/80 dark:bg-darkmode/60 border-dashed border-gray-300 dark:border-dark_border text-gray-500 cursor-not-allowed"
                  : validationErrors.totalProjectsManualValue
                    ? "bg-gray-50 dark:bg-darkmode border-red-500 focus:ring-red-400/30"
                    : "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {config.totalProjectsMode === "manual" ? (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Manual value is shown on the website instead of the live count.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Live count is calculated automatically from total projects in Firestore.
              </p>
            )}
            {validationErrors.totalProjectsManualValue && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.totalProjectsManualValue}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat 5: Website Visitors ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👁️</span>
            <div>
              <h2 className="text-base font-bold text-dark dark:text-white">Stat 5 — Website Visitors</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total verified visitor sessions tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold">
              {config.visitorsMode === "auto" ? `Auto-count: ${liveVisitors.toLocaleString()} total` : `Auto: ${liveVisitors.toLocaleString()}`}
            </span>
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-darkmode p-1 border border-border dark:border-dark_border" role="radiogroup" aria-label="Website visitors mode">
              <button
                type="button"
                role="radio"
                aria-checked={config.visitorsMode === "auto"}
                onClick={() => update({ visitorsMode: "auto" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.visitorsMode === "auto"
                    ? "bg-white dark:bg-darklight text-primary shadow-xs ring-1 ring-border/50"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={config.visitorsMode === "manual"}
                onClick={() => update({ visitorsMode: "manual" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  config.visitorsMode === "manual"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Label text
              </label>
              <span className={`text-[11px] ${config.visitorsLabel.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                {config.visitorsLabel.length}/60
              </span>
            </div>
            <input
              type="text"
              maxLength={70}
              value={config.visitorsLabel}
              onChange={(e) => update({ visitorsLabel: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                validationErrors.visitorsLabel
                  ? "border-red-500 focus:ring-red-400/30"
                  : "border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {validationErrors.visitorsLabel && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.visitorsLabel}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {config.visitorsMode === "auto" ? "Live Value (Auto)" : "Manual Value (Integer >= 0)"}
              </label>
              {config.visitorsMode === "manual" && (
                <span className="text-[11px] text-gray-400 font-mono">
                  Preview: {config.visitorsManualValue.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              max="9999999"
              step="1"
              inputMode="numeric"
              readOnly={config.visitorsMode === "auto"}
              value={config.visitorsMode === "auto" ? liveVisitors : config.visitorsManualValue}
              onChange={(e) => update({ visitorsManualValue: Math.max(0, parseInt(e.target.value) || 0) })}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-dark dark:text-white focus:outline-none focus:ring-2 ${
                config.visitorsMode === "auto"
                  ? "bg-gray-100/80 dark:bg-darkmode/60 border-dashed border-gray-300 dark:border-dark_border text-gray-500 cursor-not-allowed"
                  : validationErrors.visitorsManualValue
                    ? "bg-gray-50 dark:bg-darkmode border-red-500 focus:ring-red-400/30"
                    : "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border focus:ring-primary/30"
              }`}
            />
            {config.visitorsMode === "manual" ? (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Manual value is shown on the website instead of the live count.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Live count is tracked automatically from unique visitor sessions.
              </p>
            )}
            {validationErrors.visitorsManualValue && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.visitorsManualValue}</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Save bar when dirty */}
      {dirty && (
        <div className="sticky bottom-4 z-30 flex justify-end">
          <div className="bg-white dark:bg-darklight rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 px-5 py-3 flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Unsaved changes
            </span>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-dark_border text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || Object.keys(validationErrors).length > 0}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition shadow-md shadow-primary/20 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
