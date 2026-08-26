"use client";

import React from "react";
import Image from "next/image";
import { CertificationItem } from "@/types/certification";

interface CertificationDetailModalProps {
  item: CertificationItem | null;
  onClose: () => void;
}

export const CertificationDetailModal: React.FC<CertificationDetailModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-darklight rounded-3xl border border-border dark:border-dark_border shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-border dark:border-dark_border mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center p-2 shrink-0 border border-gray-800">
              {item.issuerLogo ? (
                <Image
                  src={item.issuerLogo}
                  alt={item.issuer}
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-bold text-xs">CERT</span>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-white leading-tight">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                {item.issuer}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode text-gray-500 hover:text-dark dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Certificate Image Preview Display */}
        {item.certificateImage && (
          <div className="relative w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden mb-6 border border-border dark:border-dark_border bg-gray-100 dark:bg-darkmode shadow-inner">
            <Image
              src={item.certificateImage}
              alt={item.title}
              fill
              className="object-contain p-2"
              priority
              unoptimized
            />
          </div>
        )}

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Issue Date
            </span>
            <p className="text-sm font-semibold text-dark dark:text-white">
              {item.issueDate}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Expiration Date
            </span>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {item.expirationDate || "No Expiration"}
            </p>
          </div>
          {item.credentialId && (
            <div className="sm:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Credential ID
              </span>
              <p className="text-sm font-mono font-semibold text-dark dark:text-white break-all">
                {item.credentialId}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Credential Summary
            </h4>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {item.description}
            </p>
          </div>
        )}

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
              Verified Competencies & Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-dark_border">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
          >
            Close
          </button>

          {item.credentialUrl && (
            <a
              href={item.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Verify on Issuer Site</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};