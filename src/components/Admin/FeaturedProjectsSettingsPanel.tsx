"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { ProjectCardItem } from "@/components/Projects/ProjectCardItem";
import type { ProjectItem } from "@/types/project";
import { adminJson } from "@/utils/adminApi";
import {
  FEATURED_GRID_CLASSES,
  FEATURED_PROJECTS_COLLECTION,
  FEATURED_PROJECTS_DEFAULTS,
  FEATURED_PROJECTS_DOC_ID,
  FEATURED_PROJECTS_LIMITS,
  normalizeFeaturedProjectsSettings,
  type FeaturedProjectsSettings,
} from "@/types/featuredProjects";

const PREVIEW_PROJECT: ProjectItem = {
  id: "featured-preview",
  title: "Southern Provincial Irrigation Department Records Management System",
  subtitle: "Full Stack Web",
  summary:
    "A production records-management platform for a provincial irrigation authority: digitised land files, approval workflows, role-based access, audit trails and bilingual reports. Built with a Next.js front end, a Node/Express API and a hardened Firestore data layer.",
  description: "",
  tags: [
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "Firebase",
    "TailwindCSS",
    "REST API",
    "JWT",
    "Docker",
    "AWS",
    "PostgreSQL",
  ],
  coverImage: "/images/portfolio/cozycasa.png",
  images: ["/images/portfolio/cozycasa.png"],
  displayOrder: 1,
  projectUrl: "https://example.com",
  createdAt: "Nov 9, 2026",
  updatedAt: "Nov 9, 2026",
};

interface StepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const Stepper: React.FC<StepperProps> = ({
  label,
  hint,
  value,
  min,
  max,
  disabled,
  onChange,
}) => {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          {label}
        </label>
        <span className="text-[10px] text-gray-400">
          {min}–{max}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - 1))}
          aria-label={`Decrease ${label}`}
          className="w-9 h-9 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darkmode text-sm font-bold text-dark dark:text-white disabled:opacity-40 hover:border-primary cursor-pointer"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-16 px-2 py-2 text-center text-sm font-bold rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
        />
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
          aria-label={`Increase ${label}`}
          className="w-9 h-9 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darkmode text-sm font-bold text-dark dark:text-white disabled:opacity-40 hover:border-primary cursor-pointer"
        >
          +
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
};

/**
 * "Featured Projects section settings" card.
 * Values are validated server-side and stored in siteContent/featured_projects_settings.
 */
