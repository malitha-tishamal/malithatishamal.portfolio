import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/apiAdmin";
import { PublishError, removeLandingPage } from "@/lib/landingPage/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Remove the landing page, its files, ZIPs and manifest document. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, { bucket: "landing-remove", limit: 10 });
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

  try {
    const result = await removeLandingPage({
      projectId,
      slug,
      idToken: auth.admin.idToken,
    });
    revalidateTag("landing-pages");
    revalidateTag(`landing-page:${slug}`);
    return NextResponse.json({ removedFiles: result.removedFiles });
  } catch (err) {
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("landing-page remove failed:", err);
    return NextResponse.json(
      { error: "Could not remove the landing page." },
      { status: 500 }
    );
  }
}
