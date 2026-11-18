import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/apiAdmin";
import { activateLandingVersion, PublishError } from "@/lib/landingPage/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Roll the live landing page back to a previously uploaded version. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, { bucket: "landing-activate", limit: 10 });
  if ("response" in auth) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectId = asString(body.projectId);
  const slug = asString(body.slug).toLowerCase();
  const versionId = asString(body.versionId);
  if (!projectId || !slug || !versionId) {
    return NextResponse.json(
      { error: "projectId, slug and versionId are required." },
      { status: 400 }
    );
  }

  try {
    const result = await activateLandingVersion({
      projectId,
      slug,
      versionId,
      idToken: auth.admin.idToken,
    });
    revalidateTag("landing-pages");
    revalidateTag(`landing-page:${slug}`);
    return NextResponse.json({
      version: result.version,
      versions: result.manifest.versions,
      currentVersion: result.manifest.currentVersion,
    });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("landing-page activate failed:", err);
    return NextResponse.json(
      { error: "Could not switch the landing page version." },
      { status: 500 }
    );
  }
}
