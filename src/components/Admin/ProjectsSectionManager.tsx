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
  ProjectItem,
  ProjectImageFit,
  defaultProjects,
  PROJECT_CATEGORIES,
} from "@/types/project";
import {
  PortfolioImageLayout,
  PortfolioMediaType,
  PortfolioMediaCrop,
  PortfolioBlock,
  defaultMediaCrop,
  VideoPlaybackMode,
  isVideoUrl,
} from "@/types/portfolio";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { ProjectCardItem } from "@/components/Projects/ProjectCardItem";
import { ProjectDetailModal } from "@/components/Projects/ProjectDetailModal";
import { getImgPath } from "@/utils/image";
import {
  generateSeoTitle,
  generateSeoDescription,
  generateSeoKeywords,
  generateImageAlt,
} from "@/utils/seo";
import { RichTextEditor } from "./RichTextEditor";
import { PortfolioPageBuilder } from "./PortfolioPageBuilder";
import { PhotoCropModal } from "./PhotoCropModal";
import {
  saveCustomProjectCategory,
  deleteCustomProjectCategory,
  getCombinedProjectCategories,
} from "@/utils/projectCategories";
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

// Firestore setDoc & updateDoc reject `undefined` field values anywhere in the object tree — drop them deeply
export const deepCleanUndefined = <T,>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((v) => v !== undefined)
      .map((v) => deepCleanUndefined(v)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = deepCleanUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
};

const stripUndefined = deepCleanUndefined;

