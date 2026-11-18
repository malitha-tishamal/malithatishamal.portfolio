"use client";

import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import type { ProjectItem } from "@/types/project";
import type { LandingPageVersion } from "@/types/landingPage";
import {
  MAX_LANDING_ZIP_BYTES,
  landingPagePath,
  landingPageStatusLabel,
  slugifyProjectTitle,
  type LandingPageStatus,
} from "@/types/landingPage";
import { getImgPath } from "@/utils/image";
import { AdminApiError, adminJson, formatMegabytes } from "@/utils/adminApi";

interface LandingPageConfig {
  storage: "local" | "cloudinary";
  uploadSupported: boolean;
  signedUpload: boolean;
  maxZipMb: number;
  cloudName?: string;
  uploadPreset?: string;
  reason?: string;
}

interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  publicId: string;
  signature: string;
  params: Record<string, string>;
}

interface ZipSourceRef {
  kind: "staging" | "cloudinary";
  token?: string;
  url?: string;
  publicId?: string;
}

interface LandingPageZipFieldProps {
  project: ProjectItem;
  /** Live title from the form — used to derive the slug on the first upload. */
  projectTitle: string;
}

const ACCEPTED_MIME = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "multipart/x-zip",
  "application/octet-stream",
]);

const safeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60) || "landing-page.zip";

const statusStyles: Record<LandingPageStatus, string> = {
  uploading:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
  processing:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  ready:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
  failed:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
};

