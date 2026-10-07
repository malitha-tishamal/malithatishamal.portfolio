"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { PortfolioMediaCrop } from "@/types/portfolio";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { getImgPath } from "@/utils/image";
import toast from "react-hot-toast";

interface PhotoCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  slotLabel?: string;
  targetAspectRatio: number; // e.g. 1.0 (square), 0.57 (tall), 1.14 (cover)
  targetRatioName?: string;
  initialCrop?: PortfolioMediaCrop | null;
  onClose: () => void;
  onApplyCrop: (newImageUrl: string, cropData: PortfolioMediaCrop) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageUrl,
  slotLabel = "Photo",
  targetAspectRatio,
  targetRatioName = "Card Slot",
  initialCrop,
  onClose,
  onApplyCrop,
}) => {
  const [zoom, setZoom] = useState<number>(initialCrop?.zoom ?? 1);
  const [ox, setOx] = useState<number>(initialCrop?.ox ?? 50);
  const [oy, setOy] = useState<number>(initialCrop?.oy ?? 50);
  const [fitMode, setFitMode] = useState<"cover" | "contain">(initialCrop?.fit ?? "cover");
  const [aspectRatio, setAspectRatio] = useState<number>(targetAspectRatio || 1);
  const [aspectName, setAspectName] = useState<string>(targetRatioName || "Card Slot");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startOx: number; startOy: number }>({
    x: 0,
    y: 0,
    startOx: 50,
    startOy: 50,
  });

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(initialCrop?.zoom ?? 1);
      setOx(initialCrop?.ox ?? 50);
      setOy(initialCrop?.oy ?? 50);
      setFitMode(initialCrop?.fit ?? "cover");
      setAspectRatio(targetAspectRatio || 1);
      setAspectName(targetRatioName || "Card Slot");
      setIsProcessing(false);
      setUploadPercent(0);
    }
  }, [isOpen, initialCrop, targetAspectRatio, targetRatioName]);

  // Handle Drag to Pan Focal Point
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOx: ox,
      startOy: oy,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      // Invert delta because dragging image right shifts focus left
      const nextOx = Math.min(100, Math.max(0, dragStartRef.current.startOx - dx));
      const nextOy = Math.min(100, Math.max(0, dragStartRef.current.startOy - dy));

      setOx(Math.round(nextOx));
      setOy(Math.round(nextOy));
    },
    [ox, oy]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Touch drag for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      startOx: ox,
      startOy: oy,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1 || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((touch.clientX - dragStartRef.current.x) / rect.width) * 100;
    const dy = ((touch.clientY - dragStartRef.current.y) / rect.height) * 100;

    const nextOx = Math.min(100, Math.max(0, dragStartRef.current.startOx - dx));
    const nextOy = Math.min(100, Math.max(0, dragStartRef.current.startOy - dy));

    setOx(Math.round(nextOx));
    setOy(Math.round(nextOy));
  };

  if (!isOpen || !imageUrl) return null;

  // Aspect ratio presets
  const presets = [
    { name: `Card Slot (${targetRatioName})`, ratio: targetAspectRatio },
    { name: "Square 1:1 (Quadrants)", ratio: 1.0 },
    { name: "Portrait 3:4", ratio: 3 / 4 },
    { name: "Landscape 4:3", ratio: 4 / 3 },
    { name: "16:9 Wide", ratio: 16 / 9 },
  ];

  // Alignment presets
  const setAlignment = (alignOx: number, alignOy: number) => {
    setOx(alignOx);
    setOy(alignOy);
  };

  // Perform permanent Canvas Crop and Upload to Cloudinary
  const handleCropAndSave = async () => {
    setIsProcessing(true);
    setUploadPercent(10);
    toast.loading("Generating cropped image...", { id: "crop-toast" });

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = getImgPath(imageUrl);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image for cropping"));
      });

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      // Desired output aspect ratio
      const targetRatio = aspectRatio;

      // Compute source crop box inside the original image
      let cropW = nw;
      let cropH = nw / targetRatio;

      if (cropH > nh) {
        cropH = nh;
        cropW = nh * targetRatio;
      }

      // Apply zoom (zooming in shrinks the crop window in original image)
      const effectiveZoom = Math.max(1, zoom);
      cropW = cropW / effectiveZoom;
      cropH = cropH / effectiveZoom;

      // Position crop window using focal point (ox, oy in %)
      const maxStartX = nw - cropW;
      const maxStartY = nh - cropH;
      const startX = Math.max(0, Math.min(maxStartX, (ox / 100) * nw - cropW / 2));
      const startY = Math.max(0, Math.min(maxStartY, (oy / 100) * nh - cropH / 2));

      // Output resolution (capped at 1600px max dimension for crisp high quality)
      const maxDim = 1200;
      let outW = cropW;
      let outH = cropH;
      if (outW > maxDim || outH > maxDim) {
        if (outW > outH) {
          outH = Math.round((maxDim * outH) / outW);
          outW = maxDim;
        } else {
          outW = Math.round((maxDim * outW) / outH);
          outH = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(200, Math.round(outW));
      canvas.height = Math.max(200, Math.round(outH));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context");

      // Draw background (in case of transparent PNG)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        img,
        startX,
        startY,
        cropW,
        cropH,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Canvas to blob conversion failed");

      const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });

      toast.loading("Uploading cropped image...", { id: "crop-toast" });
      const uploadRes = await uploadToCloudinary(
        file,
        (percent) => setUploadPercent(percent),
        "image"
      );

      const finalUrl = uploadRes.secure_url || URL.createObjectURL(blob);

      // Reset focal point to center since image is now cropped
      const cropData: PortfolioMediaCrop = {
        zoom: 1,
        ox: 50,
        oy: 50,
        fit: "cover",
      };

      toast.success("Image cropped & updated successfully!", { id: "crop-toast" });
      onApplyCrop(finalUrl, cropData);
      onClose();
    } catch (err: any) {
      console.error("Crop error:", err);
      // Fallback: apply crop coordinates without re-uploading
      const fallbackCropData: PortfolioMediaCrop = {
        zoom,
        ox,
        oy,
        fit: fitMode,
      };
      toast.success("Crop framing applied to card!", { id: "crop-toast" });
      onApplyCrop(imageUrl, fallbackCropData);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Apply framing without re-uploading (just sets zoom, focal point, and fitMode)
  const handleApplyFramingOnly = () => {
    const cropData: PortfolioMediaCrop = {
      zoom,
      ox,
      oy,
      fit: fitMode,
    };
    toast.success("Crop coordinates applied to card!");
    onApplyCrop(imageUrl, cropData);
    onClose();
  };

  // Compute viewport display size maintaining aspect ratio
  const maxViewW = 380;
  const maxViewH = 320;
  let viewW = maxViewW;
  let viewH = Math.round(maxViewW / aspectRatio);
  if (viewH > maxViewH) {
    viewH = maxViewH;
    viewW = Math.round(maxViewH * aspectRatio);
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
      className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-darklight rounded-3xl p-5 sm:p-7 border border-border dark:border-dark_border shadow-2xl my-6 text-midnight_text dark:text-white max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-dark_border/40 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-midnight_text dark:text-white">
                ✂️ Crop Photo: {slotLabel}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {aspectName}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Drag photo to position focal point. Zoom in to fill the slot with zero empty space.
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkmode cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Aspect Ratio Preset Selector */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Crop Aspect Ratio
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = Math.abs(aspectRatio - p.ratio) < 0.05;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setAspectRatio(p.ratio);
                    setAspectName(p.name);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── INTERACTIVE CROP VIEWPORT ─────────────────────── */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-950 border border-border/60 dark:border-dark_border/60 mb-4">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{ width: viewW, height: viewH }}
            className="relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl border-2 border-primary/80 ring-4 ring-primary/20 bg-gray-900"
          >
            {/* The Image inside the crop window */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: zoom > 1 ? `scale(${zoom})` : undefined,
                transformOrigin: `${ox}% ${oy}%`,
                transition: isDraggingRef.current ? "none" : "transform 0.15s ease-out",
              }}
            >
              <Image
                src={getImgPath(imageUrl)}
                alt="Cropping target"
                fill
                unoptimized
                style={{
                  objectPosition: `${ox}% ${oy}%`,
                }}
                className={`w-full h-full pointer-events-none ${
                  fitMode === "contain" && zoom === 1
                    ? "object-contain p-1 bg-gray-900"
                    : "object-cover"
                }`}
              />
            </div>

            {/* Rule of Thirds Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-r border-b border-white/20"></div>
              <div className="border-b border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div className="border-r border-white/20"></div>
              <div></div>
            </div>

            {/* Focal Point Indicator Crosshair */}
            <div
              className="absolute pointer-events-none w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 flex items-center justify-center shadow-lg"
              style={{ left: `${ox}%`, top: `${oy}%` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>
            </div>

            {/* Top-left tag */}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold tracking-wide">
              {fitMode === "cover" || zoom > 1 ? "✂️ FILL SLOT (NO GAPS)" : "🖼️ FULL UNCHECKED"}
            </span>

            {/* Bottom-right hint */}
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-gray-300 text-[9px]">
              Drag to Reposition ({ox}%, {oy}%)
            </span>
          </div>
        </div>

        {/* ── CROP & ZOOM CONTROLS ──────────────────────────── */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border/40 dark:border-dark_border/40 mb-5">
          {/* Zoom Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-gray-700 dark:text-gray-200">🔍 Zoom / Crop Level</span>
              <span className="text-primary font-mono">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">100%</span>
              <input
                type="range"
                min={1}
                max={3.5}
                step={0.05}
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                  if (Number(e.target.value) > 1) {
                    setFitMode("cover");
                  }
                }}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="text-[10px] text-gray-400">350%</span>
            </div>
          </div>

          {/* Fit Mode Toggle & Auto-Fill button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 dark:border-dark_border/40">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFitMode("cover");
                  if (zoom === 1) setZoom(1.05);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  fitMode === "cover"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-gray-200 dark:bg-darklight text-gray-600 dark:text-gray-300 hover:bg-gray-300"
                }`}
              >
                <span>✂️ Crop to Fill</span>
                <span className="text-[9px] font-normal opacity-85">(No empty gaps)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode("contain");
                  setZoom(1);
                  setOx(50);
                  setOy(50);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  fitMode === "contain" && zoom === 1
                    ? "bg-primary text-white shadow-xs"
                    : "bg-gray-200 dark:bg-darklight text-gray-600 dark:text-gray-300 hover:bg-gray-300"
                }`}
              >
                <span>🖼️ Fit Whole</span>
                <span className="text-[9px] font-normal opacity-85">(Uncropped)</span>
              </button>
            </div>

            {/* Quick Focal Alignment */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-400 mr-1">Focus:</span>
              <button
                type="button"
                onClick={() => setAlignment(50, 15)}
                className="px-2 py-1 rounded-md bg-gray-200 dark:bg-darklight text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition cursor-pointer"
                title="Focus on faces / top"
              >
                Top
              </button>
              <button
                type="button"
                onClick={() => setAlignment(50, 50)}
                className="px-2 py-1 rounded-md bg-gray-200 dark:bg-darklight text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition cursor-pointer"
                title="Center focus"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => setAlignment(50, 85)}
                className="px-2 py-1 rounded-md bg-gray-200 dark:bg-darklight text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white transition cursor-pointer"
                title="Bottom focus"
              >
                Bottom
              </button>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isProcessing && uploadPercent > 0 && (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between text-xs text-primary font-bold">
              <span>Uploading cropped image to Cloudinary...</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-darkmode rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-200"
                style={{ width: `${uploadPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40 dark:border-dark_border/40">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              setZoom(1);
              setOx(50);
              setOy(50);
              setFitMode("cover");
            }}
            className="text-xs font-semibold text-gray-500 hover:text-red-500 transition cursor-pointer"
          >
            ↺ Reset Framing
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border dark:border-dark_border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyFramingOnly}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-darkmode hover:bg-gray-300 dark:hover:bg-dark_border text-dark dark:text-white text-xs font-bold transition cursor-pointer"
              title="Apply zoom and focal point without re-encoding image"
            >
              Apply Framing Coordinates
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCropAndSave}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Cropping &amp; Saving...</span>
                </>
              ) : (
                <>
                  <span>✂️ Crop &amp; Save New Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
