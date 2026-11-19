import { serveLandingPage } from "@/lib/landingPage/serve";
import { readManifest } from "@/lib/landingPage/manifest";
import { getLandingStorage } from "@/lib/landingPage/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string; path?: string[] }>;
}

/**
 * Serves an uploaded landing page from its stored files.
 * `/projects/{slug}/`               → index.html
 * `/projects/{slug}/css/site.css`   → css/site.css
 *
 * Files are proxied through this route (never linked directly) so the correct
 * Content-Type, caching and the sandboxed CSP are always applied.
 */
export async function GET(req: Request, ctx: RouteContext) {
  const { slug: rawSlug, path } = await ctx.params;
  const slug = (rawSlug || "").toLowerCase();
  const pinnedVersion = new URL(req.url).searchParams.get("v");

  const storage = getLandingStorage();

  return serveLandingPage(
    { slug, path, pinnedVersion },
    {
      getManifest: (s) =>
        readManifest(s, {
          revalidate: 30,
          tags: ["landing-pages", `landing-page:${s}`],
        }),
      readFile: (key) => storage.get(key),
    }
  );
}
