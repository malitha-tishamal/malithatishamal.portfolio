import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/apiAdmin";
import { patchFirestoreDoc } from "@/lib/firestoreRest";
import { readManifest, writeManifest } from "@/lib/landingPage/manifest";
import { PublishError } from "@/lib/landingPage/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Per-project options: currently the "Back to Portfolio" button toggle. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, { bucket: "landing-options", limit: 20 });
  if ("response" in auth) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectId = asString(body.projectId);
  const slug = asString(body.slug).toLowerCase();
  if (!projectId || !slug) {
    return NextResponse.json(
      { error: "projectId and slug are required." },
      { status: 400 }
    );
  }
  if (typeof body.showBackToPortfolio !== "boolean") {
    return NextResponse.json(
      { error: "showBackToPortfolio must be a boolean." },
      { status: 400 }
    );
  }

  const manifest = await readManifest(slug, { idToken: auth.admin.idToken });
  if (!manifest) {
    return NextResponse.json(
      { error: "No uploaded landing page for this project." },
      { status: 404 }
    );
  }
  if (manifest.projectId !== projectId) {
    return NextResponse.json(
      { error: "This landing page belongs to another project." },
      { status: 403 }
    );
  }

  try {
    await writeManifest(
      { ...manifest, backButton: body.showBackToPortfolio },
      auth.admin.idToken
    );
    await patchFirestoreDoc(
      `projects/${projectId}`,
      { showBackToPortfolio: body.showBackToPortfolio },
      auth.admin.idToken
    );
    revalidateTag(`landing-page:${slug}`);
    return NextResponse.json({ showBackToPortfolio: body.showBackToPortfolio });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("landing-page options failed:", err);
    return NextResponse.json(
      { error: "Could not save the landing page options." },
      { status: 500 }
    );
  }
}
