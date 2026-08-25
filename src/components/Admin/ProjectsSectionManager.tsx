"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ProjectItem,
  ProjectImageFit,
  defaultProjects,
  PROJECT_CATEGORIES,
} from "@/types/project";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { ProjectCardItem } from "@/components/Projects/ProjectCardItem";
import { ProjectDetailModal } from "@/components/Projects/ProjectDetailModal";
import { getImgPath } from "@/utils/image";
import toast from "react-hot-toast";

export const ProjectsSectionManager: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Preview Modal state
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("Mobile App");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFit, setImageFit] = useState<ProjectImageFit>("cover");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [galleryProgress, setGalleryProgress] = useState<{ [key: number]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "projects"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: ProjectItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as ProjectItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setProjects(fetched);
          } else {
            setProjects(defaultProjects);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore projects listener notice:", error.message);
          setProjects(defaultProjects);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up projects listener:", err);
      setProjects(defaultProjects);
      setLoading(false);
    }
  }, []);

  // Format date helper
  const formatDate = (val: any): string => {
    if (!val) return "Recently";
    if (typeof val === "string") return val;
    if (val?.toDate) {
      return val.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return "Recently";
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("Mobile App");
    setSummary("");
    setDescription("");
    setTagsInput("");
    setCoverImage("");
    setImages([""]);
    setImageFit("cover");
    setProjectUrl("");
    setGithubUrl("");
    setLinkedinUrl("");
    setFacebookUrl("");
    setInstagramUrl("");
    setYoutubeUrl("");
    setDisplayOrder(
      projects.length > 0
        ? Math.max(...projects.map((p) => p.displayOrder || 0)) + 1
        : 1
    );
    setCoverProgress(null);
    setGalleryProgress({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: ProjectItem) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "Mobile App");
    setSummary(item.summary || "");
    setDescription(item.description || "");
    setTagsInput(item.tags ? item.tags.join(", ") : "");
    setCoverImage(item.coverImage || "");
    setImages(item.images && item.images.length > 0 ? item.images : [""]);
    setImageFit(item.imageFit || "cover");
    setProjectUrl(item.projectUrl || "");
    setGithubUrl(item.githubUrl || "");
    setLinkedinUrl(item.linkedinUrl || "");
    setFacebookUrl(item.facebookUrl || "");
    setInstagramUrl(item.instagramUrl || "");
    setYoutubeUrl(item.youtubeUrl || "");
    setDisplayOrder(item.displayOrder || 1);
    setCoverProgress(null);
    setGalleryProgress({});
    setIsModalOpen(true);
  };

  // Upload Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCoverProgress(10);
    const toastId = toast.loading("Uploading cover image to Cloudinary...");

    try {
      const res = await uploadToCloudinary(file, (percent) => {
        setCoverProgress(percent);
      });

      if (res.secure_url) {
        setCoverImage(res.secure_url);
        toast.success("Cover image uploaded!", { id: toastId });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      console.error("Cover upload error:", err);
      toast.error(err.message || "Failed to upload cover image.", { id: toastId });
    } finally {
      setIsUploading(false);
      setTimeout(() => setCoverProgress(null), 1000);
    }
  };

  // Upload Gallery Image (Slot)
  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGalleryProgress((prev) => ({ ...prev, [slotIndex]: 10 }));

    try {
      const res = await uploadToCloudinary(file, (progress: number) => {
        setGalleryProgress((prev) => ({ ...prev, [slotIndex]: progress }));
      });

      if (res.secure_url) {
        setImages((prev) => {
          const next = [...prev];
          next[slotIndex] = res.secure_url;
          return next;
        });
        toast.success(`Screenshot ${slotIndex + 1} uploaded!`);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      console.error("Gallery upload error:", err);
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setGalleryProgress((prev) => {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        });
      }, 1500);
    }
  };

  // Add a new gallery image slot (Supports up to 20 images!)
  const handleAddGallerySlot = () => {
    if (images.length >= 20) {
      toast.error("Maximum 20 screenshot slots allowed per project.");
      return;
    }
    setImages((prev) => [...prev, ""]);
  };

  // Remove gallery slot
  const handleRemoveGallerySlot = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Move gallery image up/down
  const handleMoveGallerySlot = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Save Project (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Project title is required.");
      return;
    }

    setSaving(true);
    const id = editingId || `project_${Date.now()}`;
    const cleanTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const validGallery = images.filter((img) => img && img.trim().length > 0);

    const nowFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const itemData: ProjectItem = {
      id,
      title: title.trim(),
      subtitle: subtitle.trim() || "Mobile App",
      summary: summary.trim(),
      description: description.trim(),
      tags: cleanTags,
      coverImage: coverImage.trim() || validGallery[0] || "/images/portfolio/cozycasa.png",
      images: validGallery.length > 0 ? validGallery : [coverImage.trim() || "/images/portfolio/cozycasa.png"],
      imageFit,
      projectUrl: projectUrl.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      displayOrder: Number(displayOrder) || 1,
      createdAt: editingId
        ? projects.find((p) => p.id === editingId)?.createdAt || nowFormatted
        : nowFormatted,
      updatedAt: nowFormatted,
    };

    try {
      await setDoc(doc(db, "projects", id), itemData);
      toast.success(
        editingId ? "Project updated successfully!" : "New project created successfully!"
      );
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save project error:", err);
      toast.error(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Project
  const handleDelete = async (item: ProjectItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "projects", item.id));
      toast.success(`"${item.title}" deleted.`);
    } catch (err: any) {
      console.error("Delete project error:", err);
      toast.error(err.message || "Failed to delete project.");
    }
  };

  // Quick Reorder (Move Up / Down)
  const handleQuickReorder = async (
    item: ProjectItem,
    direction: "up" | "down"
  ) => {
    const currentIndex = projects.findIndex((p) => p.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const targetItem = projects[targetIndex];
    const currentOrder = item.displayOrder || currentIndex + 1;
    const targetOrder = targetItem.displayOrder || targetIndex + 1;

    try {
      await setDoc(doc(db, "projects", item.id), {
        ...item,
        displayOrder: targetOrder,
      });
      await setDoc(doc(db, "projects", targetItem.id), {
        ...targetItem,
        displayOrder: currentOrder,
      });
      toast.success("Display order updated!");
    } catch (err: any) {
      toast.error("Failed to update order.");
    }
  };

  // Seed Defaults
  const handleSeedDefaults = async () => {
    if (
      !confirm(
        "This will upload 6 default engineering projects (MediQ, IoT, Cloud CI/CD, etc.) to Firestore. Continue?"
      )
    )
      return;

    try {
      for (const def of defaultProjects) {
        await setDoc(doc(db, "projects", def.id), def);
      }
      toast.success("Default projects saved to database!");
    } catch (err: any) {
      toast.error("Failed to seed default projects.");
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-xs">
            <span>Projects &amp; Engineering Systems</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Projects Section Manager
          </h2>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Customise project titles, categories, detailed paragraphs, 10–15+ screenshot galleries with Cloudinary, Live Project links, and social repositories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
          >
            Seed 6 Defaults
          </button>
          <button
            onClick={handleOpenCreate}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border/50 dark:border-dark_border/50 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by project title, category, stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing <span className="font-bold text-dark dark:text-white">{filteredProjects.length}</span> of {projects.length} projects
        </div>
      </div>

      {/* Projects Display Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8">
          <p className="text-base font-semibold text-dark dark:text-white">No projects found</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Click "Add New Project" or "Seed 6 Defaults" to populate.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white dark:bg-darklight rounded-3xl border border-border/50 dark:border-dark_border/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Order & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      #{item.displayOrder || idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50">
                      {item.subtitle || "Mobile App"}
                    </span>
                  </div>

                  {/* Move Up / Down */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleQuickReorder(item, "up")}
                      className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-darkmode disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredProjects.length - 1}
                      onClick={() => handleQuickReorder(item, "down")}
                      className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-darkmode disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Card Preview (Clicking opens details!) */}
                <div className="mb-4">
                  <ProjectCardItem
                    project={item}
                    onClick={() => setPreviewProject(item)}
                  />
                </div>
              </div>

              {/* Footer: Dates & Actions */}
              <div className="mt-4 pt-3 border-t border-border/40 dark:border-dark_border/40">
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                  <span>Updated: {formatDate(item.updatedAt)}</span>
                  <span>Images: {(item.images?.length || 0) + (item.coverImage ? 1 : 0)}</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewProject(item)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-primary dark:text-blue-400 transition cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-darkmode dark:hover:bg-dark_border text-dark dark:text-white transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL PREVIEW */}
      <ProjectDetailModal
        project={previewProject}
        onClose={() => setPreviewProject(null)}
      />

      {/* CREATE / EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border dark:border-dark_border shadow-2xl my-8 text-midnight_text dark:text-white max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-midnight_text dark:text-white mb-1">
              {editingId ? "Edit Engineering Project" : "Add New Project"}
            </h3>
            <p className="text-xs text-grey dark:text-gray-400 mb-6">
              Configure project title, category, detailed paragraph, 10–15+ screenshot gallery, and live repository links.
            </p>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MediQ – Antibiotic Steward"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Category Tag / Filter *
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Mobile App / Full Stack Web..."
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                    {/* Quick Category Chips */}
                    <div className="flex flex-wrap gap-1">
                      {PROJECT_CATEGORIES.filter((c) => c !== "All Projects").map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSubtitle(cat)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            subtitle === cat
                              ? "bg-primary text-white"
                              : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Short Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Short Card Summary (1-2 sentences)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cross-platform antimicrobial stewardship & dose calculation app."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Row 3: Full Detailed Paragraph / Architecture */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Full Project Description (Detailed Paragraph / Architecture)
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain the background, core features, architecture design, impact, and technology implementation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary leading-relaxed"
                />
              </div>

              {/* Row 4: Tech Stack Tags & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Technologies / Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Flutter, Dart, Firebase, Docker, Kubernetes"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Row 5: Main Cover Image */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Main Card Cover Image *
                </label>
                <div className="flex items-center gap-3">
                  {coverImage ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 border border-border shrink-0">
                      <Image
                        src={getImgPath(coverImage)}
                        alt="Cover Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-darklight border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                      Empty
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition">
                        Upload to Cloudinary
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="or paste Cover Image URL"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                      />
                    </div>

                    {coverProgress !== null && (
                      <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${coverProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 6: Multi-Screenshot Gallery (10–15+ Images) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Additional Screenshots &amp; Photos Gallery ({images.length} slots)
                  </label>
                  {images.length < 20 && (
                    <button
                      type="button"
                      onClick={handleAddGallerySlot}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Add Screenshot Slot
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {images.map((imgUrl, slotIdx) => (
                    <div
                      key={slotIdx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 flex items-center gap-3"
                    >
                      {/* Thumbnail */}
                      {imgUrl ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-border/60">
                          <Image
                            src={getImgPath(imgUrl)}
                            alt={`Screenshot ${slotIdx + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-darklight border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                          #{slotIdx + 1}
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold cursor-pointer transition border border-primary/20">
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleGalleryUpload(e, slotIdx)}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="or paste URL"
                            value={imgUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setImages((prev) => {
                                const next = [...prev];
                                next[slotIdx] = val;
                                return next;
                              });
                            }}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                          />
                        </div>

                        {galleryProgress[slotIdx] !== undefined && (
                          <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${galleryProgress[slotIdx]}%` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={slotIdx === 0}
                          onClick={() => handleMoveGallerySlot(slotIdx, "up")}
                          className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={slotIdx === images.length - 1}
                          onClick={() => handleMoveGallerySlot(slotIdx, "down")}
                          className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                        >
                          ▼
                        </button>
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGallerySlot(slotIdx)}
                            className="p-1 text-xs text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 7: Live Project & GitHub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-primary">
                    Live Demo / Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://myproject.com"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-700 dark:text-gray-300">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Row 8: Social Links (LinkedIn, Facebook, Instagram, YouTube) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                  Related Social Media Post / Announcement Links (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="url"
                    placeholder="Facebook URL"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="url"
                    placeholder="Instagram URL"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:border-primary focus:outline-hidden"
                  />
                  <input
                    type="url"
                    placeholder="YouTube Video URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border dark:border-dark_border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsSectionManager;
