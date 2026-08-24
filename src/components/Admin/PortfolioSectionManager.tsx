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
  PortfolioItem,
  PortfolioImageLayout,
  defaultPortfolioItems,
  PORTFOLIO_CATEGORIES,
} from "@/types/portfolio";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { PortfolioCardItem } from "@/components/portfolio/PortfolioCardItem";
import { getImgPath } from "@/utils/image";
import toast from "react-hot-toast";

export const PortfolioSectionManager: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("Events & wins");
  const [description, setDescription] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [imageLayout, setImageLayout] = useState<PortfolioImageLayout>("single");
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Subscribe to Firestore portfolio collection
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "portfolio"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: PortfolioItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as PortfolioItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setItems(fetched);
          } else {
            setItems(defaultPortfolioItems);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore portfolio listener notice:", error.message);
          setItems(defaultPortfolioItems);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up portfolio listener:", err);
      setItems(defaultPortfolioItems);
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
    setSubtitle("Events & wins");
    setDescription("");
    setTagsInput("");
    setProjectUrl("");
    setGithubUrl("");
    setLinkedinUrl("");
    setFacebookUrl("");
    setInstagramUrl("");
    setDisplayOrder(items.length > 0 ? Math.max(...items.map((i) => i.displayOrder || 0)) + 1 : 1);
    setImageLayout("single");
    setImages([""]);
    setUploadProgress({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "Events & wins");
    setDescription(item.description || "");
    setTagsInput(item.tags ? item.tags.join(", ") : "");
    setProjectUrl(item.projectUrl || "");
    setGithubUrl(item.githubUrl || "");
    setLinkedinUrl(item.linkedinUrl || "");
    setFacebookUrl(item.facebookUrl || "");
    setInstagramUrl(item.instagramUrl || "");
    setDisplayOrder(item.displayOrder || 1);
    setImageLayout(item.imageLayout || "single");
    setImages(item.images && item.images.length > 0 ? item.images : [""]);
    setUploadProgress({});
    setIsModalOpen(true);
  };

  // Upload image to slot (Cloudinary)
  const handleSlotImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress((prev) => ({ ...prev, [slotIndex]: 10 }));

    try {
      const res = await uploadToCloudinary(file, (progress: number) => {
        setUploadProgress((prev) => ({ ...prev, [slotIndex]: progress }));
      });

      if (res.secure_url) {
        setImages((prev) => {
          const next = [...prev];
          next[slotIndex] = res.secure_url;
          return next;
        });
        toast.success(`Photo ${slotIndex + 1} uploaded to Cloudinary!`);
      } else {
        throw new Error("Upload failed: No secure URL returned.");
      }
    } catch (err: any) {
      console.error("Cloudinary portfolio upload error:", err);
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        });
      }, 1500);
    }
  };

  // Add a new image slot (up to 4)
  const handleAddImageSlot = () => {
    if (images.length >= 4) {
      toast.error("Maximum 4 photos allowed per card.");
      return;
    }
    setImages((prev) => [...prev, ""]);
  };

  // Remove an image slot
  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Move image up/down in slot order
  const handleMoveImage = (index: number, direction: "up" | "down") => {
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

  // Save Card (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
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
    const validImages = images.filter((img) => img && img.trim().length > 0);

    const nowFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const itemData: PortfolioItem = {
      id,
      title: title.trim(),
      subtitle: subtitle.trim() || "Events & wins",
      description: description.trim(),
      tags: cleanTags,
      projectUrl: projectUrl.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      images: validImages.length > 0 ? validImages : ["/images/portfolio/cozycasa.png"],
      imageLayout,
      displayOrder: Number(displayOrder) || 1,
      createdAt: editingId ? (items.find((i) => i.id === editingId)?.createdAt || nowFormatted) : nowFormatted,
      updatedAt: nowFormatted,
    };

    try {
      await setDoc(doc(db, "portfolio", id), itemData);
      toast.success(editingId ? "Portfolio card updated successfully!" : "New portfolio card created!");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save portfolio item error:", err);
      toast.error(err.message || "Failed to save portfolio card.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Card
  const handleDeleteItem = async (item: PortfolioItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "portfolio", item.id));
      toast.success(`"${item.title}" deleted.`);
    } catch (err: any) {
      console.error("Delete portfolio item error:", err);
      toast.error(err.message || "Failed to delete card.");
    }
  };

  // Quick Reorder (Move Up / Down)
  const handleQuickReorder = async (item: PortfolioItem, direction: "up" | "down") => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    const currentOrder = item.displayOrder || currentIndex + 1;
    const targetOrder = targetItem.displayOrder || targetIndex + 1;

    try {
      await setDoc(doc(db, "portfolio", item.id), { ...item, displayOrder: targetOrder });
      await setDoc(doc(db, "portfolio", targetItem.id), { ...targetItem, displayOrder: currentOrder });
      toast.success("Display order updated!");
    } catch (err: any) {
      console.error("Reorder error:", err);
      toast.error("Failed to update order.");
    }
  };

  // Push Defaults to Database
  const handleSeedDefaults = async () => {
    if (!confirm("This will upload standard default portfolio cards to Firestore. Continue?")) return;
    try {
      for (const def of defaultPortfolioItems) {
        await setDoc(doc(db, "portfolio", def.id), def);
      }
      toast.success("Default portfolio cards saved to database!");
    } catch (err: any) {
      toast.error("Failed to seed defaults.");
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-xs">
            <span>Portfolio Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Portfolio Showcase & Cards Manager</h2>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Customise titles, category tags, descriptions, Live Project &amp; Social links (LinkedIn, Facebook, Instagram), ordering, and 1, 2, or 4 photo layouts with Cloudinary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
          >
            Seed Defaults
          </button>
          <button
            onClick={handleOpenCreate}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Card</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border/50 dark:border-dark_border/50 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by title, tag, category..."
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
          Showing <span className="font-bold text-dark dark:text-white">{filteredItems.length}</span> of {items.length} projects
        </div>
      </div>

      {/* Cards Display Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading portfolio items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8">
          <p className="text-base font-semibold text-dark dark:text-white">No portfolio cards found</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Click "Add New Card" or "Seed Defaults" to populate.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl"
          >
            Create First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white dark:bg-darklight rounded-3xl border border-border/50 dark:border-dark_border/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header info & Order badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      #{item.displayOrder || idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50">
                      {item.subtitle || "Events & wins"}
                    </span>
                  </div>

                  {/* Move Up / Down Buttons */}
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
                      disabled={idx === filteredItems.length - 1}
                      onClick={() => handleQuickReorder(item, "down")}
                      className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-darkmode disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Card Preview */}
                <div className="flex justify-center mb-4">
                  <PortfolioCardItem item={item} index={0} isStaggered={false} />
                </div>
              </div>

              {/* Footer: Dates and Actions */}
              <div className="mt-4 pt-3 border-t border-border/40 dark:border-dark_border/40">
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                  <span>Updated: {formatDate(item.updatedAt)}</span>
                  <span>Created: {formatDate(item.createdAt)}</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-darkmode dark:hover:bg-dark_border text-dark dark:text-white transition cursor-pointer"
                  >
                    Edit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border dark:border-dark_border shadow-2xl my-8 animate-in fade-in zoom-in duration-200 text-midnight_text dark:text-white max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-midnight_text dark:text-white mb-1">
              {editingId ? "Edit Portfolio Card" : "Add New Portfolio Card"}
            </h3>
            <p className="text-xs text-grey dark:text-gray-400 mb-6">
              Configure titles, category tags, descriptions, Live Project and social media links. Only provided links will appear to users.
            </p>

            <form onSubmit={handleSaveItem} className="space-y-5">
              {/* Row 1: Title & Category / Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Tech Wins / Rocket Squared"
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
                      placeholder="Events & wins / Office / Travel"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                    {/* Quick Category Chips */}
                    <div className="flex flex-wrap gap-1">
                      {["Events & wins", "Office", "Training Programs", "Travel"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSubtitle(preset)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            subtitle === preset
                              ? "bg-primary text-white"
                              : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Description (Displayed on card!) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Project Description (Shown on Card)
                </label>
                <textarea
                  rows={3}
                  placeholder="Automated CI/CD deployment orchestrator with Kubernetes cluster management and Prometheus real-time monitoring..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Row 3: Tags & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="DevOps, Docker, Kubernetes, AWS"
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

              {/* Row 4: Live Project & GitHub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Live Project</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://myproject.com"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-700"></span>
                    <span>GitHub Repository</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Row 5: Social Links (LinkedIn, Facebook, Instagram) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
                  Social Media Links (Optional — only filled links will display)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#0A66C2] flex items-center gap-1">
                      <span>LinkedIn URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#1877F2] flex items-center gap-1">
                      <span>Facebook URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#E1306C] flex items-center gap-1">
                      <span>Instagram URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Image Layout Mode Selector (1 Photo, 2 Photos Top/Bottom, 4 Photos 2x2) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Photo Display Layout inside Card
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "single" as PortfolioImageLayout,
                      title: "1 Photo",
                      desc: "Full single image",
                      icon: (
                        <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                          1
                        </div>
                      ),
                    },
                    {
                      id: "split_horizontal_2" as PortfolioImageLayout,
                      title: "2 Photos",
                      desc: "Top & Bottom split",
                      icon: (
                        <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 grid grid-rows-2 gap-0.5 p-0.5">
                          <div className="bg-primary/40 rounded-xs"></div>
                          <div className="bg-primary/40 rounded-xs"></div>
                        </div>
                      ),
                    },
                    {
                      id: "grid_4" as PortfolioImageLayout,
                      title: "4 Photos",
                      desc: "2x2 Quadrants split",
                      icon: (
                        <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
                          <div className="bg-primary/40 rounded-xs"></div>
                          <div className="bg-primary/40 rounded-xs"></div>
                          <div className="bg-primary/40 rounded-xs"></div>
                          <div className="bg-primary/40 rounded-xs"></div>
                        </div>
                      ),
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setImageLayout(mode.id);
                        if (mode.id === "split_horizontal_2" && images.length < 2) {
                          setImages((prev) => [...prev, ...Array(2 - prev.length).fill("")]);
                        } else if (mode.id === "grid_4" && images.length < 4) {
                          setImages((prev) => [...prev, ...Array(4 - prev.length).fill("")]);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        imageLayout === mode.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                          : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {mode.icon}
                      <div>
                        <div className="text-xs font-bold text-midnight_text dark:text-white">{mode.title}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{mode.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Image Cloudinary Upload Slots */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Card Photos ({images.length} slots)
                  </label>
                  {images.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddImageSlot}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Add Photo Slot
                    </button>
                  )}
                </div>

                {images.map((imgUrl, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-dark dark:text-white">
                        {imageLayout === "split_horizontal_2"
                          ? slotIdx === 0
                            ? "Photo 01 (Top Half)"
                            : slotIdx === 1
                            ? "Photo 02 (Bottom Half)"
                            : `Photo 0${slotIdx + 1}`
                          : imageLayout === "grid_4"
                          ? `Quadrant 0${slotIdx + 1} (${
                              slotIdx === 0
                                ? "Top-Left"
                                : slotIdx === 1
                                ? "Top-Right"
                                : slotIdx === 2
                                ? "Bottom-Left"
                                : "Bottom-Right"
                            })`
                          : `Photo 0${slotIdx + 1}`}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={slotIdx === 0}
                          onClick={() => handleMoveImage(slotIdx, "up")}
                          className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                          title="Move Photo Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={slotIdx === images.length - 1}
                          onClick={() => handleMoveImage(slotIdx, "down")}
                          className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                          title="Move Photo Down"
                        >
                          ▼
                        </button>
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageSlot(slotIdx)}
                            className="p-1 text-xs text-red-500 hover:text-red-700 cursor-pointer ml-1"
                            title="Remove Photo Slot"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      {imgUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-border/60">
                          <Image
                            src={getImgPath(imgUrl)}
                            alt={`Preview ${slotIdx + 1}`}
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

                      {/* File Upload Input & Progress Bar */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition">
                            Upload to Cloudinary
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleSlotImageUpload(e, slotIdx)}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="or paste Image URL directly"
                            value={imgUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setImages((prev) => {
                                const next = [...prev];
                                next[slotIdx] = val;
                                return next;
                              });
                            }}
                            className="flex-1 px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                          />
                        </div>

                        {uploadProgress[slotIdx] !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-primary font-bold">
                              <span>Uploading to Cloudinary...</span>
                              <span>{uploadProgress[slotIdx]}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-200"
                                style={{ width: `${uploadProgress[slotIdx]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border dark:border-dark_border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Update Card" : "Create Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSectionManager;
