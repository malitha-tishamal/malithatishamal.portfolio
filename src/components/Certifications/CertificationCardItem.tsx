"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CertificationItem, getCertificateImages } from "@/types/certification";
import {
  trackCertificationClick,
  trackCertificationHover,
} from "@/utils/certificationAnalytics";
import toast from "react-hot-toast";

interface CertificationCardItemProps {
  item: CertificationItem;
  onPreview: (item: CertificationItem) => void;
}

export const CertificationCardItem: React.FC<CertificationCardItemProps> = ({
  item,
  onPreview,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  const certificateImages = getCertificateImages(item);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.credentialId) return;
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(item.credentialId);
      setCopied(true);
      toast.success("Credential ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreview = () => {
    trackCertificationClick(item.id);
    onPreview(item);
  };

  const handleCardHover = () => {
    trackCertificationHover(item.id);
  };

  const logoShapeClass =
    item.logoShape === "circle"
      ? "rounded-full"
      : item.logoShape === "square"
      ? "rounded-md"
      : "rounded-xl";

  const isTransparent = !item.logoBgColor || item.logoBgColor === "transparent";
  const isWhite =
    item.logoBgColor?.toLowerCase() === "#ffffff" ||
    item.logoBgColor?.toLowerCase() === "white";
  const customBg = !isTransparent && !isWhite ? item.logoBgColor : undefined;

  const logoContainerCls = `w-11 h-11 ${logoShapeClass} flex items-center justify-center p-1.5 shrink-0 shadow-xs relative overflow-hidden transition-all ${
    isTransparent
      ? "bg-transparent border border-border/80 dark:border-dark_border"
      : isWhite
      ? "bg-white border border-gray-200 dark:border-gray-700/60 shadow-xs"
      : "border border-black/15 dark:border-white/15"
  }`;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const layout = item.certificateImageLayout || (certificateImages.length >= 2 ? "side-by-side" : "single");

  const renderCertificatePreview = () => {
    // 1. Stacked Layout (Top & Bottom / 2 Rows as requested in image 2)
    if (layout === "stacked" && certificateImages.length >= 2) {
      return (
        <div className="grid grid-rows-2 w-full h-full gap-1 bg-border/30 dark:bg-dark_border/50 rounded-lg overflow-hidden p-0.5">
          {certificateImages.slice(0, 2).map((img, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden bg-white/50 dark:bg-darkmode/50 rounded border border-border/40 dark:border-dark_border/40">
              {!imgFailed[idx] ? (
                <Image
                  src={img}
                  alt={`${item.title} - Page ${idx + 1}`}
                  fill
                  className="object-contain p-0.5 group-hover/preview:scale-[1.02] transition duration-300"
                  unoptimized
                  onError={() => setImgFailed((prev) => ({ ...prev, [idx]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                  Page {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // 2. Side-by-Side Layout (Left & Right / 2 Columns as requested in image 1)
    if (layout === "side-by-side" && certificateImages.length >= 2) {
      return (
        <div className="grid grid-cols-2 w-full h-full gap-1 bg-border/30 dark:bg-dark_border/50 rounded-lg overflow-hidden p-0.5">
          {certificateImages.slice(0, 2).map((img, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden bg-white/50 dark:bg-darkmode/50 rounded border border-border/40 dark:border-dark_border/40">
              {!imgFailed[idx] ? (
                <Image
                  src={img}
                  alt={`${item.title} - Page ${idx + 1}`}
                  fill
                  className="object-contain p-0.5 group-hover/preview:scale-[1.02] transition duration-300"
                  unoptimized
                  onError={() => setImgFailed((prev) => ({ ...prev, [idx]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                  Page {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // 3. Tabbed / Paged Layout (or multiple images with active switcher)
    if ((layout === "tabs" || layout === "single") && certificateImages.length > 1) {
      const currentImg = certificateImages[activeImageIndex] || certificateImages[0];
      return (
        <div className="relative w-full h-full">
          {!imgFailed[activeImageIndex] ? (
            <Image
              src={currentImg}
              alt={`${item.title} - Image ${activeImageIndex + 1}`}
              fill
              className="object-contain p-1 group-hover/preview:scale-[1.02] transition duration-300"
              unoptimized
              onError={() => setImgFailed((prev) => ({ ...prev, [activeImageIndex]: true }))}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
              Image {activeImageIndex + 1}
            </div>
          )}

          {/* Quick Page Selector Pills */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1 right-1 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full"
          >
            {certificateImages.map((_, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setActiveImageIndex(pIdx)}
                className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition ${
                  activeImageIndex === pIdx
                    ? "bg-primary text-white"
                    : "bg-white/40 text-white hover:bg-white/70"
                }`}
                title={`Page ${pIdx + 1}`}
              >
                {pIdx + 1}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // 4. Single Image Layout
    if (certificateImages.length === 1 && !imgFailed[0]) {
      return (
        <Image
          src={certificateImages[0]}
          alt={item.title}
          fill
          className="object-contain p-1 group-hover/preview:scale-[1.02] transition duration-300"
          unoptimized
          onError={() => setImgFailed((prev) => ({ ...prev, 0: true }))}
        />
      );
    }

    return (
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-slate-900 dark:via-darkmode dark:to-blue-950/30 p-2.5 flex flex-col justify-between border border-blue-100 dark:border-blue-900/30 text-center select-none">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-800 pb-1">
          <span className="text-[9px] font-bold tracking-widest text-primary uppercase">
            {item.issuer}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">
            {item.issueDate}
          </span>
        </div>
        <div className="py-0.5">
          <p className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">
            Certificate of Achievement
          </p>
          <h4 className="text-[11px] font-bold text-dark dark:text-white line-clamp-1 mt-0.5">
            {item.title}
          </h4>
          <p className="text-[10px] text-primary font-medium mt-0.5">
            Malitha Tishamal
          </p>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-blue-100 dark:border-slate-800 text-[8px] text-gray-400">
          <span>Verified Credential</span>
          <span className="text-emerald-500 font-semibold">✓ Official</span>
        </div>
      </div>
    );
  };

  return (
    <div
      onMouseEnter={handleCardHover}
      className="bg-white dark:bg-darklight rounded-2xl border border-border/80 dark:border-dark_border p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group"
    >
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div
            className={logoContainerCls}
            style={customBg ? { backgroundColor: customBg } : undefined}
          >
            {item.issuerLogo ? (
              <Image
                src={item.issuerLogo}
                alt={item.issuer}
                width={36}
                height={36}
                className="object-contain max-h-full max-w-full"
                unoptimized
              />
            ) : (
              <span className="font-bold text-xs text-gray-700 dark:text-gray-300">CERT</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              onClick={handlePreview}
              className="font-bold text-dark dark:text-white group-hover:text-primary transition-colors text-sm sm:text-base leading-snug line-clamp-2 cursor-pointer"
            >
              {item.title}
            </h3>
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {item.issuer}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-darkmode text-gray-700 dark:text-gray-300 border border-border/60">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Issued {item.issueDate}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="text-xs font-bold">♾</span>
            {item.expirationDate || "No Expiration"}
          </span>
        </div>

        {item.credentialId && (
          <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-darkmode border border-border/60 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-500 shrink-0">ID:</span>
            <span className="font-mono truncate flex-1 text-[11px]">{item.credentialId}</span>
            <button
              onClick={handleCopyId}
              title="Copy ID"
              className="text-[11px] font-bold text-primary hover:underline shrink-0 cursor-pointer"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        )}

        {item.skills && item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50"
              >
                {skill}
              </span>
            ))}
            {item.skills.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-darkmode text-gray-500 border border-border">
                +{item.skills.length - 4}
              </span>
            )}
          </div>
        )}

        <div
          onClick={handlePreview}
          className="relative h-36 sm:h-40 w-full rounded-xl overflow-hidden border border-border/80 dark:border-dark_border mb-3.5 cursor-pointer group/preview bg-slate-900/5 dark:bg-slate-950/40 p-1.5 flex items-center justify-center"
        >
          {renderCertificatePreview()}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-darklight/90 text-dark dark:text-white text-[11px] font-bold shadow-md flex items-center gap-1.5">
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Certificate
            </span>
          </div>
        </div>
      </div>

      <div className="pt-1">
        {item.credentialUrl ? (
          <a
            href={item.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCertificationClick(item.id)}
            className="w-full py-2 px-3 rounded-xl border-2 border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary text-primary hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Show credential</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <button
            onClick={handlePreview}
            className="w-full py-2 px-3 rounded-xl border border-border bg-gray-50 dark:bg-darkmode text-dark dark:text-white font-bold text-xs hover:bg-primary hover:text-white hover:border-primary transition cursor-pointer"
          >
            View Certificate Details
          </button>
        )}
      </div>
    </div>
  );
};
