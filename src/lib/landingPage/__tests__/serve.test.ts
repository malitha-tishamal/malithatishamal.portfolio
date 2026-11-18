import { describe, expect, it } from "vitest";
import {
  BACK_BUTTON_ATTR,
  BASE_HREF_ATTR,
  LANDING_PAGE_CSP,
  SLUG_PATTERN,
  buildBackButton,
  contentTypeFor,
  injectLandingHtmlExtras,
  resolveLandingFilePath,
  rewriteRootAbsoluteUrls,
  serveLandingPage,
} from "../serve";
import type { LandingPageManifest } from "@/types/landingPage";

const encode = (text: string) => new TextEncoder().encode(text);

const readyManifest = (overrides: Partial<LandingPageManifest> = {}): LandingPageManifest => ({
  slug: "cozy-casa",
  projectId: "p1",
  projectTitle: "Cozy Casa",
  currentVersion: "v1",
  backButton: true,
  versions: [
    { id: "v1", createdAt: "2026-01-01T00:00:00.000Z", fileCount: 3, totalBytes: 1200, status: "ready" },
  ],
  ...overrides,
});

const depsFor = (
  manifest: LandingPageManifest | null,
  files: Record<string, string | Uint8Array>,
  siteUrl = "https://example.com"
) => ({
  getManifest: async () => manifest,
  readFile: async (key: string) => {
    const value = files[key];
    if (value === undefined) return null;
    return typeof value === "string" ? encode(value) : value;
  },
  siteUrl,
});

describe("resolveLandingFilePath", () => {
  it("defaults to index.html for an empty path", () => {
    expect(resolveLandingFilePath(undefined)).toBe("index.html");
    expect(resolveLandingFilePath([])).toBe("index.html");
  });

  it("joins nested segments", () => {
    expect(resolveLandingFilePath(["assets", "app.css"])).toBe("assets/app.css");
  });

  it("maps a trailing slash to a directory index", () => {
    expect(resolveLandingFilePath(["about/"])).toBe("about/index.html");
  });

  it("rejects traversal, absolute and drive-letter paths", () => {
    expect(resolveLandingFilePath(["..", "secret.txt"])).toBeNull();
    expect(resolveLandingFilePath(["assets", "..", "..", "x"])).toBeNull();
    expect(resolveLandingFilePath(["C:", "Windows", "x"])).toBeNull();
  });

  it("rejects encoded traversal and malformed encoding", () => {
    expect(resolveLandingFilePath(["%2e%2e/secret"])).toBeNull();
    expect(resolveLandingFilePath(["%E0%A4%A"])).toBeNull();
  });

  it("ignores empty and '.' segments", () => {
    expect(resolveLandingFilePath(["", ".", "index.html"])).toBe("index.html");
  });
});

describe("contentTypeFor", () => {
  it("maps web types", () => {
    expect(contentTypeFor("index.html")).toContain("text/html");
    expect(contentTypeFor("styles/app.css")).toContain("text/css");
    expect(contentTypeFor("app.js")).toContain("javascript");
    expect(contentTypeFor("logo.svg")).toBe("image/svg+xml");
    expect(contentTypeFor("font.woff2")).toBe("font/woff2");
  });

  it("falls back to octet-stream", () => {
    expect(contentTypeFor("archive.bin")).toBe("application/octet-stream");
  });
});

describe("rewriteRootAbsoluteUrls", () => {
  it("prefixes root-absolute markup attributes", () => {
    const out = rewriteRootAbsoluteUrls(
      '<link href="/assets/app.css"><img src="/img/a.png"><script src=\'/app.js\'></script>',
      "/projects/demo"
    );
    expect(out).toContain('href="/projects/demo/assets/app.css"');
    expect(out).toContain('src="/projects/demo/img/a.png"');
    expect(out).toContain("src='/projects/demo/app.js'");
  });

  it("leaves relative, protocol-relative, absolute and already-prefixed URLs alone", () => {
    const html =
      '<img src="a.png"><img src="//cdn.example.com/a.png"><img src="https://x.test/a.png"><img src="/projects/demo/a.png">';
    expect(rewriteRootAbsoluteUrls(html, "/projects/demo")).toBe(html);
  });

  it("rewrites each srcset entry and keeps descriptors", () => {
    const out = rewriteRootAbsoluteUrls(
      '<img srcset="/a.png 1x, /b.png 2x">',
      "/projects/demo/"
    );
    expect(out).toContain('srcset="/projects/demo/a.png 1x, /projects/demo/b.png 2x"');
  });

  it("rewrites CSS url() and @import", () => {
    const out = rewriteRootAbsoluteUrls(
      '@import "/base.css"; body{background:url(/img/bg.png)} .x{background:url("/img/y.png")}',
      "/projects/demo"
    );
    expect(out).toContain('@import "/projects/demo/base.css"');
    expect(out).toContain("url(/projects/demo/img/bg.png)");
    expect(out).toContain('url("/projects/demo/img/y.png")');
  });
});

