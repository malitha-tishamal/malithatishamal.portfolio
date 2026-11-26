"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { CertificationItem, getCertificateImages } from "@/types/certification";
import {
  trackCertificationClick,
  trackCertificationHover,
} from "@/utils/certificationAnalytics";
import { splitVisibleTags } from "@/components/SharedComponent/MarqueeRows/ContentCard";
import { RelativeTimePill } from "@/components/SharedComponent/RelativeTimePill";
import {
  formatCertificateDate,
  formatCertificateExpiry,
  getCertificateIssueDate,
} from "@/utils/certificateDate";

/** Fixed card width used by the marquee; tablet ~380px, desktop ~470px (~15% smaller) */
export const CERT_CARD_WIDTH = "w-[85vw] sm:w-[380px] xl:w-[470px]";

const CARD_SIZES = "(max-width: 640px) 85vw, (max-width: 1280px) 380px, 470px";
const TAG_BUDGET = 72;

interface CertificationCardItemProps {
  item: CertificationItem;
  onPreview: (item: CertificationItem) => void;
  /** One of the six newest certificates → blue "Latest · …" pill. */
  latest?: boolean;
  widthClass?: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export const CertificationCardItem: React.FC<CertificationCardItemProps> = ({
  item,
  onPreview,
  latest = false,
  widthClass = "w-full",
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const certificateImages = getCertificateImages(item);
  const { visible: visibleTags, hidden: hiddenTags } = splitVisibleTags(
    item.skills || [],
    8,
    TAG_BUDGET
  );

  const issueLabel = formatCertificateDate(item.issueDate);
  const expiryLabel = formatCertificateExpiry(item.expirationDate);

  const handlePreview = useCallback(() => {
    trackCertificationClick(item.id);
    onPreview(item);
  }, [item, onPreview]);

  const handleCopyId = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!item.credentialId) return;
    const ok = await copyToClipboard(item.credentialId);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

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

  const logoContainerCls = `h-12 w-12 ${logoShapeClass} flex shrink-0 items-center justify-center overflow-hidden p-1.5 shadow-xs transition-all ${
    isTransparent
      ? "border border-border/80 bg-transparent dark:border-dark_border"
      : isWhite
        ? "border border-gray-200 bg-white dark:border-gray-700/60"
        : "border border-black/15 dark:border-white/15"
  }`;

  const layout =
    item.certificateImageLayout || (certificateImages.length >= 2 ? "side-by-side" : "single");

  const renderSlot = (src: string, idx: number) => (
    <div
      key={`${src}-${idx}`}
      className="relative h-full w-full overflow-hidden rounded border border-border/40 bg-white/50 dark:border-dark_border/40 dark:bg-darkmode/50"
    >
      {!imgFailed[idx] ? (
        <Image
          src={src}
          alt={`${item.title} - Page ${idx + 1}`}
          fill
          sizes={CARD_SIZES}
          loading="lazy"
          className="object-contain p-0.5 transition duration-300 group-hover/preview:scale-[1.02]"
          onError={() => setImgFailed((prev) => ({ ...prev, [idx]: true }))}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400">
          Page {idx + 1}
        </div>
      )}
    </div>
  );

  const renderCertificatePreview = () => {
    if (layout === "stacked" && certificateImages.length >= 2) {
      return (
        <div className="grid h-full w-full grid-rows-2 gap-1 overflow-hidden rounded-lg">
          {certificateImages.slice(0, 2).map((src, idx) => renderSlot(src, idx))}
        </div>
      );
    }

    if (layout === "side-by-side" && certificateImages.length >= 2) {
      return (
        <div className="grid h-full w-full grid-cols-2 gap-1 overflow-hidden rounded-lg">
          {certificateImages.slice(0, 2).map((src, idx) => renderSlot(src, idx))}
        </div>
      );
    }

    if ((layout === "tabs" || layout === "single") && certificateImages.length > 1) {
      const currentImg = certificateImages[activeImageIndex] || certificateImages[0];
      return (
        <div className="relative h-full w-full">
          {!imgFailed[activeImageIndex] ? (
            <Image
              src={currentImg}
              alt={`${item.title} - Image ${activeImageIndex + 1}`}
              fill
              sizes={CARD_SIZES}
              loading="lazy"
              className="object-contain p-1 transition duration-300 group-hover/preview:scale-[1.02]"
              onError={() => setImgFailed((prev) => ({ ...prev, [activeImageIndex]: true }))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400">
              Image {activeImageIndex + 1}
            </div>
          )}

          <div
            onClick={stop}
            className="absolute right-1 bottom-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-xs"
          >
            {certificateImages.map((_, pageIndex) => (
              <button
                key={pageIndex}
                type="button"
                onClick={() => setActiveImageIndex(pageIndex)}
                aria-label={`Show page ${pageIndex + 1}`}
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition ${
                  activeImageIndex === pageIndex
                    ? "bg-primary text-white"
                    : "bg-white/40 text-white hover:bg-white/70"
                }`}
              >
                {pageIndex + 1}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (certificateImages.length === 1 && !imgFailed[0]) {
      return (
        <Image
          src={certificateImages[0]}
          alt={item.title}
          fill
          sizes={CARD_SIZES}
          loading="lazy"
          className="object-contain p-1 transition duration-300 group-hover/preview:scale-[1.02]"
          onError={() => setImgFailed((prev) => ({ ...prev, 0: true }))}
        />
      );
    }

    return (
      <div className="flex h-full w-full flex-col justify-between rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 p-2.5 text-center select-none dark:border-blue-900/30 dark:from-slate-900 dark:via-darkmode dark:to-blue-950/30">
        <div className="flex items-center justify-between border-b border-blue-100 pb-1 dark:border-slate-800">
          <span className="truncate text-[9px] font-bold tracking-widest text-primary uppercase">
            {item.issuer}
          </span>
          <span className="shrink-0 font-mono text-[9px] text-gray-400">{issueLabel}</span>
        </div>
        <div className="py-0.5">
          <p className="text-[9px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            Certificate of Achievement
          </p>
          <h4 className="mt-0.5 line-clamp-1 text-[11px] font-bold text-dark dark:text-white">
            {item.title}
          </h4>
          <p className="mt-0.5 text-[10px] font-medium text-primary">Malitha Tishamal</p>
        </div>
        <div className="flex items-center justify-between border-t border-blue-100 pt-1 text-[8px] text-gray-400 dark:border-slate-800">
          <span>Verified Credential</span>
          <span className="font-semibold text-emerald-500">✓ Official</span>
        </div>
      </div>
    );
  };

  return (
    <article
      onMouseEnter={() => trackCertificationHover(item.id)}
      data-content-card=""
      style={
        {
          "--card-width": "470px",
          "--card-pad": "20px",
          "--preview-height": "220px",
        } as React.CSSProperties
      }
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 bg-white p-5 shadow-xs transition-shadow duration-300 hover:shadow-2xl dark:border-dark_border dark:bg-darklight ${widthClass} ${className}`}
    >
      {/* Stretched primary action. Real <button>, so the article keeps its
          landmark semantics and nested controls stay separate. */}
      <button
        type="button"
        onClick={handlePreview}
        aria-label={`View certificate details for ${item.title}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-3xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden"
      />

      {/* Header — logo, two-line title (reserved 2 lines), one-line issuer */}
      <div className="mb-3 flex h-[76px] shrink-0 items-start gap-3">
        <div
          className={logoContainerCls}
          style={customBg ? { backgroundColor: customBg } : undefined}
        >
          {item.issuerLogo ? (
            <Image
              src={item.issuerLogo}
              alt=""
              width={36}
              height={36}
              className="max-h-full max-w-full object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">CERT</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-h-[calc(2*1.3em)] h-[calc(2*1.3em)] overflow-hidden flex flex-col justify-start">
            <h3
              title={item.title}
              className="line-clamp-2 text-[16px] sm:text-[17px] xl:text-[19px] leading-[1.3] font-bold break-words text-midnight_text transition-colors group-hover:text-primary dark:text-white"
            >
              {item.title}
            </h3>
          </div>
          <p
            title={item.issuer}
            className="mt-1 truncate h-5 flex items-center text-[13px] sm:text-[14px] font-medium text-gray-500 dark:text-gray-400"
          >
            {item.issuer}
          </p>
        </div>
      </div>

      {/* Meta row — issued date + expiry, exactly one line, 13px chips */}
      <div className="mb-2.5 flex h-[28px] shrink-0 items-center gap-1.5 overflow-hidden text-[12px] sm:text-[13px]">
        <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-border/60 bg-gray-100 px-2.5 py-0.5 font-semibold text-gray-700 dark:border-dark_border dark:bg-darkmode dark:text-gray-300">
          <svg
            className="h-3 w-3 shrink-0 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="truncate">Issued {issueLabel}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
          <span className="text-xs font-bold">∞</span>
          <span>{expiryLabel}</span>
        </span>
      </div>

      {/* Credential ID — fixed 32px height, 13px font */}
      <div className="mb-2.5 flex h-[32px] shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-gray-50 px-2.5 text-[12px] sm:text-[13px] dark:border-dark_border dark:bg-darkmode">
        <span className="shrink-0 font-semibold text-gray-500">ID:</span>
        {item.credentialId ? (
          <>
            <span
              title={item.credentialId}
              className="min-w-0 flex-1 truncate font-mono text-[12px] sm:text-[13px] text-gray-600 dark:text-gray-400"
            >
              {item.credentialId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              onKeyDown={stop}
              aria-label={copied ? "Credential ID copied" : "Copy credential ID"}
              className="relative z-20 -mx-1 -my-2 inline-flex min-h-[32px] shrink-0 items-center justify-center rounded px-1.5 py-2 text-[12px] font-bold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden cursor-pointer"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-gray-500 italic dark:text-gray-400">
            No credential ID
          </span>
        )}
      </div>

      {/* Skills — exactly two rows (52px), 13px font, +N chip carries rest */}
      <div className="mb-3 flex h-[52px] shrink-0 flex-wrap content-start gap-1 overflow-hidden text-[12px] sm:text-[13px]">
        {visibleTags.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            title={skill}
            className="max-w-full truncate rounded-md border border-blue-200/50 bg-blue-50 px-2 py-0.5 font-semibold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
          >
            {skill}
          </span>
        ))}
        {hiddenTags.length > 0 && (
          <span
            title={hiddenTags.join(" · ")}
            className="rounded-md border border-border/50 bg-gray-100 px-2 py-0.5 font-semibold text-gray-600 dark:border-dark_border dark:bg-darkmode dark:text-gray-300"
          >
            +{hiddenTags.length}
          </span>
        )}
      </div>

      {/* Preview — fixed 220px box, object-fit: contain, 16:10 box */}
      <div className="relative mb-3.5 h-[220px] w-full shrink-0 overflow-hidden rounded-xl border border-border/70 bg-slate-900/5 p-1.5 dark:border-dark_border dark:bg-slate-950/40">
        <div className="relative h-full w-full">{renderCertificatePreview()}</div>

        <RelativeTimePill
          date={getCertificateIssueDate(item)}
          latest={latest}
          verb="issued"
          className="absolute top-2 right-2"
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-dark shadow-md dark:bg-darklight/90 dark:text-white">
            <svg
              className="h-3 w-3 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview Certificate
          </span>
        </div>
      </div>

      {/* CTA — pinned to the bottom, exactly 44px on EVERY card */}
      <div className="relative z-20 mt-auto shrink-0 pt-1">
        {item.credentialUrl ? (
          <a
            href={item.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.stopPropagation();
              trackCertificationClick(item.id);
            }}
            onKeyDown={stop}
            className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-3 text-xs sm:text-[13px] font-bold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden dark:text-blue-300 dark:hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Show credential</span>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handlePreview();
            }}
            onKeyDown={stop}
            className="flex h-[44px] w-full items-center justify-center rounded-xl border border-border bg-gray-50 text-xs sm:text-[13px] font-bold text-dark transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden dark:border-dark_border dark:bg-darkmode dark:text-white cursor-pointer"
          >
            View Certificate Details
          </button>
        )}
      </div>
    </article>
  );
};

/** Same shell and block heights as the real card, so nothing shifts in. */
export const CertificationCardSkeleton: React.FC<{ widthClass?: string }> = ({
  widthClass = "w-full",
}) => (
  <div
    data-content-card=""
    className={`flex shrink-0 animate-pulse flex-col rounded-3xl border border-border/40 bg-gray-100 p-5 dark:border-dark_border/40 dark:bg-darklight ${widthClass}`}
  >
    <div className="mb-3 flex h-[76px] items-start gap-3">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-gray-200 dark:bg-darkmode" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-darkmode" />
        <div className="h-3 w-1/2 rounded-md bg-gray-200 dark:bg-darkmode" />
      </div>
    </div>
    <div className="mb-2.5 flex h-[28px] items-center gap-1.5">
      <div className="h-5 w-32 rounded-full bg-gray-200 dark:bg-darkmode" />
      <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-darkmode" />
    </div>
    <div className="mb-2.5 h-[32px] rounded-lg bg-gray-200 dark:bg-darkmode" />
    <div className="mb-3 flex h-[52px] flex-wrap content-start gap-1">
      <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-darkmode" />
      <div className="h-5 w-20 rounded-md bg-gray-200 dark:bg-darkmode" />
      <div className="h-5 w-14 rounded-md bg-gray-200 dark:bg-darkmode" />
    </div>
    <div className="mb-3.5 h-[220px] w-full rounded-xl bg-gray-200 dark:bg-darkmode" />
    <div className="h-[44px] w-full rounded-xl bg-gray-200 dark:bg-darkmode" />
  </div>
);
