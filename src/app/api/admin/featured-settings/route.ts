import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAdmin";
import { patchFirestoreDoc } from "@/lib/firestoreRest";
import {
  FEATURED_PROJECTS_DOC_PATH,
  validateFeaturedProjectsSettings,
} from "@/types/featuredProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validated write of the "Featured Projects" section settings.
 * The admin's ID token is forwarded to Firestore so Security Rules still apply.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, { bucket: "featured-settings", limit: 30 });
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateFeaturedProjectsSettings(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.errors[0], errors: result.errors },
      { status: 400 }
    );
  }

  try {
    await patchFirestoreDoc(
      FEATURED_PROJECTS_DOC_PATH,
      { ...result.settings, updatedAt: new Date().toISOString() },
      auth.admin.idToken
    );
  } catch (err) {
    console.error("featured-settings save failed:", err);
    return NextResponse.json(
      { error: "Could not save the settings. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: result.settings });
}