describe("back button", () => {
  it("builds a fixed, CSP-safe pill pointing at #projects", () => {
    const html = buildBackButton("https://example.com/");
    expect(html).toContain(`href="https://example.com/#projects"`);
    expect(html).toContain("position:fixed");
    expect(html).toContain("min-height:44px");
    expect(html).toContain(BACK_BUTTON_ATTR);
    expect(html).toContain("Back to Portfolio");
  });

  it("injects right after <body> once", () => {
    const html = "<html><body class='x'><h1>Hi</h1></body></html>";
    const once = injectLandingHtmlExtras(html, { showBackButton: true, siteUrl: "https://example.com" });
    expect(once.indexOf(BACK_BUTTON_ATTR)).toBeGreaterThan(once.indexOf("<body"));
    expect(once.indexOf(BACK_BUTTON_ATTR)).toBeLessThan(once.indexOf("<h1>"));
    expect(injectLandingHtmlExtras(once, { showBackButton: true })).toBe(once);
  });

  it("prepends when the document has no <body>", () => {
    const out = injectLandingHtmlExtras("<h1>Fragment</h1>", { showBackButton: true });
    expect(out.startsWith("<a ")).toBe(true);
    expect(out).toContain("<h1>Fragment</h1>");
  });

  it("does nothing when disabled", () => {
    const html = "<body><h1>Hi</h1></body>";
    expect(injectLandingHtmlExtras(html, { showBackButton: false })).toBe(html);
  });

  it("injects a directory base tag once for index documents", () => {
    const html = "<html><head><title>x</title></head><body><img src='a.png'></body></html>";
    const out = injectLandingHtmlExtras(html, {
      showBackButton: false,
      baseHref: "/projects/demo/",
    });
    expect(out).toContain('<base data-landing-base="1" href="/projects/demo/">');
    expect(out.indexOf(BASE_HREF_ATTR)).toBeGreaterThan(out.indexOf("<head>"));
    expect(out.indexOf(BASE_HREF_ATTR)).toBeLessThan(out.indexOf("<title>"));
    expect(
      injectLandingHtmlExtras(out, { showBackButton: false, baseHref: "/projects/demo/" })
    ).toBe(out);
  });
});

