import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tag, path } = body;

    if (tag) {
      revalidateTag(tag);
    }
    if (path) {
      revalidatePath(path);
    }

    // Default: revalidate home page and common tags
    revalidatePath("/");
    revalidateTag("projects");

    return NextResponse.json({
      revalidated: true,
      tag: tag || "projects",
      path: path || "/",
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err.message },
      { status: 500 }
    );
  }
}
