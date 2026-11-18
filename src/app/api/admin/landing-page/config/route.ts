import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAdmin";
import { MAX_LANDING_ZIP_MB } from "@/types/landingPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the admin form how the ZIP should be uploaded. In `local` mode the ZIP
 * goes straight to this server (real XHR progress, no third-party preset).
 * In `cloudinary` mode the browser uploads to Cloudinary with a progress
 * report and the server then downloads it.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, { bucket: "landing-config", limit: 60 });
  if ("response" in auth) return auth.response;

  const storage =
    (process.env.LANDING_PAGE_STORAGE || "local").toLowerCase() === "cloudinary"
      ? "cloudinary"
      : "local";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  const signedUpload = !!(
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );

  const uploadSupported =
    storage === "local" || (!!cloudName && (signedUpload || !!uploadPreset));

  return NextResponse.json({
    storage,
    uploadSupported,
    signedUpload,
    maxZipMb: MAX_LANDING_ZIP_MB,
    cloudName: storage === "cloudinary" ? cloudName : undefined,
    uploadPreset: storage === "cloudinary" && !signedUpload ? uploadPreset : undefined,
    reason: uploadSupported
      ? undefined
      : "Cloudinary uploads need NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME plus CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET (signed) or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (unsigned).",
  });
}