describe("serveLandingPage", () => {
  it("serves index.html with sandbox CSP and the back button", async () => {
    const res = await serveLandingPage(
      { slug: "cozy-casa" },
      depsFor(readyManifest(), {
        "landing-pages/cozy-casa/v1/index.html":
          '<html><body><h1>Hello</h1><link href="/assets/app.css"></body></html>',
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Security-Policy")).toBe(LANDING_PAGE_CSP);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const body = await res.text();
    expect(body).toContain(BACK_BUTTON_ATTR);
    expect(body).toContain(BASE_HREF_ATTR);
    expect(body).toContain('href="/projects/cozy-casa/"');
    expect(body).toContain('href="/projects/cozy-casa/assets/app.css"');
  });

  it("serves CSS with the base path rewritten", async () => {
    const res = await serveLandingPage(
      { slug: "cozy-casa", path: ["assets", "app.css"] },
      depsFor(readyManifest(), {
        "landing-pages/cozy-casa/v1/assets/app.css": "body{background:url(/img/bg.png)}",
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/css");
    expect(await res.text()).toContain("url(/projects/cozy-casa/img/bg.png)");
  });

  it("falls back to a directory index for extension-less paths", async () => {
    const res = await serveLandingPage(
      { slug: "cozy-casa", path: ["about"] },
      depsFor(readyManifest(), {
        "landing-pages/cozy-casa/v1/about/index.html": "<head></head><body>About</body>",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("About");
    expect(body).toContain('href="/projects/cozy-casa/about/"');
  });

  it("does not add a base tag for non-index HTML files", async () => {
    const res = await serveLandingPage(
      { slug: "cozy-casa", path: ["about.html"] },
      depsFor(readyManifest(), {
        "landing-pages/cozy-casa/v1/about.html": "<body>About file</body>",
      })
    );
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain(BASE_HREF_ATTR);
  });

  it("404s for an unknown slug, missing manifest, unknown version and missing file", async () => {
    const files = { "landing-pages/cozy-casa/v1/index.html": "<body>ok</body>" };
    expect((await serveLandingPage({ slug: "Bad Slug!" }, depsFor(readyManifest(), files))).status).toBe(404);
    expect((await serveLandingPage({ slug: "cozy-casa" }, depsFor(null, files))).status).toBe(404);
    expect(
      (
        await serveLandingPage(
          { slug: "cozy-casa" },
          depsFor(readyManifest({ currentVersion: "nope" }), files)
        )
      ).status
    ).toBe(404);
    expect(
      (await serveLandingPage({ slug: "cozy-casa", path: ["missing.png"] }, depsFor(readyManifest(), files))).status
    ).toBe(404);
  });

  it("404s traversal attempts instead of reading outside the root", async () => {
    const readKeys: string[] = [];
    const deps = {
      getManifest: async () => readyManifest(),
      readFile: async (key: string) => {
        readKeys.push(key);
        return encode("nope");
      },
    };
    const res = await serveLandingPage({ slug: "cozy-casa", path: ["..", "secret.txt"] }, deps);
    expect(res.status).toBe(404);
    expect(readKeys).toHaveLength(0);
  });

  it("503s with Retry-After while the version is not ready", async () => {
    const manifest = readyManifest({
      versions: [
        { id: "v1", createdAt: "2026-01-01T00:00:00.000Z", fileCount: 0, totalBytes: 0, status: "processing" },
      ],
    });
    const res = await serveLandingPage(
      { slug: "cozy-casa" },
      depsFor(manifest, { "landing-pages/cozy-casa/v1/index.html": "<body>soon</body>" })
    );
    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("10");
  });

  it("uses short-lived caching by default and immutable caching when pinned", async () => {
    const files = { "landing-pages/cozy-casa/v1/style.css": "body{}" };
    const plain = await serveLandingPage(
      { slug: "cozy-casa", path: ["style.css"] },
      depsFor(readyManifest(), files)
    );
    expect(plain.headers.get("Cache-Control")).toContain("max-age=60");
    expect(plain.headers.get("Cache-Control")).not.toContain("immutable");

    const pinned = await serveLandingPage(
      { slug: "cozy-casa", path: ["style.css"], pinnedVersion: "v1" },
      depsFor(readyManifest(), files)
    );
    expect(pinned.headers.get("Cache-Control")).toContain("immutable");

    const stalePin = await serveLandingPage(
      { slug: "cozy-casa", path: ["style.css"], pinnedVersion: "v0" },
      depsFor(readyManifest(), files)
    );
    expect(stalePin.headers.get("Cache-Control")).not.toContain("immutable");
  });

  it("omits the back button when the project disabled it", async () => {
    const res = await serveLandingPage(
      { slug: "cozy-casa" },
      depsFor(readyManifest({ backButton: false }), {
        "landing-pages/cozy-casa/v1/index.html": "<body>no button</body>",
      })
    );
    expect(await res.text()).not.toContain(BACK_BUTTON_ATTR);
  });

  it("only matches slug-safe identifiers", () => {
    expect(SLUG_PATTERN.test("cozy-casa")).toBe(true);
    expect(SLUG_PATTERN.test("-bad")).toBe(false);
    expect(SLUG_PATTERN.test("UPPER")).toBe(false);
    expect(SLUG_PATTERN.test("has space")).toBe(false);
  });
});
