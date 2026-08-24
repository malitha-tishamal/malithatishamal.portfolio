"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HeroContent, defaultHeroContent } from "@/types/hero";
import { uploadToCloudinary } from "@/utils/cloudinary";
import toast from "react-hot-toast";

export const HeroSectionManager: React.FC = () => {
  const [formData, setFormData] = useState<HeroContent>(defaultHeroContent);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Upload Progress States
  const [heroImageProgress, setHeroImageProgress] = useState<number | null>(null);
  const [signatureProgress, setSignatureProgress] = useState<number | null>(null);
  const [atsCvProgress, setAtsCvProgress] = useState<number | null>(null);
  const [creativeCvProgress, setCreativeCvProgress] = useState<number | null>(null);

  // Fetch Hero content from Firestore on mount
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const docRef = doc(db, "siteContent", "hero");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData({
            ...defaultHeroContent,
            ...(docSnap.data() as HeroContent),
          });
        }
      } catch (err) {
        console.error("Error fetching hero content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  const handleChange = (field: keyof HeroContent, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generic Cloudinary Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "heroImage" | "signature" | "atsCv" | "creativeCv"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdfOrDoc = file.type.includes("pdf") || file.name.endsWith(".pdf");
    const progressSetter =
      type === "heroImage"
        ? setHeroImageProgress
        : type === "signature"
        ? setSignatureProgress
        : type === "atsCv"
        ? setAtsCvProgress
        : setCreativeCvProgress;

    progressSetter(0);
    const toastId = toast.loading(`Uploading ${file.name} to Cloudinary...`);

    try {
      const result = await uploadToCloudinary(
        file,
        (percent) => {
          progressSetter(percent);
        },
        isPdfOrDoc ? "raw" : "image"
      );

      const uploadedUrl = result.secure_url || result.url;

      if (type === "heroImage") {
        setFormData((prev) => ({ ...prev, heroImageUrl: uploadedUrl }));
      } else if (type === "signature") {
        setFormData((prev) => ({ ...prev, signatureImageUrl: uploadedUrl }));
      } else if (type === "atsCv") {
        setFormData((prev) => ({
          ...prev,
          atsCvUrl: uploadedUrl,
          atsCvFileName: file.name,
        }));
      } else if (type === "creativeCv") {
        setFormData((prev) => ({
          ...prev,
          creativeCvUrl: uploadedUrl,
          creativeCvFileName: file.name,
        }));
      }

      toast.success(`${file.name} uploaded successfully to Cloudinary!`, {
        id: toastId,
      });
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      toast.error(
        `Failed to upload ${file.name}: ${err.message || "Network error"}`,
        { id: toastId }
      );
    } finally {
      setTimeout(() => progressSetter(null), 1000);
      e.target.value = "";
    }
  };

  // Save to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving Hero section content to database...");

    try {
      const docRef = doc(db, "siteContent", "hero");
      await setDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });

      toast.success("Hero Section content updated successfully!", {
        id: toastId,
      });
    } catch (err: any) {
      console.error("Save hero content error:", err);
      toast.error(`Failed to save: ${err.message || "Unknown error"}`, {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset all Hero section fields to defaults?")) {
      setFormData(defaultHeroContent);
      toast.success("Reset to defaults. Remember to click Save Changes to persist.");
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        Loading Hero section settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white flex items-center gap-3">
            <span>Hero Section Manager</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Cloudinary Powered
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your homepage hero headlines, CV downloads (ATS & Creative), signature, and images.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-xl border border-border dark:border-dark_border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Grid: Left column (Texts & Buttons), Right column (Files & CVs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Headlines & Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Content Card */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-dark dark:text-white border-b border-border/60 dark:border-dark_border/60 pb-3">
              Headlines & Text Content
            </h2>

            {/* Badge Text */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Top Badge Text
              </label>
              <input
                type="text"
                value={formData.badgeText}
                onChange={(e) => handleChange("badgeText", e.target.value)}
                placeholder="e.g. build everything"
                className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* Main Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Main Hero Title
              </label>
              <textarea
                rows={3}
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Hero Title"
                className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* Subtitle / Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Subtitle / Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Brief introduction"
                className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* Get Started Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={formData.getStartedText}
                  onChange={(e) => handleChange("getStartedText", e.target.value)}
                  placeholder="Get Started"
                  className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Primary Button Link / Action
                </label>
                <input
                  type="text"
                  value={formData.getStartedLink}
                  onChange={(e) => handleChange("getStartedLink", e.target.value)}
                  placeholder="#contact-section"
                  className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Need Help Text */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Need Help / Contact Note Text
              </label>
              <input
                type="text"
                value={formData.needHelpText}
                onChange={(e) => handleChange("needHelpText", e.target.value)}
                placeholder="Need help? Contact Me Tell about your project"
                className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2.5 text-sm text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Column: CV Uploads & Media Management */}
        <div className="lg:col-span-5 space-y-6">
          {/* CV Uploads Card */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 dark:border-dark_border/60 pb-3">
              <h2 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
                <span>📄 CV Documents</span>
              </h2>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-darkmode px-2 py-0.5 rounded-sm">
                Cloudinary Storage
              </span>
            </div>

            {/* 1. ATS CV */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  1. ATS CV (Job Portals / Corporate)
                </p>
                {formData.atsCvUrl && (
                  <a
                    href={formData.atsCvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary underline hover:text-blue-700"
                  >
                    View File ↗
                  </a>
                )}
              </div>

              {/* Cloudinary Progress Bar */}
              {atsCvProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-blue-600 font-semibold">
                    <span>Uploading ATS CV to Cloudinary...</span>
                    <span>{atsCvProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-darkmode rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${atsCvProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload button & Direct URL */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <label className="flex-1 px-3 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold text-center transition cursor-pointer shadow-xs">
                  <span>Upload ATS CV (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, "atsCv")}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                value={formData.atsCvUrl}
                onChange={(e) => handleChange("atsCvUrl", e.target.value)}
                placeholder="Or paste Cloudinary / Direct PDF URL"
                className="w-full rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darkmode px-3 py-1.5 text-xs text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>

            {/* 2. Graphical / Creative CV */}
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  2. Graphical / Creative CV
                </p>
                {formData.creativeCvUrl && (
                  <a
                    href={formData.creativeCvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-purple-600 underline hover:text-purple-700"
                  >
                    View File ↗
                  </a>
                )}
              </div>

              {/* Cloudinary Progress Bar */}
              {creativeCvProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-purple-600 font-semibold">
                    <span>Uploading Creative CV to Cloudinary...</span>
                    <span>{creativeCvProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-darkmode rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${creativeCvProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload button & Direct URL */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <label className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold text-center transition cursor-pointer shadow-xs">
                  <span>Upload Creative CV (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, "creativeCv")}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                value={formData.creativeCvUrl}
                onChange={(e) => handleChange("creativeCvUrl", e.target.value)}
                placeholder="Or paste Cloudinary / Direct PDF URL"
                className="w-full rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darkmode px-3 py-1.5 text-xs text-dark dark:text-white focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Media Images Card (Hero Image & Signature) */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-dark dark:text-white border-b border-border/60 dark:border-dark_border/60 pb-3">
              Hero & Signature Images
            </h2>

            {/* Signature Image */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Signature Image (Replaces 3 thumbnails)
              </label>

              {/* Signature Preview */}
              <div className="p-3 bg-gray-100 dark:bg-darkmode rounded-xl flex items-center justify-between gap-3">
                <div className="h-10 w-32 relative flex items-center justify-center">
                  <Image
                    src={formData.signatureImageUrl || "/images/hero/signature.png"}
                    alt="Signature"
                    width={140}
                    height={40}
                    unoptimized
                    className="h-8 w-auto object-contain dark:invert"
                  />
                </div>
                <label className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-dark dark:text-white rounded-lg text-xs font-semibold transition cursor-pointer">
                  <span>Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "signature")}
                    className="hidden"
                  />
                </label>
              </div>

              {signatureProgress !== null && (
                <div className="w-full bg-gray-200 dark:bg-darkmode rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${signatureProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Hero Main Photo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Hero Main Photo
              </label>

              <div className="p-3 bg-gray-100 dark:bg-darkmode rounded-xl flex items-center justify-between gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden relative border border-border dark:border-dark_border">
                  <Image
                    src={formData.heroImageUrl || "/images/hero/malitha-hero.png"}
                    alt="Hero Photo"
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-dark dark:text-white rounded-lg text-xs font-semibold transition cursor-pointer">
                  <span>Upload Main Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "heroImage")}
                    className="hidden"
                  />
                </label>
              </div>

              {heroImageProgress !== null && (
                <div className="w-full bg-gray-200 dark:bg-darkmode rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${heroImageProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
