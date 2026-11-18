import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAdmin";
import { cloudinarySignature } from "@/lib/landingPage/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ID_PATTERN = /^landing-page-zips\/[a-z0-9][a-z0-9/_.-]{0,180}$/;

/**
 * Signs a browser → Cloudinary ZIP upload. The API secret never leaves the
 * server; the browser only receives the API key, timestamp and SHA-1
 * signature for the exact `public_id` it will send.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, {
    bucket: "landing-sign",
    limit: 30,
    windowMs: 60_000,
  });
  if ("response" in auth) return auth.response;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Signed Cloudinary uploads are not configured on the server." },
      { status: 501 }
    );
  }

  let body: { publicId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const publicId = typeof body.publicId === "string" ? body.publicId : "";
  if (!PUBLIC_ID_PATTERN.test(publicId) || publicId.includes("..")) {
    return NextResponse.json({ error: "Invalid public_id." }, { status: 400 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = {
    invalidate: "true",
    overwrite: "true",
    public_id: publicId,
    timestamp,
  };

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    publicId,
    signature: cloudinarySignature(params, apiSecret),
    params,
  });
}