export const ProjectsSectionManager: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All Projects");

  // Preview Modal state
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [liveSaving, setLiveSaving] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("Mobile App");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contentBlocks, setContentBlocks] = useState<PortfolioBlock[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [imageLayout, setImageLayout] = useState<PortfolioImageLayout>("single");
  const [imageFit, setImageFit] = useState<ProjectImageFit>("cover");
  const [detailViewFit, setDetailViewFit] = useState<"contain" | "cover">("contain");
  const [coverImage, setCoverImage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [galleryProgress, setGalleryProgress] = useState<{ [key: number]: number }>({});
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
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
  const [coverCrop, setCoverCrop] = useState<PortfolioMediaCrop>({ ...defaultMediaCrop });
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
    targetAspectRatio: 1.6,
    targetRatioName: "Card Slot",
  });

  // Custom Categories State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState<string>("");
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Links state
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");

  // Real-time Firestore sync for projects
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

  // Subscribe to custom project categories
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "siteContent", "projectCategories"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.categories)) {
            setCustomCategories(data.categories.filter(Boolean));
          }
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Project custom categories listener error:", e);
    }
  }, []);

  const allCategories = getCombinedProjectCategories(customCategories);

  // Category handlers
  const handleCreateCategory = async () => {
    if (!newCategoryInput.trim()) return;
    setSavingCategory(true);
    const res = await saveCustomProjectCategory(newCategoryInput.trim());
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
    const res = await deleteCustomProjectCategory(catToDelete);
    if (res.success) {
      toast.success(res.message);
      if (subtitle === catToDelete) {
        setSubtitle("Mobile App");
      }
    } else {
      toast.error(res.message);
    }
  };

  // Video Upload & Frame Handlers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    setVideoUploadProgress(10);

    try {
      const res = await uploadToCloudinary(
        file,
        (percent: number) => {
          setVideoUploadProgress(percent);
        },
        "video"
      );

      if (res.secure_url) {
        setVideoUrl(res.secure_url);
        setMediaType("video");
        toast.success("Video uploaded to Cloudinary!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(err.message || "Failed to upload video.");
    } finally {
      setIsVideoUploading(false);
      setTimeout(() => setVideoUploadProgress(0), 1000);
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsThumbUploading(true);
    try {
      const res = await uploadToCloudinary(file);
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

  const handleLoadedVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration || 0;
    setVideoDuration(dur);
    if (videoTrimEnd === 0 || videoTrimEnd > dur) {
      setVideoTrimEnd(Math.round(dur * 10) / 10);
    }
  };

  // Main Cover Upload
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
        // Also sync first card photo slot if empty
        if (!images[0]) {
          setImages([res.secure_url]);
        }
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

  // Slot photo upload
  const handleSlotImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress((prev) => ({ ...prev, [index]: 10 }));

    try {
      const res = await uploadToCloudinary(file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [index]: percent }));
      });

      if (res.secure_url) {
        setImages((prev) => {
          const next = [...prev];
          next[index] = res.secure_url;
          return next;
        });
        if (index === 0 && !coverImage) {
          setCoverImage(res.secure_url);
        }
        toast.success(`Photo ${index + 1} uploaded!`);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      console.error("Slot image upload error:", err);
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }, 1000);
    }
  };

  // Card photo slot actions
  const handleAddImageSlot = () => {
    if (images.length >= 4) {
      toast.error("Maximum 4 card photo slots allowed.");
      return;
    }
    setImages((prev) => [...prev, ""]);
    setImageCrops((prev) => [...prev, null]);
  };

  const handleRemoveImageSlot = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageCrops((prev) => prev.filter((_, i) => i !== index));
  };

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

  const updateImageCrop = (index: number, patch: Partial<PortfolioMediaCrop>) => {
    setImageCrops((prev) => {
      const next = [...prev];
      const cur = next[index] || { ...defaultMediaCrop, fit: imageFit === "contain" ? "contain" : "cover" };
      next[index] = { ...cur, ...patch };
      return next;
    });
  };

  // Gallery slots (up to 20 images)
  const handleAddGallerySlot = () => {
    if (galleryImages.length >= 20) {
      toast.error("Maximum 20 screenshot slots allowed per project.");
      return;
    }
    setGalleryImages((prev) => [...prev, ""]);
  };

  const handleRemoveGallerySlot = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveGallerySlot = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

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
        setGalleryImages((prev) => {
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

  // Exact slot dimensions & aspect ratio matching card layout & fit
  const getSlotDimensions = (layout: PortfolioImageLayout, fit: ProjectImageFit) => {
    const baseCardW = 160;
    const baseCardH = fit === "portrait_tall" ? 213 : fit === "contain" ? 160 : 100;

    if (layout === "single") {
      return { width: baseCardW, height: baseCardH, ratio: baseCardW / baseCardH, name: "Full Card Frame (16:10)" };
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
    const url = images[slotIndex] || coverImage;
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
    if (newUrl) {
      setImages((prev) => {
        const next = [...prev];
        next[idx] = newUrl;
        return next;
      });
      if (idx === 0) {
        setCoverImage(newUrl);
        setCoverCrop(cropData);
      }
    }
    updateImageCrop(idx, cropData);
    setCropModalState((p) => ({ ...p, isOpen: false }));
    toast.success("Crop applied cleanly!");
  };

  // Live save current media crops to Firestore
  const handleLiveSaveMedia = async () => {
    if (!editingId) {
      toast.error("Please save the project first before using Live Save.");
      return;
    }
    setLiveSaving(true);
    try {
      const cleanImages = images.filter((img) => img && img.trim().length > 0);
      const payload: Record<string, any> = {
        mediaType,
        imageFit,
        imageLayout,
        detailViewFit,
        coverCrop,
        images: cleanImages,
        imageCrops: cleanImages.map((_, i) => imageCrops[i] || null),
        updatedAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };
      if (coverImage) payload.coverImage = coverImage;
      if (mediaType === "video") {
        payload.videoUrl = videoUrl;
        payload.videoThumbnail = videoThumbnail;
        payload.videoPlaybackMode = videoPlaybackMode;
        payload.videoCrop = videoCrop;
        payload.videoTrim = { start: videoTrimStart, end: videoTrimEnd };
      }
      await updateDoc(doc(db, "projects", editingId), stripUndefined(payload));
      toast.success("Live card updated!");
    } catch (err: any) {
      console.error("Live save error:", err);
      toast.error(err.message || "Failed to live-save media adjustments.");
    } finally {
      setLiveSaving(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("Mobile App");
    setSummary("");
    setDescription("");
    setContentBlocks([]);
    setTagsInput("");
    setCoverImage("");
    setImages([""]);
    setImageLayout("single");
    setImageFit("contain");
    setDetailViewFit("contain");
    setImageCrops([null]);
    setCoverCrop({ ...defaultMediaCrop, fit: "contain" });
    setGalleryImages([]);
    setMediaType("image");
    setVideoUrl("");
    setVideoThumbnail("");
    setVideoPlaybackMode("autoplay_loop");
    setVideoCrop({ ...defaultMediaCrop });
    setVideoTrimStart(0);
    setVideoTrimEnd(0);
    setVideoDuration(0);
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
    setContentBlocks(item.contentBlocks || []);
    setTagsInput(item.tags ? item.tags.join(", ") : "");
    setDisplayOrder(item.displayOrder || 1);
    setCoverImage(item.coverImage || "");

    const baseImages = item.images && item.images.length > 0 ? item.images : (item.coverImage ? [item.coverImage] : [""]);
    setImages(baseImages);
    setImageLayout(item.imageLayout || (baseImages.length >= 4 ? "grid_4" : baseImages.length >= 2 ? "split_horizontal_2" : "single"));
    setImageFit(item.imageFit || "cover");
    setDetailViewFit(item.detailViewFit || (item.imageFit === "contain" ? "contain" : "contain"));

    const crops = item.imageCrops && item.imageCrops.length > 0
      ? item.imageCrops
      : baseImages.map(() => null);
    setImageCrops(crops);
    setCoverCrop(item.coverCrop || { ...defaultMediaCrop, fit: (item.imageFit === "contain" ? "contain" : "cover") as "cover" | "contain" });

    // Additional gallery images (exclude duplicates of card photos if user wants)
    setGalleryImages(item.images && item.images.length > 1 ? item.images.slice(1) : []);

    // Video media support
    const isVid = item.mediaType === "video" || !!item.videoUrl || (baseImages.length === 1 && isVideoUrl(baseImages[0]));
    setMediaType(isVid ? "video" : "image");
    setVideoUrl(item.videoUrl || (isVideoUrl(baseImages[0]) ? baseImages[0] : ""));
    setVideoThumbnail(item.videoThumbnail || "");
    setVideoPlaybackMode(item.videoPlaybackMode || "autoplay_loop");
    setVideoCrop(item.videoCrop || { ...defaultMediaCrop });
    setVideoTrimStart(item.videoTrim?.start || 0);
    setVideoTrimEnd(item.videoTrim?.end || 0);

    // Links
    setProjectUrl(item.projectUrl || "");
    setGithubUrl(item.githubUrl || "");
    setLinkedinUrl(item.linkedinUrl || "");
    setFacebookUrl(item.facebookUrl || "");
    setInstagramUrl(item.instagramUrl || "");
    setYoutubeUrl(item.youtubeUrl || "");

    setCoverProgress(null);
    setGalleryProgress({});
    setIsModalOpen(true);
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

    const validCardImages = images.filter((img) => img && img.trim().length > 0);
    const validGallery = galleryImages.filter((img) => img && img.trim().length > 0);
    const combinedAllImages = Array.from(new Set([...validCardImages, ...validGallery]));

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
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
      tags: cleanTags,
      coverImage: coverImage.trim() || validCardImages[0] || "/images/portfolio/cozycasa.png",
      images: combinedAllImages.length > 0 ? combinedAllImages : [coverImage.trim() || "/images/portfolio/cozycasa.png"],
      imageLayout,
      imageFit,
      detailViewFit,
      coverCrop,
      imageCrops: validCardImages.map((_, i) => imageCrops[i] || null),
      mediaType,
      videoUrl: mediaType === "video" ? videoUrl.trim() : undefined,
      videoThumbnail: mediaType === "video" ? videoThumbnail.trim() : undefined,
      videoPlaybackMode: mediaType === "video" ? videoPlaybackMode : undefined,
      videoTrim: mediaType === "video" && (videoTrimStart > 0 || videoTrimEnd > 0) ? { start: videoTrimStart, end: videoTrimEnd } : undefined,
      videoCrop: mediaType === "video" ? videoCrop : undefined,
      projectUrl: projectUrl.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      displayOrder: Number(displayOrder) || 1,
      seoTitle: generateSeoTitle(title.trim(), subtitle.trim() || "Software System"),
      seoDescription: generateSeoDescription(summary.trim() || description.trim(), title.trim()),
      seoKeywords: generateSeoKeywords(title.trim(), cleanTags, subtitle.trim()),
      altText: generateImageAlt(title.trim(), subtitle.trim()),
      createdAt: editingId
        ? projects.find((p) => p.id === editingId)?.createdAt || nowFormatted
        : nowFormatted,
      updatedAt: nowFormatted,
    };

    try {
      await setDoc(doc(db, "projects", id), stripUndefined(itemData));
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
        displayOrder: targetOrder,
      }, { merge: true });
      await setDoc(doc(db, "projects", targetItem.id), {
        displayOrder: currentOrder,
      }, { merge: true });
      toast.success("Order updated!");
    } catch (err: any) {
      toast.error("Failed to reorder projects.");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategoryFilter === "All Projects" ||
      (p.subtitle || "").toLowerCase() === selectedCategoryFilter.toLowerCase();

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-primary/10 via-blue-50/50 to-transparent dark:from-primary/20 dark:via-darkmode border border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Engineering &amp; Innovation
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-midnight_text dark:text-white">
            Projects Section Manager
          </h2>
          <p className="text-xs sm:text-sm text-grey dark:text-gray-300 font-medium mt-1 max-w-2xl">
            Manage production software platforms, multi-image layouts, rich case studies, and live deployment repositories.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
        >
          <span className="text-base font-black">+</span>
          <span>Add New Project</span>
        </button>
      </div>

      {/* Category Pills & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border/70 dark:border-dark_border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search projects by title, category, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-dark dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All Projects")}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              selectedCategoryFilter === "All Projects"
                ? "bg-primary text-white shadow-xs"
                : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            All Projects ({projects.length})
          </button>
          {allCategories.map((cat) => {
            const count = projects.filter(
              (p) => (p.subtitle || "").toLowerCase() === cat.toLowerCase()
            ).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? "bg-primary text-white shadow-xs"
                    : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 rounded-3xl bg-gray-100 dark:bg-darklight animate-pulse border border-border/40"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-darklight rounded-3xl border border-dashed border-border dark:border-dark_border space-y-3">
          <div className="text-4xl">🚀</div>
          <h4 className="text-base font-bold text-dark dark:text-white">
            No engineering projects found
          </h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? "No projects match your current filter or search query."
              : "Create your first engineering project showcase to display on the live website."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
          >
            + Add New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((item, idx) => (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-darklight rounded-3xl border border-border/70 dark:border-dark_border p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Order #{item.displayOrder || idx + 1}
                  </span>

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

                {/* Card Preview */}
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
          <div className="relative w-full max-w-3xl bg-white dark:bg-darklight rounded-3xl p-6 sm:p-8 border border-border dark:border-dark_border shadow-2xl my-8 text-midnight_text dark:text-white max-h-[92vh] overflow-y-auto animate-in fade-in duration-200">
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
              Configure project title, category, rich details, interactive crop &amp; zoom, screenshot gallery, and page builder.
            </p>

            <form onSubmit={handleSave} className="space-y-6">
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider">
                      Category Tag / Filter *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory((v) => !v)}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {isAddingCategory ? "Close" : "+ Add Custom Category"}
                    </button>
                  </div>

                  {isAddingCategory && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <input
                        type="text"
                        placeholder="New category name..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-primary/40 bg-white dark:bg-darkmode text-dark dark:text-white"
                      />
                      <button
                        type="button"
                        disabled={savingCategory || !newCategoryInput.trim()}
                        onClick={handleCreateCategory}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {savingCategory ? "Saving..." : "Add"}
                      </button>
                    </div>
                  )}

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
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {allCategories.map((cat) => (
                        <div key={cat} className="inline-flex items-center gap-0.5">
                          <button
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
                          {customCategories.includes(cat) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-[9px] text-red-400 hover:text-red-600 px-0.5 cursor-pointer"
                              title="Delete custom category"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Short Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Short Card Summary (1-2 sentences displayed on card)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cross-platform antimicrobial stewardship & dose calculation app."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Row 3: Full Detailed Paragraph / Architecture (Rich Text Editor) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Full Project Description (Rich Text Overview &amp; Architecture)
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Explain background, architectural diagrams, technology implementation, results, lists, code snippets..."
                />
              </div>

              {/* Row 4: Custom Web-Page Detail Builder */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-darkmode border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary">
                      Custom Web-Page Detail Builder ({contentBlocks.length} blocks)
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Build full web-page-like case studies with Headings, Rich Paragraphs, Videos, and Image Galleries.
                    </p>
                  </div>
                  {contentBlocks.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setContentBlocks([
                          {
                            id: `blk_${Date.now()}_1`,
                            type: "heading",
                            text: "System Architecture & Engineering Overview",
                          },
                          {
                            id: `blk_${Date.now()}_2`,
                            type: "text",
                            html: "<p>Detailed description of the technology implementation...</p>",
                          },
                        ])
                      }
                      className="px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold cursor-pointer"
                    >
                      + Start Page Builder
                    </button>
                  )}
                </div>

                {contentBlocks.length > 0 && (
                  <PortfolioPageBuilder
                    blocks={contentBlocks}
                    onChange={setContentBlocks}
                  />
                )}
              </div>

              {/* Row 5: Technologies / Tags & Display Order */}
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

              {/* Row 6: Media Type Selector (Photo vs Video) */}
              <div className="pt-2 border-t border-border/40 dark:border-dark_border/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                    Card Showcase Media Type
                  </span>
                  <div className="flex items-center bg-gray-100 dark:bg-darkmode p-1 rounded-xl border border-border/40">
                    <button
                      type="button"
                      onClick={() => setMediaType("image")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        mediaType === "image"
                          ? "bg-white dark:bg-darklight text-primary shadow-xs"
                          : "text-gray-500 hover:text-dark dark:hover:text-white"
                      }`}
                    >
                      🖼️ Photos &amp; Screenshots
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType("video")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        mediaType === "video"
                          ? "bg-white dark:bg-darklight text-primary shadow-xs"
                          : "text-gray-500 hover:text-dark dark:hover:text-white"
                      }`}
                    >
                      🎬 Video Media Showcase
                    </button>
                  </div>
                </div>

                {/* ── PHOTO MEDIA SECTION ─────────────────────────────────── */}
                {mediaType === "image" ? (
                  <div className="space-y-4">
                    {/* Layout & Fit Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60">
                      {/* Image Layout */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                          Card Photos Layout
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "single", label: "1 Single Photo" },
                            { id: "split_horizontal_2", label: "2 Rows (Stacked)" },
                            { id: "split_vertical_2", label: "2 Columns (Side)" },
                            { id: "grid_4", label: "4 Quadrants (Grid)" },
                          ].map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setImageLayout(l.id as PortfolioImageLayout)}
                              className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                                imageLayout === l.id
                                  ? "border-primary bg-primary/10 text-primary font-bold"
                                  : "border-border dark:border-dark_border hover:bg-gray-100"
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Card Fit */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                          Card Framing / Fit Mode
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { id: "contain", label: "Fit Whole (Contain - No Side Crop)", hint: "Shows complete screenshot without cutting edges" },
                            { id: "cover", label: "Fill / Crop (Cover)", hint: "Fills card frame completely" },
                            { id: "portrait_tall", label: "Portrait Tall (3:4)", hint: "For mobile phone portrait app screenshots" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setImageFit(f.id as ProjectImageFit);
                                setCoverCrop((p) => ({ ...p, fit: f.id === "contain" ? "contain" : "cover" }));
                              }}
                              className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                                imageFit === f.id
                                  ? "border-primary bg-primary/10 text-primary font-bold"
                                  : "border-border dark:border-dark_border hover:bg-gray-100"
                              }`}
                            >
                              <div className="text-xs font-bold">{f.label}</div>
                              <div className="text-[10px] text-gray-400">{f.hint}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Detail Modal Default Photo View (Popup View Style) */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                          Detail Modal Default Photo View (Popup View Style)
                        </label>
                        <span className="text-[10px] text-gray-400">
                          Controls default view when visitor clicks card
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDetailViewFit("contain")}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            detailViewFit === "contain"
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                              : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🖼️</span>
                            <span className="text-xs font-bold text-midnight_text dark:text-white">Full View (No Crop)</span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            Shows 100% of entire photo without cutting edges (Contain mode).
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailViewFit("cover")}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                            detailViewFit === "cover"
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20"
                              : "border-border dark:border-dark_border hover:border-gray-400 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">📐</span>
                            <span className="text-xs font-bold text-midnight_text dark:text-white">Fill Grid (Crop View)</span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            Fills the modal gallery tiles edge-to-edge (Cover mode).
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Live Combined Card Frame Preview */}
                    {images.filter(Boolean).length > 0 && (
                      <div className="p-4 rounded-2xl bg-gray-900 border border-border/60 text-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                            <span>📱</span>
                            <span>Live Card Output (Mirrors website card 100% exactly)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                            {imageFit === "contain"
                              ? "Fit: Contain (No Crop)"
                              : imageFit === "portrait_tall"
                              ? "Fit: Portrait Tall (3:4)"
                              : "Fit: Cover (Filled)"}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <div
                            className={`relative w-full max-w-[320px] ${
                              imageFit === "portrait_tall"
                                ? "aspect-[3/4]"
                                : "aspect-[16/10]"
                            } rounded-2xl overflow-hidden bg-gray-950 border-2 border-primary/50 shadow-2xl`}
                          >
                            <div
                              onClick={() => handleOpenCropModal(0)}
                              className="relative w-full h-full overflow-hidden bg-gray-900 group cursor-pointer"
                            >
                              {images[0] ? (
                                <div
                                  className="absolute inset-0 w-full h-full"
                                  style={
                                    (coverCrop.zoom || 1) > 1
                                      ? {
                                          transform: `scale(${coverCrop.zoom})`,
                                          transformOrigin: `${coverCrop.ox}% ${coverCrop.oy}%`,
                                        }
                                      : undefined
                                  }
                                >
                                  <Image
                                    src={getImgPath(images[0])}
                                    alt="Live card preview"
                                    fill
                                    unoptimized
                                    style={{
                                      objectPosition: `${coverCrop.ox}% ${coverCrop.oy}%`,
                                    }}
                                    className={
                                      imageFit === "contain"
                                        ? "object-contain p-1 bg-black"
                                        : "object-cover object-top"
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                  No image
                                </div>
                              )}
                              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-2 py-1 rounded bg-primary text-white text-[10px] font-bold shadow-xs">
                                  ✂️ Click to Open Crop Tool
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Photo Slots */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                          Card Photo Slots ({images.length} slots)
                        </label>
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

                      {images.map((imgUrl, slotIdx) => {
                        const slotDim = getSlotDimensions(imageLayout, imageFit);
                        const currentCrop = slotIdx === 0 ? coverCrop : (imageCrops[slotIdx] || defaultMediaCrop);
                        const currentZoom = currentCrop?.zoom || 1;
                        const currentOx = currentCrop?.ox ?? 50;
                        const currentOy = currentCrop?.oy ?? 50;
                        const slotFit = currentCrop?.fit || (imageFit === "contain" ? "contain" : "cover");

                        return (
                          <div
                            key={slotIdx}
                            className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-dark dark:text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span>Photo #{slotIdx + 1} {slotIdx === 0 ? "(Main Card Cover)" : ""}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={slotIdx === 0}
                                  onClick={() => handleMoveImage(slotIdx, "up")}
                                  className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={slotIdx === images.length - 1}
                                  onClick={() => handleMoveImage(slotIdx, "down")}
                                  className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                                >
                                  ▼
                                </button>
                                {images.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageSlot(slotIdx)}
                                    className="p-1 text-xs text-red-500 hover:text-red-700 cursor-pointer ml-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Upload Row */}
                            <div className="flex items-center gap-4">
                              {imgUrl ? (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-border/60">
                                  <Image
                                    src={getImgPath(imgUrl)}
                                    alt={`Slot ${slotIdx + 1}`}
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
                                      if (slotIdx === 0) setCoverImage(val);
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                                  />
                                </div>

                                {uploadProgress[slotIdx] !== undefined && (
                                  <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-primary h-full transition-all duration-200"
                                      style={{ width: `${uploadProgress[slotIdx]}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Slot Live Preview & Crop Controls */}
                            {imgUrl && (
                              <div className="space-y-2.5 pt-3 border-t border-border/40 dark:border-dark_border/40">
                                <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl bg-white dark:bg-darklight border border-border/60">
                                  {/* Thumbnail Preview */}
                                  <div className="flex flex-col items-center gap-1.5 shrink-0 mx-auto sm:mx-0">
                                    <div
                                      style={{
                                        width: slotDim.width,
                                        height: slotDim.height,
                                      }}
                                      className={`relative rounded-xl overflow-hidden border-2 border-primary/70 shrink-0 shadow-lg ${
                                        slotFit === "contain"
                                          ? "bg-black ring-2 ring-emerald-500/60"
                                          : "bg-black"
                                      }`}
                                    >
                                      <div
                                        className="absolute inset-0 w-full h-full z-1"
                                        style={
                                          currentZoom !== 1
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
                                            objectPosition: slotFit === "contain" && currentZoom <= 1 ? "center center" : `${currentOx}% ${currentOy}%`,
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
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-black/75 text-white"
                                        }`}
                                      >
                                        {slotFit === "contain"
                                          ? "✨ FIT WHOLE"
                                          : "⚡ FILL / CROP"}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-semibold text-center">
                                      {slotDim.width}×{slotDim.height}px ({slotDim.name})
                                    </span>
                                  </div>

                                  {/* Slot Controls */}
                                  <div className="flex-1 w-full space-y-2.5">
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
                                        onClick={() => {
                                          if (slotIdx === 0) setCoverCrop((p) => ({ ...p, fit: "contain" }));
                                          updateImageCrop(slotIdx, { fit: "contain" });
                                        }}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                          slotFit === "contain"
                                            ? "bg-emerald-500 text-white font-bold"
                                            : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                        }`}
                                      >
                                        Fit Whole (Contain)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (slotIdx === 0) setCoverCrop((p) => ({ ...p, fit: "cover" }));
                                          updateImageCrop(slotIdx, { fit: "cover" });
                                        }}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                          slotFit === "cover"
                                            ? "bg-primary text-white font-bold"
                                            : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300"
                                        }`}
                                      >
                                        Fill / Crop (Cover)
                                      </button>

                                      {/* Focal Alignments */}
                                      <div className="ml-auto flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-gray-400">Focus:</span>
                                        {[
                                          { label: "Top", ox: 50, oy: 15 },
                                          { label: "Center", ox: 50, oy: 50 },
                                          { label: "Bottom", ox: 50, oy: 85 },
                                        ].map((fp) => (
                                          <button
                                            key={fp.label}
                                            type="button"
                                            onClick={() => {
                                              if (slotIdx === 0) setCoverCrop((p) => ({ ...p, ox: fp.ox, oy: fp.oy }));
                                              updateImageCrop(slotIdx, { ox: fp.ox, oy: fp.oy });
                                            }}
                                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-darkmode hover:bg-primary hover:text-white transition cursor-pointer"
                                          >
                                            {fp.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Sliders: Zoom, Focus X, Focus Y */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40">
                                      <label className="space-y-0.5">
                                        <span className="flex justify-between text-[10px] text-gray-500">
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
                                            if (slotIdx === 0) setCoverCrop((p) => ({ ...p, zoom: v }));
                                            updateImageCrop(slotIdx, { zoom: v });
                                          }}
                                          className="w-full accent-primary cursor-pointer"
                                        />
                                      </label>
                                      <label className="space-y-0.5">
                                        <span className="flex justify-between text-[10px] text-gray-500">
                                          <span>Focus X</span>
                                          <span className="font-bold text-primary">{currentOx}%</span>
                                        </span>
                                        <input
                                          type="range"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={currentOx}
                                          onChange={(e) => {
                                            const v = Number(e.target.value);
                                            if (slotIdx === 0) setCoverCrop((p) => ({ ...p, ox: v }));
                                            updateImageCrop(slotIdx, { ox: v });
                                          }}
                                          className="w-full accent-primary cursor-pointer"
                                        />
                                      </label>
                                      <label className="space-y-0.5">
                                        <span className="flex justify-between text-[10px] text-gray-500">
                                          <span>Focus Y</span>
                                          <span className="font-bold text-primary">{currentOy}%</span>
                                        </span>
                                        <input
                                          type="range"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={currentOy}
                                          onChange={(e) => {
                                            const v = Number(e.target.value);
                                            if (slotIdx === 0) setCoverCrop((p) => ({ ...p, oy: v }));
                                            updateImageCrop(slotIdx, { oy: v });
                                          }}
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
                  </div>
                ) : (
                  /* ── VIDEO MEDIA SECTION ─────────────────────────────────── */
                  <div className="space-y-4 pt-2">
                    {/* Video Upload + URL */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                          Project Video File (Cloudinary / MP4)
                        </label>
                        <span className="text-[10px] text-gray-500">
                          Direct video showcase for software demo &amp; mobile recording
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shrink-0">
                          {isVideoUploading ? "Uploading..." : "Upload Video File"}
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoUpload}
                          />
                        </label>
                        <input
                          type="url"
                          placeholder="or paste Cloudinary / MP4 Video URL"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                        />
                      </div>

                      {videoUploadProgress > 0 && (
                        <div className="w-full bg-gray-200 dark:bg-darklight rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-200"
                            style={{ width: `${videoUploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Live Video Slot Preview Frame */}
                    {videoUrl && (
                      <div className="p-4 rounded-2xl bg-gray-900 border border-border/60 text-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                            <span>🎬</span>
                            <span>Live Card Video Output</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                            {imageFit === "contain" ? "Contain (No Crop)" : "Cover (Fills Card)"}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <div
                            className={`relative w-full max-w-[320px] ${
                              imageFit === "portrait_tall"
                                ? "aspect-[3/4]"
                                : "aspect-[16/10]"
                            } rounded-2xl overflow-hidden bg-gray-950 border-2 border-primary/50 shadow-2xl`}
                          >
                            <div
                              className="absolute inset-0 w-full h-full"
                              style={
                                (videoCrop.zoom || 1) !== 1
                                  ? {
                                      transform: `scale(${videoCrop.zoom})`,
                                      transformOrigin: `${videoCrop.ox}% ${videoCrop.oy}%`,
                                    }
                                  : undefined
                              }
                            >
                              <video
                                ref={previewVideoRef}
                                src={getImgPath(videoUrl)}
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                                onLoadedMetadata={handleLoadedVideoMetadata}
                                style={{
                                  objectPosition: `${videoCrop.ox}% ${videoCrop.oy}%`,
                                }}
                                className={
                                  videoCrop.fit === "contain"
                                    ? "w-full h-full object-contain p-1 bg-black"
                                    : "w-full h-full object-cover"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video Thumbnail & Playback Settings */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                          Video Thumbnail &amp; Poster Image
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shrink-0">
                          {isThumbUploading ? "Uploading..." : "Upload Poster Image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbUpload}
                          />
                        </label>
                        <input
                          type="url"
                          placeholder="or paste Thumbnail Image URL"
                          value={videoThumbnail}
                          onChange={(e) => setVideoThumbnail(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                        />
                      </div>

                      {/* Playback mode setting */}
                      <div>
                        <label className="block text-[11px] font-bold mb-1.5 text-dark dark:text-white">
                          Card Video Playback Mode
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { id: "autoplay_loop", title: "Autoplay & Loop", desc: "Plays continuously on card" },
                            { id: "autoplay_once", title: "Play Once + Replay", desc: "Plays once, then replay button appears" },
                            { id: "hover_play", title: "Play on Hover", desc: "Plays only while cursor is over card" },
                            { id: "thumbnail_only", title: "Thumbnail Only", desc: "Static image on card; video plays in modal" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setVideoPlaybackMode(m.id as VideoPlaybackMode)}
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

                      {/* Video Trim Sliders */}
                      {videoDuration > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span>Video Trim Window (Duration: {fmtTime(videoDuration)})</span>
                            <span className="text-primary">
                              {fmtTime(videoTrimStart)} → {fmtTime(videoTrimEnd || videoDuration)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-[10px] text-gray-500 space-y-1">
                              <span>Start Second ({videoTrimStart}s)</span>
                              <input
                                type="range"
                                min={0}
                                max={videoDuration}
                                step={0.5}
                                value={videoTrimStart}
                                onChange={(e) => setVideoTrimStart(Number(e.target.value))}
                                className="w-full accent-primary"
                              />
                            </label>
                            <label className="text-[10px] text-gray-500 space-y-1">
                              <span>End Second ({videoTrimEnd || Math.round(videoDuration)}s)</span>
                              <input
                                type="range"
                                min={0}
                                max={videoDuration}
                                step={0.5}
                                value={videoTrimEnd || videoDuration}
                                onChange={(e) => setVideoTrimEnd(Number(e.target.value))}
                                className="w-full accent-primary"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 7: Additional Screenshots & Photos Gallery (10–20 Slots) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark dark:text-white">
                    Additional Screenshots &amp; Photos Gallery ({galleryImages.length} slots)
                  </label>
                  {galleryImages.length < 20 && (
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
                  {galleryImages.map((imgUrl, slotIdx) => (
                    <div
                      key={slotIdx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-darkmode border border-border/60 flex items-center gap-3"
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
                          <label className="px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold cursor-pointer transition border border-primary/20 shrink-0">
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
                              setGalleryImages((prev) => {
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
                          disabled={slotIdx === galleryImages.length - 1}
                          onClick={() => handleMoveGallerySlot(slotIdx, "down")}
                          className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGallerySlot(slotIdx)}
                          className="p-1 text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 8: Live Project & GitHub */}
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

              {/* Row 9: Social Links (LinkedIn, Facebook, Instagram, YouTube) */}
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

              {/* Submit Buttons + Live Save */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40 dark:border-dark_border/40">
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleLiveSaveMedia}
                      disabled={liveSaving}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {liveSaving ? "Live Saving..." : "💾 Live Save Changes"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO CROP MODAL */}
      <PhotoCropModal
        isOpen={cropModalState.isOpen}
        imageUrl={cropModalState.imageUrl}
        slotLabel={cropModalState.slotLabel}
        targetAspectRatio={cropModalState.targetAspectRatio}
        targetRatioName={cropModalState.targetRatioName}
        initialCrop={
          cropModalState.slotIndex === 0
            ? coverCrop
            : imageCrops[cropModalState.slotIndex]
        }
        onClose={() => setCropModalState((p) => ({ ...p, isOpen: false }))}
        onApplyCrop={handleApplyCropResult}
      />
    </div>
  );
};

export default ProjectsSectionManager;