export const FeaturedProjectsSettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState<FeaturedProjectsSettings>(
    FEATURED_PROJECTS_DEFAULTS
  );
  const [draft, setDraft] = useState<FeaturedProjectsSettings>(
    FEATURED_PROJECTS_DEFAULTS
  );
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, FEATURED_PROJECTS_COLLECTION, FEATURED_PROJECTS_DOC_ID),
        (snap) => {
          const next = snap.exists()
            ? normalizeFeaturedProjectsSettings(snap.data())
            : FEATURED_PROJECTS_DEFAULTS;
          setSaved(next);
          if (!dirtyRef.current) setDraft(next);
        },
        (err) => console.warn("Featured settings listener:", err.message)
      );
      return () => unsub();
    } catch (err) {
      console.warn("Featured settings subscription failed:", err);
      return undefined;
    }
  }, []);

  const update = <K extends keyof FeaturedProjectsSettings>(
    key: K,
    value: FeaturedProjectsSettings[K]
  ) => {
    dirtyRef.current = true;
    setStatus("idle");
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved]
  );

  const persist = async (values: FeaturedProjectsSettings) => {
    if (!user) {
      toast.error("Sign in as an admin first.");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      const token = await user.getIdToken();
      const result = await adminJson<{ settings: FeaturedProjectsSettings }>(
        "/api/admin/featured-settings",
        { token, body: values }
      );
      setSaved(result.settings);
      setDraft(result.settings);
      dirtyRef.current = false;
      setStatus("success");
      toast.success("Featured Projects settings saved.");
      window.setTimeout(
        () => setStatus((s) => (s === "success" ? "idle" : s)),
        2500
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save the settings.";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    await persist({ ...FEATURED_PROJECTS_DEFAULTS });
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-darklight border border-border/70 dark:border-dark_border p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-midnight_text dark:text-white">
            Featured Projects section settings
          </h3>
          <p className="text-xs text-grey dark:text-gray-400 mt-1 max-w-xl">
            Controls the public cards instantly — tags, description lines, grid
            density and the section copy.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              confirmReset
                ? "bg-red-50 border-red-300 text-red-600 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                : "border-border dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-primary"
            }`}
          >
            {confirmReset ? "Click again to confirm" : "Reset to defaults"}
          </button>
          <button
            type="button"
            onClick={() => persist(draft)}
            disabled={status === "saving" || !isDirty}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition cursor-pointer min-w-[110px]"
          >
            {status === "saving"
              ? "Saving…"
              : status === "success"
              ? "Saved ✓"
              : "Save settings"}
          </button>
        </div>
      </div>

      {status === "error" && error && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Section title
              </label>
              <input
                type="text"
                value={draft.sectionTitle}
                maxLength={FEATURED_PROJECTS_LIMITS.titleMaxLength}
                onChange={(e) => update("sectionTitle", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Section subtitle
              </label>
              <input
                type="text"
                value={draft.sectionSubtitle}
                maxLength={FEATURED_PROJECTS_LIMITS.subtitleMaxLength}
                onChange={(e) => update("sectionSubtitle", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Stepper
              label="Tags shown per card"
              hint="Extra tags collapse into a “+N” chip with a tooltip."
              value={draft.tagsShown}
              min={FEATURED_PROJECTS_LIMITS.tagsShown.min}
              max={FEATURED_PROJECTS_LIMITS.tagsShown.max}
              onChange={(v) => update("tagsShown", v)}
            />
            <Stepper
              label="Description lines"
              hint="Fixed-height cards cap the description at 3 lines."
              value={draft.descriptionLines}
              min={FEATURED_PROJECTS_LIMITS.descriptionLines.min}
              max={FEATURED_PROJECTS_LIMITS.descriptionLines.max}
              onChange={(v) => update("descriptionLines", v)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Cards per row (desktop)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update("cardsPerRow", n as 1 | 2 | 3 | 4)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      draft.cardsPerRow === n
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 dark:bg-darkmode text-gray-600 dark:text-gray-300 border-border dark:border-dark_border hover:border-primary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Applies to the /projects listing grid. The homepage marquee
                always uses two rows.
              </p>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                “Visit Site” button
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.showVisitSite}
                onClick={() => update("showVisitSite", !draft.showVisitSite)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  draft.showVisitSite
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border text-gray-500"
                }`}
              >
                <span
                  className={`w-8 h-4 rounded-full relative transition-colors ${
                    draft.showVisitSite ? "bg-emerald-500" : "bg-gray-300 dark:bg-dark_border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      draft.showVisitSite ? "left-4" : "left-0.5"
                    }`}
                  />
                </span>
                {draft.showVisitSite ? "Shown" : "Hidden"}
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Only cards with an uploaded landing page or a Live Demo URL.
              </p>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:w-[320px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Live preview
            </span>
            <span className="text-[10px] text-gray-400">
              {FEATURED_GRID_CLASSES[draft.cardsPerRow].includes("lg:grid-cols-4")
                ? "4 per row"
                : `${draft.cardsPerRow} per row`}
            </span>
          </div>
          <div className="pointer-events-none">
            <ProjectCardItem
              project={PREVIEW_PROJECT}
              tagsShown={draft.tagsShown}
              descriptionLines={draft.descriptionLines}
              showVisitSite={draft.showVisitSite}
              latest
              widthClass="w-full"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Preview is not clickable. Changes apply on the public site as soon as
            you save.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProjectsSettingsPanel;
