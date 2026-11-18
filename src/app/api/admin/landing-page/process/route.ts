import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/apiAdmin";
import { publishLandingPage, PublishError, type ZipSource } from "@/lib/landingPage/publish";
import { deleteStagedZip, getLandingStorage } from "@/lib/landingPage/storage";
import { slugifyProjectTitle } from "@/types/landingPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(req: Request) {
  const auth = await requireAdmin(req, {
    bucket: "landing-process",
    limit: 5,
    windowMs: 60_000,
  });
  if ("response" in auth) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectId = asString(body.projectId);
  const title = asString(body.projectTitle);
  const slug = (asString(body.slug) || slugifyProjectTitle(title, projectId)).toLowerCase();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: "A project slug is required." }, { status: 400 });
  }

  const rawSource = body.source as Record<string, unknown> | undefined;
  const kind = asString(rawSource?.kind);
  let source: ZipSource;
  if (kind === "staging") {
    const token = asString(rawSource?.token);
    if (!token) {
      return NextResponse.json({ error: "Missing staging token." }, { status: 400 });
    }
    source = { kind: "staging", token };
  } else if (kind === "cloudinary") {
    const url = asString(rawSource?.url);
    if (!url) {
      return NextResponse.json({ error: "Missing ZIP URL." }, { status: 400 });
    }
    source = {
      kind: "cloudinary",
      url,
      publicId: asString(rawSource?.publicId) || undefined,
    };
  } else {
    return NextResponse.json({ error: "Unknown ZIP source." }, { status: 400 });
  }

  try {
    const result = await publishLandingPage({
      projectId,
      slug,
      source,
      idToken: auth.admin.idToken,
    });
    revalidateTag("landing-pages");
    revalidateTag(`landing-page:${slug}`);

    return NextResponse.json({
      slug: result.slug,
      version: result.version,
      fileCount: result.fileCount,
      totalBytes: result.totalBytes,
      skippedCount: result.skippedCount,
      wrapperFolder: result.wrapperFolder,
      versions: result.manifest.versions,
    });
  } catch (err) {
    // A rejected ZIP is dead weight: drop the staged copy (and the Cloudinary
    // raw upload) so failed attempts do not accumulate storage.
    if (source.kind === "staging") {
      await deleteStagedZip(source.token).catch(() => undefined);
    } else if (source.publicId) {
      await getLandingStorage().remove(source.publicId).catch(() => undefined);
    }
    if (err instanceof PublishError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("landing-page process failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Processing the landing page failed.",
      },
      { status: 500 }
    );
  }
}
