import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAdmin";
import { stageZip } from "@/lib/landingPage/storage";
import { MAX_LANDING_ZIP_BYTES } from "@/types/landingPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ZIP_MIME = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "multipart/x-zip",
  "application/octet-stream",
]);

/**
 * Direct staging upload, used when LANDING_PAGE_STORAGE=local (dev / self-host).
 * On hosts with a 4.5 MB request-body limit the form uploads to Cloudinary
 * instead and posts only the resulting URL.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, {
    bucket: "landing-upload",
    limit: 10,
    windowMs: 60_000,
  });
  if ("response" in auth) return auth.response;

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_LANDING_ZIP_BYTES + 1024 * 1024) {
    return NextResponse.json(
      { error: `The ZIP is larger than ${Math.round(MAX_LANDING_ZIP_BYTES / (1024 * 1024))} MB.` },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload body." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No ZIP file was received." }, { status: 400 });
  }
  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".zip")) {
    return NextResponse.json(
      { error: "Only .zip files are accepted." },
      { status: 415 }
    );
  }
  if (file.type && !ZIP_MIME.has(file.type.toLowerCase())) {
    return NextResponse.json(
      { error: "The file is not a ZIP archive." },
      { status: 415 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The ZIP file is empty." }, { status: 400 });
  }
  if (file.size > MAX_LANDING_ZIP_BYTES) {
    return NextResponse.json(
      { error: `The ZIP is larger than ${Math.round(MAX_LANDING_ZIP_BYTES / (1024 * 1024))} MB.` },
      { status: 413 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    return NextResponse.json(
      { error: "The file is not a valid ZIP archive." },
      { status: 415 }
    );
  }

  const staged = await stageZip(bytes);
  return NextResponse.json({
    source: { kind: "staging", token: staged.token },
    bytes: staged.bytes,
  });
}
