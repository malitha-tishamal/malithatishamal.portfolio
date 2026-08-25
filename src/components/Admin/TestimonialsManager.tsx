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
  TestimonialItem,
  TestimonialStatus,
  defaultTestimonials,
} from "@/types/testimonial";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { getImgPath } from "@/utils/image";
import toast from "react-hot-toast";

export const TestimonialsManager: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | TestimonialStatus>("all");

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [status, setStatus] = useState<TestimonialStatus>("approved");
  const [featured, setFeatured] = useState<boolean>(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "testimonials"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: TestimonialItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as TestimonialItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setTestimonials(fetched);
          } else {
            setTestimonials(defaultTestimonials);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore testimonials listener notice:", error.message);
          setTestimonials(defaultTestimonials);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up testimonials listener:", err);
      setTestimonials(defaultTestimonials);
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
    setName("");
    setRole("");
    setCompany("");
    setContent("");
    setRating(5);
    setAvatarUrl("");
    setStatus("approved");
    setFeatured(true);
    setDisplayOrder(
      testimonials.length > 0
        ? Math.max(...testimonials.map((t) => t.displayOrder || 0)) + 1
        : 1
    );
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: TestimonialItem) => {
    setEditingId(item.id);
    setName(item.name || "");
    setRole(item.role || "");
    setCompany(item.company || "");
    setContent(item.content || "");
    setRating(item.rating || 5);
    setAvatarUrl(item.avatarUrl || "");
    setStatus(item.status || "approved");
    setFeatured(item.featured ?? true);
    setDisplayOrder(item.displayOrder || 1);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  // Upload Avatar to Cloudinary
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    const toastId = toast.loading("Uploading client photo to Cloudinary...");

    try {
      const res = await uploadToCloudinary(file, (percent: number) => {
        setUploadProgress(percent);
      });

      if (res.secure_url) {
        setAvatarUrl(res.secure_url);
        toast.success("Client photo uploaded!", { id: toastId });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      toast.error(err.message || "Failed to upload photo.", { id: toastId });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 1000);
      e.target.value = "";
    }
  };

  // Save Testimonial (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Client name is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Review content is required.");
      return;
    }

    setSaving(true);
    const id = editingId || `testimonial_${Date.now()}`;
    const nowFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const itemData: TestimonialItem = {
      id,
      name: name.trim(),
      role: role.trim() || "Valued Client",
      company: company.trim(),
      content: content.trim(),
      rating: Number(rating) || 5,
      avatarUrl: avatarUrl.trim(),
      status,
      featured,
      displayOrder: Number(displayOrder) || 1,
      createdAt: editingId
        ? testimonials.find((t) => t.id === editingId)?.createdAt || nowFormatted
        : nowFormatted,
      updatedAt: nowFormatted,
    };

    try {
      await setDoc(doc(db, "testimonials", id), itemData);
      toast.success(
        editingId
          ? "Testimonial updated successfully!"
          : "New testimonial created successfully!"
      );
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save testimonial error:", err);
      toast.error(err.message || "Failed to save testimonial.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Testimonial
  const handleDelete = async (item: TestimonialItem) => {
    if (!confirm(`Are you sure you want to delete the testimonial from "${item.name}"?`))
      return;

    try {
      await deleteDoc(doc(db, "testimonials", item.id));
      toast.success(`Testimonial from "${item.name}" deleted.`);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete.");
    }
  };

  // Toggle Status (Approve / Reject)
  const handleToggleStatus = async (item: TestimonialItem) => {
    const nextStatus: TestimonialStatus =
      item.status === "approved" ? "rejected" : "approved";
    try {
      await setDoc(doc(db, "testimonials", item.id), {
        ...item,
        status: nextStatus,
      });
      toast.success(
        `Testimonial marked as ${nextStatus === "approved" ? "Approved & Visible" : "Hidden"}`
      );
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  // Quick Reorder (Move Up / Down)
  const handleQuickReorder = async (
    item: TestimonialItem,
    direction: "up" | "down"
  ) => {
    const currentIndex = testimonials.findIndex((t) => t.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const targetItem = testimonials[targetIndex];
    const currentOrder = item.displayOrder || currentIndex + 1;
    const targetOrder = targetItem.displayOrder || targetIndex + 1;

    try {
      await setDoc(doc(db, "testimonials", item.id), {
        ...item,
        displayOrder: targetOrder,
      });
      await setDoc(doc(db, "testimonials", targetItem.id), {
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
        "This will upload initial client testimonials (including Dimuthu Weerasinghe) to Firestore. Continue?"
      )
    )
      return;

    try {
      for (const def of defaultTestimonials) {
        await setDoc(doc(db, "testimonials", def.id), def);
      }
      toast.success("Default testimonials seeded successfully!");
    } catch (err: any) {
      toast.error("Failed to seed defaults.");
    }
  };

  // Filter items
  const filteredTestimonials = testimonials.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-xs">
            <span>Client Feedback &amp; Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Testimonials &amp; Reviews Manager
          </h2>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Manage client quotes, roles/organizations, 1-5 star ratings, profile avatars with Cloudinary, and approve user-submitted feedback.
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
            className="px-5 py-2.5 rounded-xl bg-white text-amber-800 hover:bg-amber-50 font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border/50 dark:border-dark_border/50 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by client name, company, quote..."
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-darkmode p-1 rounded-xl border border-border/60 dark:border-dark_border text-xs">
          {[
            { id: "all", label: "All Reviews" },
            { id: "approved", label: "Approved" },
            { id: "pending", label: "Pending" },
            { id: "rejected", label: "Hidden" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-white dark:bg-darklight text-primary shadow-xs"
                  : "text-gray-500 hover:text-dark dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing <span className="font-bold text-dark dark:text-white">{filteredTestimonials.length}</span> of {testimonials.length} reviews
        </div>
      </div>

      {/* Testimonials Display Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading testimonials...</p>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border p-8">
          <p className="text-base font-semibold text-dark dark:text-white">No testimonials found</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Click "Add Testimonial" or "Seed Defaults" to populate.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl"
          >
            Create First Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white dark:bg-darklight rounded-3xl border border-border/50 dark:border-dark_border/50 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-amber-500 to-orange-400 rounded-b-md"></div>

              <div>
                {/* Header: Order badge, Stars, & Status */}
                <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-bold flex items-center justify-center">
                      #{item.displayOrder || idx + 1}
                    </span>
                    <div className="flex items-center text-amber-400 text-sm">
                      {[...Array(item.rating || 5)].map((_, si) => (
                        <span key={si}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Move Up / Down & Status Pill */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "approved"
                          ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-950/40 dark:text-green-400"
                          : item.status === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                      }`}
                    >
                      {item.status === "approved"
                        ? "Visible"
                        : item.status === "pending"
                        ? "Pending"
                        : "Hidden"}
                    </span>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleQuickReorder(item, "up")}
                      className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-darkmode disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredTestimonials.length - 1}
                      onClick={() => handleQuickReorder(item, "down")}
                      className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-darkmode disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-midnight_text dark:text-gray-200 leading-relaxed italic mb-4 line-clamp-4 bg-gray-50 dark:bg-darkmode/50 p-3 rounded-2xl border border-border/40 dark:border-dark_border/40">
                  &ldquo;{item.content}&rdquo;
                </p>

                {/* Client Profile */}
                <div className="flex items-center gap-3 pt-2">
                  {item.avatarUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border dark:border-dark_border shrink-0">
                      <Image
                        src={getImgPath(item.avatarUrl)}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-midnight_text dark:text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-grey dark:text-gray-400 font-medium truncate">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer: Dates & Actions */}
              <div className="mt-4 pt-3 border-t border-border/40 dark:border-dark_border/40">
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                  <span>Date: {formatDate(item.createdAt)}</span>
                  <span>Order: #{item.displayOrder}</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                      item.status === "approved"
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    }`}
                  >
                    {item.status === "approved" ? "Hide" : "Approve"}
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border dark:border-dark_border shadow-2xl my-8 text-midnight_text dark:text-white max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-midnight_text dark:text-white mb-1">
              {editingId ? "Edit Client Testimonial" : "Add New Testimonial"}
            </h3>
            <p className="text-xs text-grey dark:text-gray-400 mb-6">
              Configure client name, designation, rating, avatar photo, and testimonial text.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition cursor-pointer ${
                        star <= rating ? "text-amber-400" : "text-gray-300 dark:text-gray-700"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-500 ml-2">
                    {rating}.0 Stars
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dimuthu Weerasinghe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Role / Profession & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Role / Profession *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Owner – Dimu Tour & Travel"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dimu Tour & Travel"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Testimonial / Review Quote *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the review content or feedback..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary leading-relaxed"
                />
              </div>

              {/* Avatar Upload */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Client Avatar Photo
                </label>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shrink-0">
                      <Image
                        src={getImgPath(avatarUrl)}
                        alt="Avatar"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {name ? name.charAt(0).toUpperCase() : "👤"}
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer transition">
                        Upload to Cloudinary
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="or paste Image URL"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                      />
                    </div>

                    {uploadProgress !== null && (
                      <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Visibility Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TestimonialStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  >
                    <option value="approved">Approved (Visible on Homepage)</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Hidden / Rejected</option>
                  </select>
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-dark_border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploading}
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Saving..." : editingId ? "Update Testimonial" : "Create Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsManager;
