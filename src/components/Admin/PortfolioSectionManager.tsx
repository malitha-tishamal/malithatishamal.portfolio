"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  PortfolioItem,
  PortfolioImageLayout,
  PortfolioImageFit,
  PortfolioMediaType,
  PortfolioMediaCrop,
  PortfolioBlock,
  defaultMediaCrop,
  VideoPlaybackMode,
  defaultPortfolioItems,
  PORTFOLIO_CATEGORIES,
  PortfolioSliderSettings,
  defaultPortfolioSliderSettings,
  isVideoUrl,
} from "@/types/portfolio";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { PortfolioCardItem } from "@/components/portfolio/PortfolioCardItem";
import { PortfolioDetailModal } from "@/components/portfolio/PortfolioDetailModal";
import { getImgPath } from "@/utils/image";
import { generateImageAlt, generateSeoDescription, generateSeoKeywords } from "@/utils/seo";
import { RichTextEditor } from "./RichTextEditor";
import { PortfolioPageBuilder } from "./PortfolioPageBuilder";
import { PhotoCropModal } from "./PhotoCropModal";
import {
  saveCustomPortfolioCategory,
  deleteCustomPortfolioCategory,
  getCombinedPortfolioCategories,
} from "@/utils/portfolioCategories";
import toast from "react-hot-toast";

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

const fmtTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// Firestore setDoc rejects `undefined` field values — drop them before writing
const stripUndefined = (obj: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

export const PortfolioSectionManager: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slider settings state
  const [sliderSettings, setSliderSettings] = useState<PortfolioSliderSettings>(defaultPortfolioSliderSettings);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Preview Modal state
  const [previewItem, setPreviewItem] = useState<PortfolioItem | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("Events");
  const [description, setDescription] = useState<string>("");
  const [contentBlocks, setContentBlocks] = useState<PortfolioBlock[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [imageLayout, setImageLayout] = useState<PortfolioImageLayout>("single");
  const [imageFit, setImageFit] = useState<PortfolioImageFit>("cover");
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Video Media Support State
  const [mediaType, setMediaType] = useState<PortfolioMediaType>("image");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoThumbnail, setVideoThumbnail] = useState<string>("");
  const [videoPlaybackMode, setVideoPlaybackMode] = useState<VideoPlaybackMode>("autoplay_loop");
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isThumbUploading, setIsThumbUploading] = useState<boolean>(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Per-photo crop/zoom + video trim/crop state
  const [imageCrops, setImageCrops] = useState<(PortfolioMediaCrop | null)[]>([null]);
  const [videoCrop, setVideoCrop] = useState<PortfolioMediaCrop>({ ...defaultMediaCrop });
  const [videoTrimStart, setVideoTrimStart] = useState<number>(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Interactive Photo Crop Modal State
  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    slotIndex: number;
    imageUrl: string;
    slotLabel: string;
    targetAspectRatio: number;
    targetRatioName: string;
  }>({
    isOpen: false,
    slotIndex: 0,
    imageUrl: "",
    slotLabel: "",
    targetAspectRatio: 1,
    targetRatioName: "Card Slot",
  });

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Subscribe to portfolio items (real-time)
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "portfolio"), (snapshot) => {
        if (!snapshot.empty) {
          const fetched: PortfolioItem[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ ...(docSnap.data() as PortfolioItem), id: docSnap.id });
          });
          fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setItems(fetched);
        } else {
          setItems([]);
        }
        setLoading(false);
      }, (error) => {
        console.warn("Portfolio listener notice:", error.message);
        setItems([]);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Portfolio items listener error:", e);
      setLoading(false);
    }
  }, []);

  // Subscribe to custom portfolio categories
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "siteContent", "portfolioCategories"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.categories)) {
            setCustomCategories(data.categories.filter(Boolean));
          }
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Portfolio custom categories listener error:", e);
    }
  }, []);

  // Save homepage slider settings (read by homepage carousel)
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "siteContent", "portfolio"), { ...sliderSettings }, { merge: true });
      toast.success("Slider settings saved!");
    } catch (err: any) {
      console.error("Save slider settings error:", err);
      toast.error(err.message || "Failed to save slider settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryInput.trim()) return;
    setSavingCategory(true);
    const res = await saveCustomPortfolioCategory(newCategoryInput.trim());
    setSavingCategory(false);
    if (res.success) {
      toast.success(res.message);
      setSubtitle(newCategoryInput.trim());
      setNewCategoryInput("");
      setIsAddingCategory(false);
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    if (!confirm(`Delete custom category "${catToDelete}"?`)) return;
    const res = await deleteCustomPortfolioCategory(catToDelete);
    if (res.success) {
      toast.success(res.message);
      if (subtitle === catToDelete) {
        setSubtitle("Events");
      }
    } else {
      toast.error(res.message);
    }
  };

  // Video Upload & Frame Capture Handlers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    setVideoUploadProgress(10);

    try {
      const res = await uploadToCloudinary(file, (percent: number) => {
        setVideoUploadProgress(percent);
      }, "video");

      if (res.secure_url) {
        setVideoUrl(res.secure_url);
        setMediaType("video");
        toast.success("Video uploaded to Cloudinary!");
      } else {
        throw new Error("Upload failed: No secure URL returned.");
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(err.message || "Failed to upload video.");
    } finally {
      setIsVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsThumbUploading(true);
    try {
      const res = await uploadToCloudinary(file, undefined, "image");
      if (res.secure_url) {
        setVideoThumbnail(res.secure_url);
        toast.success("Thumbnail uploaded!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload thumbnail.");
    } finally {
      setIsThumbUploading(false);
    }
  };

  const handleCaptureVideoFrame = async () => {
    const video = previewVideoRef.current;
    if (!video) {
      toast.error("Please load the video first to capture a frame.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D canvas context");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `frame_${Date.now()}.jpg`, { type: "image/jpeg" });

      toast.loading("Uploading captured frame thumbnail...", { id: "thumb-cap" });
      const res = await uploadToCloudinary(file, undefined, "image");
      if (res.secure_url) {
        setVideoThumbnail(res.secure_url);
        toast.success("Captured video frame thumbnail saved!", { id: "thumb-cap" });
      } else {
        setVideoThumbnail(dataUrl);
        toast.success("Video frame captured!", { id: "thumb-cap" });
      }
    } catch (err: any) {
      console.error("Frame capture error:", err);
      toast.error("Could not capture video frame: " + (err.message || "Unknown error"), { id: "thumb-cap" });
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("Events");
    setDescription("");
    setContentBlocks([]);
    setTagsInput("");
    setProjectUrl("");
    setGithubUrl("");
    setLinkedinUrl("");
    setFacebookUrl("");
    setInstagramUrl("");
    setDisplayOrder(items.length > 0 ? Math.max(...items.map((i) => i.displayOrder || 0)) + 1 : 1);
    setImageLayout("single");
    setImageFit("cover");
    setImages([""]);
    setImageCrops([null]);
    setMediaType("image");
    setVideoUrl("");
    setVideoThumbnail("");
    setVideoPlaybackMode("autoplay_once");
    setVideoCrop({ ...defaultMediaCrop });
    setVideoTrimStart(0);
    setVideoTrimEnd(0);
    setVideoDuration(0);
    setUploadProgress({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "Events");
    setDescription(item.description || "");
    setContentBlocks(item.contentBlocks ? item.contentBlocks.map((b) => ({ ...b })) : []);
    setTagsInput(item.tags ? item.tags.join(", ") : "");
    setProjectUrl(item.projectUrl || "");
    setGithubUrl(item.githubUrl || "");
    setLinkedinUrl(item.linkedinUrl || "");
    setFacebookUrl(item.facebookUrl || "");
    setInstagramUrl(item.instagramUrl || "");
    setDisplayOrder(item.displayOrder || 1);
    setImageLayout(item.imageLayout || "single");
    setImageFit(item.imageFit || "cover");
    const loadedImages = item.images && item.images.length > 0 ? item.images : [""];
    setImages(loadedImages);
    setImageCrops(loadedImages.map((_, i) => item.imageCrops?.[i] ?? null));

    // Only treat as a video item when the video is the primary media —
    // photo grids that merely contain a video slot must stay in Photos mode,
    // and the thumbnail must never be auto-filled from an unrelated photo.
    const isVid =
      item.mediaType === "video" ||
      !!item.videoUrl ||
      (loadedImages.length === 1 && isVideoUrl(loadedImages[0]));
    setMediaType(isVid ? "video" : "image");
    setVideoUrl(item.videoUrl || loadedImages.find((img) => isVideoUrl(img)) || "");
    setVideoThumbnail(
      item.videoThumbnail ||
        (isVid && loadedImages.length === 1 && !isVideoUrl(loadedImages[0]) ? loadedImages[0] : "")
    );
    setVideoPlaybackMode(item.videoPlaybackMode || "autoplay_loop");
    setVideoCrop(item.videoCrop ? { ...item.videoCrop } : { ...defaultMediaCrop });
    setVideoTrimStart(item.videoTrim?.start || 0);
    setVideoTrimEnd(item.videoTrim?.end || 0);
    setVideoDuration(0);

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
    setImageCrops((prev) => [...prev, null]);
  };

  // Remove an image slot
  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageCrops((prev) => prev.filter((_, i) => i !== index));
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
    setImageCrops((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Exact slot dimensions & aspect ratio matching card layout & fit
  const getSlotDimensions = (layout: PortfolioImageLayout, fit: PortfolioImageFit) => {
    const baseCardW = 160;
    const baseCardH = fit === "portrait_tall" ? 213 : fit === "contain" ? 160 : 140;

    if (layout === "single") {
      return { width: baseCardW, height: baseCardH, ratio: baseCardW / baseCardH, name: "Full Card Frame" };
    }
    if (layout === "split_vertical_2") {
      const w = Math.round(baseCardW / 2);
      const h = baseCardH;
      return { width: Math.max(w, 85), height: h, ratio: w / h, name: "Side-by-Side (Tall)" };
    }
    if (layout === "split_horizontal_2") {
      const w = baseCardW;
      const h = Math.round(baseCardH / 2);
      return { width: w, height: Math.max(h, 65), ratio: w / h, name: "Stacked (Wide)" };
    }
    // grid_4 (2x2)
    const w = Math.round(baseCardW / 2);
    const h = Math.round(baseCardH / 2);
    return { width: Math.max(w, 90), height: Math.max(h, 75), ratio: w / h, name: "Quadrant (2x2)" };
  };

  const handleOpenCropModal = (slotIndex: number) => {
    const url = images[slotIndex];
    if (!url) {
      toast.error("Please add an image to this slot first.");
      return;
    }
    const dim = getSlotDimensions(imageLayout, imageFit);
    let label = `Photo ${slotIndex + 1}`;
    if (imageLayout === "grid_4") {
      label = ["Quadrant 01 (Top-Left)", "Quadrant 02 (Top-Right)", "Quadrant 03 (Bottom-Left)", "Quadrant 04 (Bottom-Right)"][slotIndex] || label;
    } else if (imageLayout === "split_vertical_2") {
      label = slotIndex === 0 ? "Left Half" : "Right Half";
    } else if (imageLayout === "split_horizontal_2") {
      label = slotIndex === 0 ? "Top Half" : "Bottom Half";
    }

    setCropModalState({
      isOpen: true,
      slotIndex,
      imageUrl: url,
      slotLabel: label,
      targetAspectRatio: dim.ratio,
      targetRatioName: dim.name,
    });
  };

  const handleApplyCropResult = (newUrl: string, cropData: PortfolioMediaCrop) => {
    const idx = cropModalState.slotIndex;
    if (newUrl && newUrl !== images[idx]) {
      setImages((prev) => {
        const next = [...prev];
        next[idx] = newUrl;
        return next;
      });
    }
    updateImageCrop(idx, cropData);
  };

  // Per-slot crop/zoom update (null = reset)
  const updateImageCrop = (idx: number, patch: Partial<PortfolioMediaCrop> | null) => {
    setImageCrops((prev) => {
      const next = [...prev];
      next[idx] = patch === null ? null : { ...(next[idx] ?? { ...defaultMediaCrop }), ...patch };
      return next;
    });
  };

  // Persist crop / trim to the live card immediately (no full form save needed)
  const [liveSaving, setLiveSaving] = useState(false);
  const handleLiveSaveMedia = async () => {
    if (!editingId) {
      toast.error("Create / save the card once first — then Live Save works.");
      return;
    }
    setLiveSaving(true);
    try {
      const payload: Record<string, any> = {
        imageCrops: imageCrops.some((c) => c && (c.zoom > 1 || c.fit || c.ox !== 50 || c.oy !== 50))
          ? imageCrops
          : null,
      };
      if (mediaType === "video") {
        const hasVideoCrop =
          videoCrop.zoom > 1 || !!videoCrop.fit || videoCrop.ox !== 50 || videoCrop.oy !== 50;
        payload.videoCrop = hasVideoCrop ? videoCrop : null;
        payload.videoTrim =
          videoTrimStart > 0 || videoTrimEnd > 0
            ? { start: videoTrimStart, end: videoTrimEnd }
            : null;
      }
      await updateDoc(doc(db, "portfolio", editingId), payload);
      toast.success("Crop / trim applied to the live card!");
    } catch (err: any) {
      console.error("Live save media error:", err);
      toast.error(err.message || "Live save failed.");
    } finally {
      setLiveSaving(false);
    }
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
      subtitle: subtitle.trim() || "Events",
      description: description.trim(),
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
      tags: cleanTags,
      projectUrl: projectUrl.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      images:
        mediaType === "video"
          ? [videoThumbnail || videoUrl || "/images/portfolio/cozycasa.png"]
          : validImages.length > 0
          ? validImages
          : ["/images/portfolio/cozycasa.png"],
      imageLayout,
      imageFit,
      mediaType,
      videoUrl: mediaType === "video" ? videoUrl.trim() : undefined,
      videoThumbnail: mediaType === "video" ? videoThumbnail.trim() : undefined,
      videoPlaybackMode: mediaType === "video" ? videoPlaybackMode : undefined,
      videoTrim:
        mediaType === "video" && (videoTrimStart > 0 || videoTrimEnd > 0)
          ? { start: videoTrimStart, end: videoTrimEnd }
          : undefined,
      videoCrop:
        mediaType === "video" &&
        (videoCrop.zoom > 1 || !!videoCrop.fit || videoCrop.ox !== 50 || videoCrop.oy !== 50)
          ? videoCrop
          : undefined,
      imageCrops: imageCrops.some((c) => c && (c.zoom > 1 || c.fit || c.ox !== 50 || c.oy !== 50)) ? imageCrops : undefined,
      displayOrder: Number(displayOrder) || 1,
      altText: generateImageAlt(title.trim(), subtitle.trim() || "Portfolio Showcase"),
      seoDescription: generateSeoDescription(description.trim(), title.trim()),
      seoKeywords: generateSeoKeywords(title.trim(), cleanTags, subtitle.trim()),
      createdAt: editingId ? (items.find((i) => i.id === editingId)?.createdAt || nowFormatted) : nowFormatted,
      updatedAt: nowFormatted,
    };

    try {
      await setDoc(doc(db, "portfolio", id), stripUndefined(itemData) as PortfolioItem);
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

  // Direct Numeric Order Change
  const handleDirectOrderChange = async (id: string, newOrder: number) => {
    const updated = items.map((it) => (it.id === id ? { ...it, displayOrder: newOrder } : it));
    updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setItems(updated);
    try {
      await setDoc(doc(db, "portfolio", id), { displayOrder: newOrder }, { merge: true });
      toast.success("Display order updated!");
    } catch (err: any) {
      console.error("Direct order change error:", err);
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
            Customise titles, category tags (Events, Wins &amp; Achivements, Office, Training Programs, Travel), descriptions, photo display fit (Portrait/Landscape without cropping), ordering, and live social links.
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

      {/* ──────────────── HOMEPAGE SLIDER CONTROLS PANEL ──────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-darklight border border-border dark:border-dark_border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70 dark:border-dark_border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h3 className="text-base font-bold text-dark dark:text-white">
                Homepage Slider &amp; Carousel Controls
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manage autoplay interval, transition speed, and pause behaviors for the portfolio showcase carousel on the homepage.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-2"
          >
            <span>{savingSettings ? "Saving..." : "💾 Save Slider Settings"}</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Autoplay Toggle */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-dark dark:text-white">Autoplay</p>
              <p className="text-[11px] text-gray-400">Auto-rotate slides</p>
            </div>
            <input
              type="checkbox"
              checked={sliderSettings.autoplay}
              onChange={(e) =>
                setSliderSettings((p) => ({ ...p, autoplay: e.target.checked }))
              }
              className="w-5 h-5 text-primary rounded cursor-pointer"
            />
          </div>

          {/* Autoplay Speed / Interval */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-dark dark:text-white">Slide Interval</p>
              <span className="text-xs font-mono font-bold text-primary">
                {sliderSettings.autoplaySpeed}ms ({(sliderSettings.autoplaySpeed / 1000).toFixed(1)}s)
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={10000}
              step={250}
              value={sliderSettings.autoplaySpeed}
              onChange={(e) =>
                setSliderSettings((p) => ({
                  ...p,
                  autoplaySpeed: Number(e.target.value),
                }))
              }
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1.5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Transition Speed */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-dark dark:text-white">Transition Speed</p>
              <span className="text-xs font-mono font-bold text-primary">
                {sliderSettings.transitionSpeed}ms
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={2000}
              step={50}
              value={sliderSettings.transitionSpeed}
              onChange={(e) =>
                setSliderSettings((p) => ({
                  ...p,
                  transitionSpeed: Number(e.target.value),
                }))
              }
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>200ms</span>
              <span>2000ms</span>
            </div>
          </div>

          {/* Pause on Hover */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-dark dark:text-white">Pause on Hover</p>
              <p className="text-[11px] text-gray-400">Halt when hovered</p>
            </div>
            <input
              type="checkbox"
              checked={sliderSettings.pauseOnHover}
              onChange={(e) =>
                setSliderSettings((p) => ({ ...p, pauseOnHover: e.target.checked }))
              }
              className="w-5 h-5 text-primary rounded cursor-pointer"
            />
          </div>
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
                  <div className="flex items-center gap-2">
                    {/* Order Controls: Direct Numeric Input + Up/Down */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={item.displayOrder || idx + 1}
                        onChange={(e) =>
                          handleDirectOrderChange(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-12 px-1.5 py-0.5 text-center font-bold text-xs rounded-lg border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white"
                        title="Display Order"
                      />
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleQuickReorder(item, "up")}
                          className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer text-[10px] leading-none"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === filteredItems.length - 1}
                          onClick={() => handleQuickReorder(item, "down")}
                          className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer text-[10px] leading-none"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50">
                      {item.subtitle || "Events"}
                    </span>
                  </div>
                </div>

                {/* Card Preview (Clicking opens Detail Modal!) */}
                <div className="flex justify-center mb-4">
                  <PortfolioCardItem
                    item={item}
                    index={0}
                    isStaggered={false}
                    onClick={() => setPreviewItem(item)}
                  />
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
                    onClick={() => setPreviewItem(item)}
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
                    onClick={() => handleDeleteItem(item)}
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

      {/* DETAIL PREVIEW MODAL */}
      <PortfolioDetailModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

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
              Configure titles, category tags, descriptions, photo fit/crop settings, and Live Project / Social links.
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
                    placeholder="e.g. INNOVISION 2026 / Rocket Squared"
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
                      placeholder="Events / Wins & Achivements / Office..."
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                    />
                    {/* Quick Category Chips (built-in + saved custom categories) */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from(
                        new Set([
                          ...getCombinedPortfolioCategories(customCategories),
                          ...items.map((i) => i.subtitle).filter(Boolean),
                        ])
                      )
                        .filter(
                          (preset) =>
                            preset.toLowerCase() !== "health & lifestyle community" &&
                            preset.toLowerCase() !== "events & wins" &&
                            preset.toLowerCase() !== "events , wins & achivements" &&
                            preset.toLowerCase() !== "all photos"
                        )
                        .map((preset) => {
                          const isCustom = customCategories.some(
                            (c) => c.toLowerCase() === preset.toLowerCase()
                          );
                          return (
                            <span
                              key={preset}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                                subtitle === preset
                                  ? "bg-primary text-white shadow-xs"
                                  : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSubtitle(preset)}
                                className="cursor-pointer"
                              >
                                {preset}
                              </button>
                              {isCustom && (
                                <button
                                  type="button"
                                  title={`Delete category "${preset}"`}
                                  onClick={() => handleDeleteCategory(preset)}
                                  className="cursor-pointer text-red-400 hover:text-red-600 font-bold leading-none"
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          );
                        })}

                      {/* Add / Save New Category to DB */}
                      {isAddingCategory ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateCategory();
                              }
                            }}
                            placeholder="New category name..."
                            className="px-2 py-0.5 text-[10px] rounded-md border border-primary bg-white dark:bg-darkmode text-dark dark:text-white focus:outline-hidden w-32"
                          />
                          <button
                            type="button"
                            disabled={savingCategory}
                            onClick={handleCreateCategory}
                            className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-primary text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                          >
                            {savingCategory ? "..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryInput("");
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-gray-500 hover:text-red-500 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(true)}
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold border border-dashed border-primary/60 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          + Add Category
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Description — Full Rich Text Editor (MS Word style) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Project Description (Shown on Card &amp; Details)
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the project achievements, event context, or work details... (Bold, colors, fonts, lists & MS Word paste supported)"
                />
              </div>

              {/* Row 2B: Custom Detail Page Builder (web-page-style, drag & drop) */}
              <div className="rounded-2xl border border-border/60 dark:border-dark_border/60 bg-gray-50/60 dark:bg-darkmode/40 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider">
                    Detail Page Builder (Custom Web-Page View)
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {contentBlocks.length} block{contentBlocks.length === 1 ? "" : "s"} · drag ⠿ to reorder
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  Build a custom web-page-style detail view with headings, paragraphs, images,
                  videos &amp; galleries. Paragraph blocks include a code/HTML view. If empty, the
                  default detail layout is used.
                </p>
                <PortfolioPageBuilder blocks={contentBlocks} onChange={setContentBlocks} />
              </div>

              {/* Row 3: Tags & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Innovation, 1st Place, Mobile App"
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

              {/* Row 4: Photo Display Fit / Crop Settings (Fix for Portrait Photos!) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Photo Crop &amp; Framing Style (Fix Portrait / Landscape)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "cover" as PortfolioImageFit,
                      title: "Cover (Fill Frame)",
                      desc: "Zooms to fill image box",
                    },
                    {
                      id: "contain" as PortfolioImageFit,
                      title: "Contain (Full Uncropped)",
                      desc: "Shows 100% of photo, no crop",
                    },
                    {
                      id: "portrait_tall" as PortfolioImageFit,
                      title: "Portrait Tall (3:4 Ratio)",
                      desc: "Taller frame for tall photos",
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setImageFit(mode.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        imageFit === mode.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                          : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-midnight_text dark:text-white">{mode.title}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Photo Display Layout inside Card */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Card Layout (Photos count in Card Frame)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                      id: "split_vertical_2" as PortfolioImageLayout,
                      title: "2 Photos Side-by-Side",
                      desc: "Left & Right columns",
                      icon: (
                        <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/40 grid grid-cols-2 gap-0.5 p-0.5">
                          <div className="bg-primary/40 rounded-xs"></div>
                          <div className="bg-primary/40 rounded-xs"></div>
                        </div>
                      ),
                    },
                    {
                      id: "split_horizontal_2" as PortfolioImageLayout,
                      title: "2 Photos Stacked",
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
                        if (
                          (mode.id === "split_horizontal_2" || mode.id === "split_vertical_2") &&
                          images.length < 2
                        ) {
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

              {/* Row 6: Live Project & GitHub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Live Project (Optional)</span>
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
                    <span>GitHub Repository (Optional)</span>
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

              {/* Row 7: Social Links (LinkedIn, Facebook, Instagram) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">
                  Social Media Links (Optional — only filled links will display)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-[#0A66C2]">
                      LinkedIn URL
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
                    <label className="block text-[11px] font-semibold mb-1 text-[#1877F2]">
                      Facebook URL
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
                    <label className="block text-[11px] font-semibold mb-1 text-[#E1306C]">
                      Instagram URL
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

              {/* Media Type Selector: Photos or Video */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Card Media Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMediaType("image")}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      mediaType === "image"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                        : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-base">📷</span>
                    <span>
                      <span className="block text-xs font-bold text-midnight_text dark:text-white">Photos</span>
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400">1–4 image slots</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("video")}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      mediaType === "video"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                        : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-base">🎬</span>
                    <span>
                      <span className="block text-xs font-bold text-midnight_text dark:text-white">Video</span>
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400">Upload video + thumbnail</span>
                    </span>
                  </button>
                </div>
              </div>

              {mediaType === "video" ? (
              /* ─────────── VIDEO UPLOAD, THUMBNAIL & PLAYBACK SETTINGS ─────────── */
              <div className="space-y-3 pt-2 p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60">
                <label className="block text-xs font-bold uppercase tracking-wider">
                  Video Upload &amp; Playback
                </label>

                {/* Video upload + URL paste */}
                <div className="flex items-center gap-2">
                  <label
                    className={`px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shrink-0 ${
                      isVideoUploading ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {isVideoUploading ? `Uploading ${videoUploadProgress}%` : "⬆ Upload Video"}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="or paste Video URL (.mp4 / .webm / Cloudinary)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                  />
                </div>

                {isVideoUploading && (
                  <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-200"
                      style={{ width: `${videoUploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Video preview + frame capture (Instagram / TikTok style) */}
                {videoUrl && (
                  <div className="space-y-2">
                    <video
                      ref={previewVideoRef}
                      src={getImgPath(videoUrl)}
                      controls
                      muted
                      playsInline
                      crossOrigin="anonymous"
                      onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration || 0)}
                      className="w-full max-h-64 rounded-xl bg-black border border-border/60 dark:border-dark_border/60"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureVideoFrame}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black dark:bg-gray-700 text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5"
                      >
                        📸 Capture Current Frame as Thumbnail
                      </button>
                      <label
                        className={`px-3 py-1.5 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-[11px] font-bold text-dark dark:text-white cursor-pointer hover:border-primary transition ${
                          isThumbUploading ? "opacity-60 pointer-events-none" : ""
                        }`}
                      >
                        {isThumbUploading ? "Uploading..." : "⬆ Upload Thumbnail Image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Tip: pause the preview at the exact moment you like (like Instagram / TikTok),
                      then capture that frame as the card thumbnail.
                    </p>
                  </div>
                )}

                {/* Trim & Crop / Zoom for the video (reflected on the card) */}
                <div className="space-y-2 pt-2 border-t border-border/40 dark:border-dark_border/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Trim &amp; Crop (as shown on card)
                    </span>
                    <div className="flex items-center gap-2">
                      {(videoTrimStart > 0 || videoTrimEnd > 0 || videoCrop.zoom > 1) && (
                        <button
                          type="button"
                          onClick={() => {
                            setVideoTrimStart(0);
                            setVideoTrimEnd(0);
                            setVideoCrop({ ...defaultMediaCrop });
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleLiveSaveMedia}
                        disabled={liveSaving || !editingId}
                        title={editingId ? "Save trim / crop to the live card now" : "Save the card once first"}
                        className="px-2 py-0.5 rounded-md bg-primary hover:bg-blue-700 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer transition"
                      >
                        {liveSaving ? "Saving..." : "💾 Live Save"}
                      </button>
                    </div>
                  </div>

                  {videoDuration > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="space-y-0.5">
                        <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                          <span>Trim Start</span>
                          <span className="font-bold">
                            {fmtTime(videoTrimStart)} / {fmtTime(videoDuration)}
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={videoDuration}
                          step={0.1}
                          value={videoTrimStart}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setVideoTrimStart(Math.min(v, videoTrimEnd > 0 ? videoTrimEnd : v));
                          }}
                          className="w-full accent-primary cursor-pointer"
                        />
                      </label>
                      <label className="space-y-0.5">
                        <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                          <span>Trim End (0 = full)</span>
                          <span className="font-bold">
                            {videoTrimEnd > 0 ? fmtTime(videoTrimEnd) : fmtTime(videoDuration)}
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={videoDuration}
                          step={0.1}
                          value={videoTrimEnd}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setVideoTrimEnd(v > 0 ? Math.max(v, videoTrimStart) : 0);
                          }}
                          className="w-full accent-primary cursor-pointer"
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Load the video preview above to enable the trim sliders.
                    </p>
                  )}

                  {/* ── VIDEO LIVE OUTPUT & CROP / ALIGNMENT CONTROLS ── */}
                  {videoUrl && (() => {
                    const videoDim = getSlotDimensions("single", imageFit);
                    const currentVideoZoom = videoCrop.zoom || 1;
                    const currentVideoOx = videoCrop.ox ?? 50;
                    const currentVideoOy = videoCrop.oy ?? 50;
                    const videoSlotFit: "cover" | "contain" = videoCrop.fit || (imageFit === "contain" ? "contain" : "cover");
                    const videoHasEmptyMargins = videoSlotFit === "contain";

                    return (
                      <div className="space-y-4 pt-2">
                        {/* Live Combined Card Frame for Video */}
                        <div className="p-4 rounded-2xl bg-gray-900 border border-border/60 dark:border-dark_border/60 text-white">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                                <span>🎬</span>
                                <span>Live Card Video Output</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                                {imageFit === "contain"
                                  ? "Card Fit: Contain (Shows uncropped with gaps)"
                                  : imageFit === "portrait_tall"
                                  ? "Card Fit: Portrait Tall (3:4)"
                                  : "Card Fit: Cover (Fills card frame)"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              Mirrors the website card video 100% exactly
                            </span>
                          </div>

                          <div className="flex justify-center">
                            <div
                              className={`relative w-full max-w-[320px] ${
                                imageFit === "portrait_tall"
                                  ? "aspect-[3/4]"
                                  : imageFit === "contain"
                                  ? "aspect-[4/4]"
                                  : "aspect-[4/3.5]"
                              } rounded-2xl overflow-hidden bg-gray-950 border-2 border-primary/50 shadow-2xl`}
                            >
                              <div
                                className="absolute inset-0 w-full h-full"
                                style={
                                  currentVideoZoom > 1
                                    ? {
                                        transform: `scale(${currentVideoZoom})`,
                                        transformOrigin: `${currentVideoOx}% ${currentVideoOy}%`,
                                      }
                                    : undefined
                                }
                              >
                                <video
                                  src={getImgPath(videoUrl)}
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                  preload="metadata"
                                  style={{
                                    objectPosition: `${currentVideoOx}% ${currentVideoOy}%`,
                                  }}
                                  className={
                                    videoSlotFit === "contain"
                                      ? "w-full h-full object-contain p-1 bg-gray-50/50 dark:bg-black/20"
                                      : "w-full h-full object-cover"
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Individual Slot Thumbnail View */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-dark dark:text-white flex items-center gap-1">
                                <span>🎯</span>
                                <span>Live Output (Card Video Slot Thumbnail View)</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                                {videoDim.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(currentVideoZoom > 1 || videoCrop.fit || currentVideoOx !== 50 || currentVideoOy !== 50) && (
                                <button
                                  type="button"
                                  onClick={() => setVideoCrop({ ...defaultMediaCrop })}
                                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  ↺ Reset
                                </button>
                              )}
                              {videoThumbnail && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dim = getSlotDimensions("single", imageFit);
                                    setCropModalState({
                                      isOpen: true,
                                      slotIndex: 0,
                                      imageUrl: videoThumbnail,
                                      slotLabel: "Video Thumbnail",
                                      targetAspectRatio: dim.ratio,
                                      targetRatioName: dim.name,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-blue-700 text-white text-[11px] font-extrabold cursor-pointer transition shadow-xs flex items-center gap-1"
                                >
                                  <span>✂️</span>
                                  <span>Crop Thumbnail Tool</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleLiveSaveMedia}
                                disabled={liveSaving || !editingId}
                                title={editingId ? "Save crop to the live card now" : "Save the card once first"}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer transition shadow-xs"
                              >
                                {liveSaving ? "Saving..." : "💾 Live Save"}
                              </button>
                            </div>
                          </div>

                          {/* Live preview + controls row */}
                          <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl bg-white dark:bg-darklight border border-border/60 dark:border-dark_border/60">
                            {/* Live Video Slot Preview Box */}
                            <div className="flex flex-col items-center gap-1.5 shrink-0 mx-auto sm:mx-0">
                              <div
                                style={{
                                  width: videoDim.width,
                                  height: videoDim.height,
                                }}
                                className={`relative rounded-xl overflow-hidden border-2 border-primary/70 shrink-0 shadow-lg ${
                                  videoHasEmptyMargins
                                    ? "bg-gray-100 dark:bg-gray-900 ring-2 ring-amber-500/60"
                                    : "bg-black"
                                }`}
                              >
                                {videoHasEmptyMargins && (
                                  <div className="absolute inset-0 flex justify-between pointer-events-none z-0">
                                    <div className="w-5 h-full bg-amber-400/20 border-r border-amber-500/40 flex items-center justify-center">
                                      <span className="text-[7px] font-black text-amber-600 dark:text-amber-400 -rotate-90 tracking-tighter">
                                        GAP
                                      </span>
                                    </div>
                                    <div className="w-5 h-full bg-amber-400/20 border-l border-amber-500/40 flex items-center justify-center">
                                      <span className="text-[7px] font-black text-amber-600 dark:text-amber-400 -rotate-90 tracking-tighter">
                                        GAP
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div
                                  className="absolute inset-0 w-full h-full z-1"
                                  style={
                                    currentVideoZoom > 1
                                      ? {
                                          transform: `scale(${currentVideoZoom})`,
                                          transformOrigin: `${currentVideoOx}% ${currentVideoOy}%`,
                                        }
                                      : undefined
                                  }
                                >
                                  <video
                                    src={getImgPath(videoUrl)}
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    preload="metadata"
                                    style={{
                                      objectPosition: `${currentVideoOx}% ${currentVideoOy}%`,
                                    }}
                                    className={
                                      videoSlotFit === "contain"
                                        ? "w-full h-full object-contain p-1 bg-gray-50/50 dark:bg-black/20"
                                        : "w-full h-full object-cover"
                                    }
                                  />
                                </div>

                                <span
                                  className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide z-10 ${
                                    videoSlotFit === "contain"
                                      ? currentVideoZoom <= 1
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : "bg-blue-600 text-white shadow-xs"
                                      : "bg-black/75 text-white"
                                  }`}
                                >
                                  {videoSlotFit === "contain"
                                    ? currentVideoZoom <= 1
                                      ? "⚠️ SIDE GAPS DETECTED"
                                      : `🔍 ZOOM ${Math.round(currentVideoZoom * 100)}%`
                                    : "✨ FILLED (NO GAPS)"}
                                </span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-semibold text-center">
                                {videoDim.width}×{videoDim.height}px ({videoDim.name})
                              </span>
                            </div>

                            {/* Slot Controls */}
                            <div className="flex-1 w-full space-y-2.5">
                              {/* Notice / Status pill */}
                              {videoSlotFit === "contain" ? (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    {currentVideoZoom <= 1 ? (
                                      <>⚠️ <strong>Contain Mode (depathten his ida):</strong> Video has side margins. Zoom in to reduce gaps smoothly, or click &apos;⚡ Fill Slot&apos;.</>
                                    ) : (
                                      <>🔍 <strong>Contain Mode (Zoom {Math.round(currentVideoZoom * 100)}%):</strong> Gaps are reducing live as you zoom in.</>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVideoCrop((prev) => ({
                                        ...prev,
                                        fit: "cover",
                                      }))
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs"
                                  >
                                    ⚡ Fill Slot (Switch to Cover)
                                  </button>
                                </div>
                              ) : (
                                <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
                                  <span>
                                    ✨ <strong>Cover Mode:</strong> Video slot is filled with zero empty gaps on the website card.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVideoCrop((prev) => ({
                                        ...prev,
                                        fit: "contain",
                                        zoom: 1,
                                        ox: 50,
                                        oy: 50,
                                      }))
                                    }
                                    className="px-2 py-0.5 rounded-md bg-gray-200 dark:bg-darkmode text-gray-700 dark:text-gray-300 text-[10px] font-semibold shrink-0 hover:bg-gray-300 cursor-pointer"
                                  >
                                    Switch to Contain
                                  </button>
                                </div>
                              )}

                              {/* Quick Crop / Fit buttons */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVideoCrop((prev) => ({
                                      ...prev,
                                      fit: "cover",
                                    }))
                                  }
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    videoSlotFit === "cover"
                                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  Fill / Crop Video (Cover)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVideoCrop((prev) => ({
                                      ...prev,
                                      fit: "contain",
                                    }))
                                  }
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    videoSlotFit === "contain"
                                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  Fit Whole (Contain)
                                </button>

                                {/* Focal alignments */}
                                <div className="ml-auto flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-gray-400">Focus:</span>
                                  <button
                                    type="button"
                                    onClick={() => setVideoCrop((p) => ({ ...p, ox: 50, oy: 15 }))}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Top (Heads/Faces)"
                                  >
                                    Top
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoCrop((p) => ({ ...p, ox: 50, oy: 50 }))}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Center Focus"
                                  >
                                    Center
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoCrop((p) => ({ ...p, ox: 50, oy: 85 }))}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Bottom"
                                  >
                                    Bottom
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoCrop((p) => ({ ...p, ox: 15, oy: 50 }))}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Left"
                                  >
                                    Left
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoCrop((p) => ({ ...p, ox: 85, oy: 50 }))}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Right"
                                  >
                                    Right
                                  </button>
                                </div>
                              </div>

                              {/* Sliders: Zoom, Focus X, Focus Y */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40 dark:border-dark_border/40">
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Zoom</span>
                                    <span className="font-bold text-primary">
                                      {Math.round(currentVideoZoom * 100)}%
                                    </span>
                                  </span>
                                  <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={currentVideoZoom}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      setVideoCrop((p) => ({
                                        ...p,
                                        zoom: v,
                                      }));
                                    }}
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Focus X</span>
                                    <span className="font-bold text-primary">{currentVideoOx}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={currentVideoOx}
                                    onChange={(e) =>
                                      setVideoCrop((p) => ({
                                        ...p,
                                        ox: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Focus Y</span>
                                    <span className="font-bold text-primary">{currentVideoOy}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={currentVideoOy}
                                    onChange={(e) =>
                                      setVideoCrop((p) => ({
                                        ...p,
                                        oy: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Thumbnail preview / hint */}
                <div className="flex items-center gap-3">
                  {videoThumbnail ? (
                    <>
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border/60 dark:border-dark_border/60 bg-gray-200 shrink-0">
                        <Image
                          src={getImgPath(videoThumbnail)}
                          alt="Video thumbnail"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoThumbnail("")}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Card shows this thumbnail image.
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      No thumbnail set — the card will play the video itself and show a Replay
                      button when it finishes.
                    </span>
                  )}
                </div>

                {/* Playback mode setting */}
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-dark dark:text-white">
                    How should the video appear on the card? (Setting)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        { id: "autoplay_loop", title: "Autoplay & Loop", desc: "Plays continuously on the card" },
                        { id: "autoplay_once", title: "Play Once + Replay", desc: "Plays once, then Replay button shows" },
                        { id: "hover_play", title: "Play on Hover", desc: "Plays only while mouse is over card" },
                        { id: "thumbnail_only", title: "Thumbnail Only", desc: "Static image; video plays in details" },
                      ] as { id: VideoPlaybackMode; title: string; desc: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setVideoPlaybackMode(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          videoPlaybackMode === m.id
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border dark:border-dark_border hover:border-gray-400"
                        }`}
                      >
                        <span className="block text-[11px] font-bold text-midnight_text dark:text-white">
                          {m.title}
                        </span>
                        <span className="block text-[10px] text-gray-500 dark:text-gray-400">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              ) : (
              <>
              {/* Multi-Image Cloudinary Upload Slots */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                      Card Photos ({images.length} slots)
                    </label>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Configure individual framing and crop for each card slot.
                    </span>
                  </div>
                  {images.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddImageSlot}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      + Add Photo Slot
                    </button>
                  )}
                </div>

                {/* ── LIVE COMBINED CARD MEDIA FRAME PREVIEW ─────────────── */}
                {images.filter(Boolean).length > 0 && (
                  <div className="p-4 rounded-2xl bg-gray-900 border border-border/60 dark:border-dark_border/60 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                          <span>📱</span>
                          <span>
                            Live Card Output (
                            {imageLayout === "grid_4"
                              ? "4-Quadrant Grid"
                              : imageLayout === "split_vertical_2"
                              ? "Side-by-Side 2 Columns"
                              : imageLayout === "split_horizontal_2"
                              ? "Stacked 2 Rows"
                              : "1 Single Photo"}
                            )
                          </span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                          {imageFit === "contain"
                            ? "Card Fit: Contain (Shows uncropped with gaps)"
                            : imageFit === "portrait_tall"
                            ? "Card Fit: Portrait Tall (3:4)"
                            : "Card Fit: Cover (Fills card frame)"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Mirrors the website card 100% exactly
                      </span>
                    </div>

                    {/* The Frame itself, matching cardAspectClass */}
                    <div className="flex justify-center">
                      <div
                        className={`relative w-full max-w-[320px] ${
                          imageFit === "portrait_tall"
                            ? "aspect-[3/4]"
                            : imageFit === "contain"
                            ? "aspect-[4/4]"
                            : "aspect-[4/3.5]"
                        } rounded-2xl overflow-hidden bg-gray-950 border-2 border-primary/50 shadow-2xl`}
                      >
                        {imageLayout === "grid_4" && images.length >= 3 ? (
                          /* 4 Quadrants */
                          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60">
                            {images.slice(0, 4).map((img, qi) => {
                              const qCrop = imageCrops[qi];
                              const qZoom = qCrop?.zoom || 1;
                              const qOx = qCrop?.ox ?? 50;
                              const qOy = qCrop?.oy ?? 50;
                              const qFit = qCrop?.fit || imageFit;
                              const isContain = qFit === "contain" && qZoom <= 1;

                              return (
                                <div
                                  key={qi}
                                  onClick={() => handleOpenCropModal(qi)}
                                  className="relative w-full h-full overflow-hidden bg-gray-900 group cursor-pointer"
                                  title={`Click to crop Quadrant 0${qi + 1}`}
                                >
                                  {img ? (
                                    <div
                                      className="absolute inset-0 w-full h-full"
                                      style={
                                        qZoom > 1
                                          ? {
                                              transform: `scale(${qZoom})`,
                                              transformOrigin: `${qOx}% ${qOy}%`,
                                            }
                                          : undefined
                                      }
                                    >
                                      <Image
                                        src={getImgPath(img)}
                                        alt={`Quadrant ${qi + 1}`}
                                        fill
                                        unoptimized
                                        style={{ objectPosition: `${qOx}% ${qOy}%` }}
                                        className={
                                          isContain
                                            ? "object-contain p-0.5 bg-gray-50/50 dark:bg-black/20"
                                            : "object-cover object-top"
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                      Empty
                                    </div>
                                  )}
                                  <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold">
                                    Q{qi + 1}
                                  </span>
                                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-bold shadow-xs">
                                      ✂️ Crop
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : imageLayout === "split_vertical_2" && images.length >= 2 ? (
                          /* 2 Columns Side-by-Side */
                          <div className="grid grid-cols-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60">
                            {[0, 1].map((ci) => {
                              const cCrop = imageCrops[ci];
                              const cZoom = cCrop?.zoom || 1;
                              const cOx = cCrop?.ox ?? 50;
                              const cOy = cCrop?.oy ?? 50;
                              const cFit = cCrop?.fit || imageFit;
                              const isContain = cFit === "contain" && cZoom <= 1;
                              const img = images[ci];

                              return (
                                <div
                                  key={ci}
                                  onClick={() => handleOpenCropModal(ci)}
                                  className="relative w-full h-full overflow-hidden bg-gray-900 group cursor-pointer"
                                >
                                  {img ? (
                                    <div
                                      className="absolute inset-0 w-full h-full"
                                      style={
                                        cZoom > 1
                                          ? {
                                              transform: `scale(${cZoom})`,
                                              transformOrigin: `${cOx}% ${cOy}%`,
                                            }
                                          : undefined
                                      }
                                    >
                                      <Image
                                        src={getImgPath(img)}
                                        alt={`Column ${ci + 1}`}
                                        fill
                                        unoptimized
                                        style={{ objectPosition: `${cOx}% ${cOy}%` }}
                                        className={
                                          isContain
                                            ? "object-contain p-0.5 bg-gray-50/50 dark:bg-black/20"
                                            : "object-cover object-top"
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                      Empty
                                    </div>
                                  )}
                                  <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold">
                                    {ci === 0 ? "Left" : "Right"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : imageLayout === "split_horizontal_2" && images.length >= 2 ? (
                          /* 2 Rows Stacked */
                          <div className="grid grid-rows-2 w-full h-full gap-0.5 bg-border/40 dark:bg-dark_border/60">
                            {[0, 1].map((ri) => {
                              const rCrop = imageCrops[ri];
                              const rZoom = rCrop?.zoom || 1;
                              const rOx = rCrop?.ox ?? 50;
                              const rOy = rCrop?.oy ?? 50;
                              const rFit = rCrop?.fit || imageFit;
                              const isContain = rFit === "contain" && rZoom <= 1;
                              const img = images[ri];

                              return (
                                <div
                                  key={ri}
                                  onClick={() => handleOpenCropModal(ri)}
                                  className="relative w-full h-full overflow-hidden bg-gray-900 group cursor-pointer"
                                >
                                  {img ? (
                                    <div
                                      className="absolute inset-0 w-full h-full"
                                      style={
                                        rZoom > 1
                                          ? {
                                              transform: `scale(${rZoom})`,
                                              transformOrigin: `${rOx}% ${rOy}%`,
                                            }
                                          : undefined
                                      }
                                    >
                                      <Image
                                        src={getImgPath(img)}
                                        alt={`Row ${ri + 1}`}
                                        fill
                                        unoptimized
                                        style={{ objectPosition: `${rOx}% ${rOy}%` }}
                                        className={
                                          isContain
                                            ? "object-contain p-0.5 bg-gray-50/50 dark:bg-black/20"
                                            : "object-cover object-top"
                                        }
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                      Empty
                                    </div>
                                  )}
                                  <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold">
                                    {ri === 0 ? "Top" : "Bottom"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* 1 Single Photo */
                          <div
                            onClick={() => handleOpenCropModal(0)}
                            className="relative w-full h-full overflow-hidden bg-gray-900 group cursor-pointer"
                          >
                            {images[0] ? (
                              <div
                                className="absolute inset-0 w-full h-full"
                                style={
                                  (imageCrops[0]?.zoom || 1) > 1
                                    ? {
                                        transform: `scale(${imageCrops[0]!.zoom})`,
                                        transformOrigin: `${imageCrops[0]!.ox}% ${imageCrops[0]!.oy}%`,
                                      }
                                    : undefined
                                }
                              >
                                <Image
                                  src={getImgPath(images[0])}
                                  alt="Single photo"
                                  fill
                                  unoptimized
                                  style={{
                                    objectPosition: `${imageCrops[0]?.ox ?? 50}% ${imageCrops[0]?.oy ?? 50}%`,
                                  }}
                                  className={
                                    (imageCrops[0]?.fit || imageFit) === "contain" && (imageCrops[0]?.zoom || 1) <= 1
                                      ? "object-contain p-1 bg-gray-50/50 dark:bg-black/20"
                                      : "object-cover object-top"
                                  }
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                No image
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── INDIVIDUAL PHOTO SLOTS ────────────────────────────── */}
                {images.map((imgUrl, slotIdx) => {
                  const slotDim = getSlotDimensions(imageLayout, imageFit);
                  const currentCrop = imageCrops[slotIdx];
                  const currentZoom = currentCrop?.zoom || 1;
                  const currentOx = currentCrop?.ox ?? 50;
                  const currentOy = currentCrop?.oy ?? 50;
                  const slotFit: "cover" | "contain" = currentCrop?.fit || (imageFit === "contain" ? "contain" : "cover");
                  const hasEmptyMargins = slotFit === "contain";

                  return (
                    <div
                      key={slotIdx}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-3"
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark dark:text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span>
                            {imageLayout === "split_vertical_2"
                              ? slotIdx === 0
                                ? "Photo 01 (Left Half Column)"
                                : slotIdx === 1
                                ? "Photo 02 (Right Half Column)"
                                : `Photo 0${slotIdx + 1}`
                              : imageLayout === "split_horizontal_2"
                              ? slotIdx === 0
                                ? "Photo 01 (Top Half Row)"
                                : slotIdx === 1
                                ? "Photo 02 (Bottom Half Row)"
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

                      {/* Upload / Image URL Row */}
                      <div className="flex items-center gap-4">
                        {imgUrl ? (
                          isVideoUrl(imgUrl) ? (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-border/60">
                              <video
                                src={getImgPath(imgUrl)}
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-px rounded bg-black/70 text-white text-[8px] font-bold border border-white/20">
                                VIDEO
                              </span>
                            </div>
                          ) : (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-border/60">
                              <Image
                                src={getImgPath(imgUrl)}
                                alt={`Preview ${slotIdx + 1}`}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          )
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-darklight border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                            Empty
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shrink-0">
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
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
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

                      {/* ── ACCURATE LIVE OUTPUT & CROP CONTROLS FOR THIS SLOT ── */}
                      {imgUrl && !isVideoUrl(imgUrl) && (
                        <div className="space-y-2.5 pt-3 border-t border-border/40 dark:border-dark_border/40">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-dark dark:text-white flex items-center gap-1">
                                <span>🎯</span>
                                <span>Live Output (Card Slot Thumbnail View)</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                                {slotDim.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {((currentCrop?.zoom || 1) > 1 || currentCrop?.fit) && (
                                <button
                                  type="button"
                                  onClick={() => updateImageCrop(slotIdx, null)}
                                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  ↺ Reset
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenCropModal(slotIdx)}
                                className="px-2.5 py-1 rounded-lg bg-primary hover:bg-blue-700 text-white text-[11px] font-extrabold cursor-pointer transition shadow-xs flex items-center gap-1"
                              >
                                <span>✂️</span>
                                <span>Crop Photo Tool</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleLiveSaveMedia}
                                disabled={liveSaving || !editingId}
                                title={editingId ? "Save crop to the live card now" : "Save the card once first"}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer transition shadow-xs"
                              >
                                {liveSaving ? "Saving..." : "💾 Live Save"}
                              </button>
                            </div>
                          </div>

                          {/* Live preview + controls row */}
                          <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl bg-white dark:bg-darklight border border-border/60 dark:border-dark_border/60">
                            {/* Live Card Slot Preview Box */}
                            <div className="flex flex-col items-center gap-1.5 shrink-0 mx-auto sm:mx-0">
                              <div
                                style={{
                                  width: slotDim.width,
                                  height: slotDim.height,
                                }}
                                className={`relative rounded-xl overflow-hidden border-2 border-primary/70 shrink-0 shadow-lg ${
                                  hasEmptyMargins
                                    ? "bg-gray-100 dark:bg-gray-900 ring-2 ring-amber-500/60"
                                    : "bg-black"
                                }`}
                              >
                                {/* Visual side-gap background markers matching real card gaps */}
                                {hasEmptyMargins && (
                                  <div className="absolute inset-0 flex justify-between pointer-events-none z-0">
                                    <div className="w-5 h-full bg-amber-400/20 border-r border-amber-500/40 flex items-center justify-center">
                                      <span className="text-[7px] font-black text-amber-600 dark:text-amber-400 -rotate-90 tracking-tighter">
                                        GAP
                                      </span>
                                    </div>
                                    <div className="w-5 h-full bg-amber-400/20 border-l border-amber-500/40 flex items-center justify-center">
                                      <span className="text-[7px] font-black text-amber-600 dark:text-amber-400 -rotate-90 tracking-tighter">
                                        GAP
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div
                                  className="absolute inset-0 w-full h-full z-1"
                                  style={
                                    currentZoom > 1
                                      ? {
                                          transform: `scale(${currentZoom})`,
                                          transformOrigin: `${currentOx}% ${currentOy}%`,
                                        }
                                      : undefined
                                  }
                                >
                                  <Image
                                    src={getImgPath(imgUrl)}
                                    alt="Card slot preview"
                                    fill
                                    unoptimized
                                    style={{
                                      objectPosition: `${currentOx}% ${currentOy}%`,
                                    }}
                                    className={
                                      slotFit === "contain"
                                        ? "object-contain p-0.5"
                                        : "object-cover object-top"
                                    }
                                  />
                                </div>

                                <span
                                  className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide z-10 ${
                                    slotFit === "contain"
                                      ? currentZoom <= 1
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : "bg-blue-600 text-white shadow-xs"
                                      : "bg-black/75 text-white"
                                  }`}
                                >
                                  {slotFit === "contain"
                                    ? currentZoom <= 1
                                      ? "⚠️ SIDE GAPS DETECTED"
                                      : `🔍 ZOOM ${Math.round(currentZoom * 100)}%`
                                    : "✨ FILLED (NO GAPS)"}
                                </span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-semibold text-center">
                                {slotDim.width}×{slotDim.height}px ({slotDim.name})
                              </span>
                            </div>

                            {/* Slot Controls */}
                            <div className="flex-1 w-full space-y-2.5">
                              {/* Notice / Status pill */}
                              {slotFit === "contain" ? (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    {currentZoom <= 1 ? (
                                      <>⚠️ <strong>Contain Mode (depathten his ida):</strong> Photo has side margins. Zoom in to reduce gaps smoothly, or click &apos;⚡ Fill Slot&apos;.</>
                                    ) : (
                                      <>🔍 <strong>Contain Mode (Zoom {Math.round(currentZoom * 100)}%):</strong> Gaps are reducing live as you zoom in.</>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateImageCrop(slotIdx, {
                                        fit: "cover",
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-xs"
                                  >
                                    ⚡ Fill Slot (Switch to Cover)
                                  </button>
                                </div>
                              ) : (
                                <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
                                  <span>
                                    ✨ <strong>Cover Mode:</strong> Slot is filled with zero empty gaps on the website card.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateImageCrop(slotIdx, {
                                        fit: "contain",
                                        zoom: 1,
                                        ox: 50,
                                        oy: 50,
                                      })
                                    }
                                    className="px-2 py-0.5 rounded-md bg-gray-200 dark:bg-darkmode text-gray-700 dark:text-gray-300 text-[10px] font-semibold shrink-0 hover:bg-gray-300 cursor-pointer"
                                  >
                                    Switch to Contain
                                  </button>
                                </div>
                              )}

                              {/* Quick Crop / Fit buttons */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCropModal(slotIdx)}
                                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                                >
                                  <span>✂️</span>
                                  <span>Interactive Crop Modal</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateImageCrop(slotIdx, {
                                      fit: "cover",
                                    })
                                  }
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    slotFit === "cover"
                                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  Fill / Crop (Cover)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateImageCrop(slotIdx, {
                                      fit: "contain",
                                    })
                                  }
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    slotFit === "contain"
                                      ? "bg-primary/10 text-primary font-bold border border-primary/30"
                                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  Fit Whole (Contain)
                                </button>

                                {/* Focal alignments */}
                                <div className="ml-auto flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-gray-400">Focus:</span>
                                  <button
                                    type="button"
                                    onClick={() => updateImageCrop(slotIdx, { ox: 50, oy: 15 })}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Top (Heads/Faces)"
                                  >
                                    Top
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateImageCrop(slotIdx, { ox: 50, oy: 50 })}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Center Focus"
                                  >
                                    Center
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateImageCrop(slotIdx, { ox: 50, oy: 85 })}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                    title="Focus Bottom"
                                  >
                                    Bottom
                                  </button>
                                </div>
                              </div>

                              {/* Sliders: Zoom, Focus X, Focus Y */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40 dark:border-dark_border/40">
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Zoom</span>
                                    <span className="font-bold text-primary">
                                      {Math.round(currentZoom * 100)}%
                                    </span>
                                  </span>
                                  <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={currentZoom}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      updateImageCrop(slotIdx, {
                                        zoom: v,
                                      });
                                    }}
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Focus X</span>
                                    <span className="font-bold text-primary">{currentOx}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={currentOx}
                                    onChange={(e) =>
                                      updateImageCrop(slotIdx, {
                                        ox: Number(e.target.value),
                                      })
                                    }
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                                <label className="space-y-0.5">
                                  <span className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                                    <span>Focus Y</span>
                                    <span className="font-bold text-primary">{currentOy}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={currentOy}
                                    onChange={(e) =>
                                      updateImageCrop(slotIdx, {
                                        oy: Number(e.target.value),
                                      })
                                    }
                                    className="w-full accent-primary cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </>
              )}

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

      {/* Interactive Photo Crop Modal */}
      {cropModalState.isOpen && (
        <PhotoCropModal
          isOpen={cropModalState.isOpen}
          imageUrl={cropModalState.imageUrl}
          slotLabel={cropModalState.slotLabel}
          targetAspectRatio={cropModalState.targetAspectRatio}
          targetRatioName={cropModalState.targetRatioName}
          initialCrop={imageCrops[cropModalState.slotIndex] || null}
          onClose={() => setCropModalState((prev) => ({ ...prev, isOpen: false }))}
          onApplyCrop={(newUrl, crop) => {
            handleApplyCropResult(newUrl, crop);
            setCropModalState((prev) => ({ ...prev, isOpen: false }));
          }}
        />
      )}
    </div>
  );
};

export default PortfolioSectionManager;