export const LandingPageZipField: React.FC<LandingPageZipFieldProps> = ({
  project,
  projectTitle,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelledRef = useRef(false);

  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "processing" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState({ percent: 0, loaded: 0, total: 0 });
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  const [slug, setSlug] = useState(
    project.landingPageSlug || slugifyProjectTitle(projectTitle || project.title, project.id)
  );
  const [landingUrl, setLandingUrl] = useState(project.landingPageUrl || "");
  const [versions, setVersions] = useState<LandingPageVersion[]>(
    project.landingPageVersions || []
  );
  const [currentVersion, setCurrentVersion] = useState(
    project.landingPageVersion || ""
  );
  const [status, setStatus] = useState<LandingPageStatus | undefined>(
    project.landingPageStatus
  );
  const [fileCount, setFileCount] = useState(project.landingPageFileCount || 0);
  const [totalBytes, setTotalBytes] = useState(project.landingPageTotalBytes || 0);
  const [uploadedAt, setUploadedAt] = useState(project.landingPageUploadedAt || "");
  const [showBackButton, setShowBackButton] = useState(
    project.showBackToPortfolio !== false
  );

  // Re-sync when a different project is opened in the modal.
  useEffect(() => {
    setSlug(
      project.landingPageSlug ||
        slugifyProjectTitle(projectTitle || project.title, project.id)
    );
    setLandingUrl(project.landingPageUrl || "");
    setVersions(project.landingPageVersions || []);
    setCurrentVersion(project.landingPageVersion || "");
    setStatus(project.landingPageStatus);
    setFileCount(project.landingPageFileCount || 0);
    setTotalBytes(project.landingPageTotalBytes || 0);
    setUploadedAt(project.landingPageUploadedAt || "");
    setShowBackButton(project.showBackToPortfolio !== false);
    setPhase("idle");
    setError("");
    setSelectedFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!user) return;
        const token = await user.getIdToken();
        const data = await adminJson<LandingPageConfig>(
          "/api/admin/landing-page/config",
          { method: "GET", token }
        );
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) {
          setConfig({
            storage: "local",
            uploadSupported: false,
            signedUpload: false,
            maxZipMb: Math.round(MAX_LANDING_ZIP_BYTES / (1024 * 1024)),
            reason:
              err instanceof Error ? err.message : "Could not load upload configuration.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const maxZipBytes = (config?.maxZipMb || 100) * 1024 * 1024;

  const persistStatus = async (next: LandingPageStatus) => {
    try {
      await updateDoc(doc(db, "projects", project.id), { landingPageStatus: next });
    } catch (err) {
      console.warn("Could not persist landing page status:", err);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      return "Only .zip files are accepted.";
    }
    if (file.type && !ACCEPTED_MIME.has(file.type.toLowerCase())) {
      return "That file is not a ZIP archive.";
    }
    if (file.size === 0) return "The ZIP file is empty.";
    if (file.size > maxZipBytes) {
      return `The ZIP is larger than ${config?.maxZipMb || 100} MB.`;
    }
    return null;
  };

  const uploadLocal = (file: File, token: string) =>
    new Promise<ZipSourceRef>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", "/api/admin/landing-page/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.timeout = 30 * 60 * 1000;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress({
            percent: Math.round((event.loaded / event.total) * 100),
            loaded: event.loaded,
            total: event.total,
          });
        }
      };
      xhr.onload = () => {
        try {
          const payload = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload.source as ZipSourceRef);
          } else {
            reject(new AdminApiError(payload.error || "Upload failed.", xhr.status));
          }
        } catch {
          reject(new AdminApiError("Unexpected response from the upload endpoint.", xhr.status));
        }
      };
      xhr.onerror = () => reject(new AdminApiError("Network error during upload.", 0));
      xhr.ontimeout = () => reject(new AdminApiError("The upload timed out.", 0));
      xhr.onabort = () => reject(new AdminApiError("Upload cancelled.", 0));
      const form = new FormData();
      form.append("file", file, file.name);
      xhr.send(form);
    });

  const uploadCloudinary = (file: File, token: string) =>
    new Promise<ZipSourceRef>(async (resolve, reject) => {
      if (!config?.cloudName || (!config.signedUpload && !config.uploadPreset)) {
        reject(new AdminApiError("Cloudinary is not configured for uploads.", 0));
        return;
      }
      const publicId = `landing-page-zips/${slug}/${Date.now()}-${safeFileName(file.name)}`;

      let signed: SignedUpload | null = null;
      if (config.signedUpload) {
        try {
          signed = await adminJson<SignedUpload>("/api/admin/landing-page/sign", {
            token,
            body: { publicId },
          });
        } catch (err) {
          reject(err);
          return;
        }
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          signed?.cloudName || config.cloudName!
        )}/raw/upload`
      );
      xhr.timeout = 60 * 60 * 1000;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress({
            percent: Math.round((event.loaded / event.total) * 100),
            loaded: event.loaded,
            total: event.total,
          });
        }
      };
      xhr.onload = () => {
        try {
          const payload = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
            resolve({
              kind: "cloudinary",
              url: payload.secure_url,
              publicId: payload.public_id,
            });
          } else {
            reject(
              new AdminApiError(
                payload?.error?.message ||
                  "Cloudinary rejected the upload. Check the preset allows ZIP/raw files and the size limit.",
                xhr.status
              )
            );
          }
        } catch {
          reject(new AdminApiError("Unexpected response from Cloudinary.", xhr.status));
        }
      };
      xhr.onerror = () => reject(new AdminApiError("Network error during upload.", 0));
      xhr.ontimeout = () => reject(new AdminApiError("The upload timed out.", 0));
      xhr.onabort = () => reject(new AdminApiError("Upload cancelled.", 0));
      const form = new FormData();
      form.append("file", file, file.name);
      form.append("public_id", publicId);
      if (signed) {
        form.append("api_key", signed.apiKey);
        form.append("timestamp", signed.params.timestamp);
        form.append("overwrite", signed.params.overwrite);
        form.append("invalidate", signed.params.invalidate);
        form.append("signature", signed.signature);
      } else {
        form.append("upload_preset", config.uploadPreset!);
      }
      xhr.send(form);
    });

  const startUpload = async (file: File) => {
    if (!user) {
      toast.error("Sign in as an admin first.");
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setPhase("error");
      setError(validationError);
      return;
    }
    if (config && !config.uploadSupported) {
      setPhase("error");
      setError(config.reason || "Uploads are not configured.");
      return;
    }

    setSelectedFile(file);
    setError("");
    cancelledRef.current = false;
    setPhase("uploading");
    setProgress({ percent: 0, loaded: 0, total: file.size });
    await persistStatus("uploading");

    try {
      const token = await user.getIdToken();
      const source =
        config?.storage === "cloudinary"
          ? await uploadCloudinary(file, token)
          : await uploadLocal(file, token);

      setPhase("processing");
      await persistStatus("processing");

      const targetSlug =
        project.landingPageSlug ||
        slug ||
        slugifyProjectTitle(projectTitle || project.title, project.id);

      const result = await adminJson<{
        slug: string;
        version: LandingPageVersion;
        fileCount: number;
        totalBytes: number;
        skippedCount: number;
        versions: LandingPageVersion[];
      }>("/api/admin/landing-page/process", {
        token,
        body: {
          projectId: project.id,
          projectTitle: projectTitle || project.title,
          slug: targetSlug,
          source,
        },
      });

      setSlug(result.slug);
      setLandingUrl(landingPagePath(result.slug));
      setVersions(result.versions);
      setCurrentVersion(result.version.id);
      setStatus("ready");
      setFileCount(result.fileCount);
      setTotalBytes(result.totalBytes);
      setUploadedAt(result.version.createdAt);
      setPhase("idle");
      toast.success(
        `Landing page published — ${result.fileCount} file${result.fileCount === 1 ? "" : "s"}${
          result.skippedCount ? `, ${result.skippedCount} skipped` : ""
        }.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Publishing the landing page failed.";
      setPhase("error");
      setError(message);
      setStatus("failed");
      await persistStatus("failed");
      if (!cancelledRef.current) toast.error(message);
    } finally {
      xhrRef.current = null;
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void startUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void startUpload(file);
  };

  const cancelUpload = () => {
    cancelledRef.current = true;
    xhrRef.current?.abort();
    setPhase("idle");
    setError("");
    setProgress({ percent: 0, loaded: 0, total: 0 });
    toast("Upload cancelled.", { icon: "✕" });
    void persistStatus(status || "failed");
  };

  const handleActivate = async (versionId: string) => {
    if (!user) return;
    setActivating(versionId);
    try {
      const token = await user.getIdToken();
      const result = await adminJson<{
        version: LandingPageVersion;
        versions: LandingPageVersion[];
        currentVersion: string;
      }>("/api/admin/landing-page/activate", {
        token,
        body: { projectId: project.id, slug, versionId },
      });
      setVersions(result.versions);
      setCurrentVersion(result.currentVersion);
      setFileCount(result.version.fileCount);
      setTotalBytes(result.version.totalBytes);
      setUploadedAt(result.version.createdAt);
      setStatus("ready");
      toast.success("Previous version restored.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not switch the version.");
    } finally {
      setActivating(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      window.setTimeout(() => setConfirmRemove(false), 4000);
      return;
    }
    setConfirmRemove(false);
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await adminJson("/api/admin/landing-page/remove", {
        token,
        body: { projectId: project.id, slug },
      });
      setLandingUrl("");
      setVersions([]);
      setCurrentVersion("");
      setStatus(undefined);
      setFileCount(0);
      setTotalBytes(0);
      setUploadedAt("");
      setPhase("idle");
      setError("");
      toast.success("Landing page removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the landing page.");
    }
  };

  const handleBackButtonToggle = async () => {
    if (!user) return;
    const next = !showBackButton;
    setShowBackButton(next);
    try {
      const token = await user.getIdToken();
      await adminJson("/api/admin/landing-page/options", {
        token,
        body: { projectId: project.id, slug, showBackToPortfolio: next },
      });
      toast.success(next ? "Back button enabled." : "Back button hidden.");
    } catch (err) {
      setShowBackButton(!next);
      toast.error(err instanceof Error ? err.message : "Could not save the option.");
    }
  };

  const busy = phase === "uploading" || phase === "processing";
  const hasLandingPage = !!landingUrl && versions.length > 0;

  return (
    <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-darkmode border border-border/60 dark:border-dark_border space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-primary">
            Landing page (ZIP)
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Upload a static site ZIP (index.html at the root). It is published at{" "}
            <span className="font-mono text-[10px]">
              /projects/{slug || "…"}/
            </span>
            .
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
            statusStyles[status || "failed"]
          }`}
        >
          {phase === "processing"
            ? "Processing (unzipping)…"
            : phase === "uploading"
            ? `Uploading… ${progress.percent}%`
            : landingPageStatusLabel(status)}
        </span>
      </div>

      {config && !config.uploadSupported && (
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3 py-2">
          {config.reason}
        </p>
      )}

      {/* Upload / progress */}
      {(busy || phase === "error") && (
        <div className="space-y-2 bg-white dark:bg-darklight rounded-xl border border-border/60 dark:border-dark_border p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            <span className="truncate max-w-[55%]">
              {selectedFile?.name || "landing-page.zip"}
            </span>
            <span>
              {formatMegabytes(progress.loaded)} / {formatMegabytes(progress.total)}
              {phase === "uploading" ? ` · ${progress.percent}%` : ""}
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full bg-gray-200 dark:bg-dark_border overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase === "processing" ? 100 : progress.percent}
          >
            <div
              className={`h-full transition-all duration-300 ${
                phase === "error" ? "bg-red-500" : "bg-primary"
              } ${phase === "processing" ? "animate-pulse" : ""}`}
              style={{
                width: `${phase === "processing" ? 100 : progress.percent}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {phase === "processing"
                ? "Validating and unzipping on the server…"
                : phase === "error"
                ? error
                : "Keep this tab open while the file uploads."}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {busy && (
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-border dark:border-dark_border hover:border-red-400 hover:text-red-600 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              {phase === "error" && selectedFile && (
                <button
                  type="button"
                  onClick={() => void startUpload(selectedFile)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-blue-700 cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dropzone (no page yet, or replacing) */}
      {!busy && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border dark:border-dark_border hover:border-primary/60"
          }`}
        >
          <span className="text-xl">🗜️</span>
          <span className="text-xs font-bold text-dark dark:text-white">
            {hasLandingPage ? "Replace ZIP" : "Drop a .zip here or click to choose"}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            .zip only · up to {config?.maxZipMb || 100} MB · must contain index.html
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Published state */}
      {hasLandingPage && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
            <span className="font-semibold">
              {fileCount} file{fileCount === 1 ? "" : "s"} · {formatMegabytes(totalBytes)}
            </span>
            {uploadedAt && (
              <span className="text-gray-400">
                · {new Date(uploadedAt).toLocaleString()}
              </span>
            )}
            <a
              href={getImgPath(landingUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[11px] font-bold hover:bg-emerald-100"
            >
              Preview ↗
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                confirmRemove
                  ? "bg-red-50 border-red-300 text-red-600 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
                  : "border-border dark:border-dark_border text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-600"
              }`}
            >
              {confirmRemove ? "Click again to confirm" : "Remove landing page"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white dark:bg-darklight rounded-xl border border-border/60 dark:border-dark_border px-3 py-2">
            <div>
              <p className="text-[11px] font-bold text-dark dark:text-white">
                Show “Back to Portfolio” button
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Injected at the top-left of every served page.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showBackButton}
              onClick={handleBackButtonToggle}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                showBackButton ? "bg-emerald-500" : "bg-gray-300 dark:bg-dark_border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  showBackButton ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {versions.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Versions (last {versions.length})
              </p>
              {versions.map((version) => {
                const live = version.id === currentVersion;
                return (
                  <div
                    key={version.id}
                    className="flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-darklight rounded-lg border border-border/60 dark:border-dark_border px-2.5 py-1.5"
                  >
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {version.id}
                    </span>
                    <span className="text-gray-400 whitespace-nowrap">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400 whitespace-nowrap">
                      {version.fileCount} files
                    </span>
                    {live ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        LIVE
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={activating === version.id || version.status !== "ready"}
                        onClick={() => handleActivate(version.id)}
                        className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 disabled:opacity-50 cursor-pointer"
                      >
                        {activating === version.id ? "Switching…" : "Activate"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandingPageZipField;
