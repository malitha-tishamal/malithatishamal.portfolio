import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import {
  LANDING_LIMITS,
  LandingZipError,
  extractLandingZip,
  extensionOf,
  normalizeZipEntryPath,
  sanitizeSvg,
  stripWrapperFolder,
} from "../zip";

const buildZip = (entries: Record<string, string | Uint8Array>) =>
  zipSync(
    Object.fromEntries(
      Object.entries(entries).map(([name, content]) => [
        name,
        typeof content === "string" ? strToU8(content) : content,
      ])
    )
  );

const html = "<!doctype html><html><body><h1>Hello</h1></body></html>";

describe("normalizeZipEntryPath", () => {
  it("keeps normal relative paths", () => {
    expect(normalizeZipEntryPath("css/site.css")).toBe("css/site.css");
    expect(normalizeZipEntryPath("./index.html")).toBe("index.html");
    expect(normalizeZipEntryPath("a//b/c.png")).toBe("a/b/c.png");
  });

  it("rejects traversal, absolute paths and control characters", () => {
    expect(() => normalizeZipEntryPath("../evil.html")).toThrow(LandingZipError);
    expect(() => normalizeZipEntryPath("a/../../evil.html")).toThrow(LandingZipError);
    expect(() => normalizeZipEntryPath("/etc/passwd")).toThrow(LandingZipError);
    expect(() => normalizeZipEntryPath("C:/Windows/x.dll")).toThrow(LandingZipError);
    expect(() => normalizeZipEntryPath("a/\u0000b.html")).toThrow(LandingZipError);
  });
});

describe("stripWrapperFolder", () => {
  it("strips a single wrapper folder", () => {
    const result = stripWrapperFolder(["site/index.html", "site/css/a.css"]);
    expect(result.prefix).toBe("site");
    expect(result.paths).toEqual(["index.html", "css/a.css"]);
  });

  it("leaves a root index.html alone", () => {
    const result = stripWrapperFolder(["index.html", "site/index.html"]);
    expect(result.prefix).toBeNull();
    expect(result.paths).toEqual(["index.html", "site/index.html"]);
  });

  it("does not strip when several top-level folders exist", () => {
    const result = stripWrapperFolder(["site/index.html", "assets/a.css"]);
    expect(result.prefix).toBeNull();
  });
});

describe("sanitizeSvg", () => {
  it("removes scripts, event handlers and javascript URLs", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onclick="steal()" width="10"/><a href="javascript:alert(1)"><text>x</text></a><foreignObject><body/></foreignObject></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).toContain("<rect");
  });
});

describe("extractLandingZip", () => {
  it("extracts a simple site", () => {
    const zip = buildZip({
      "index.html": html,
      "css/site.css": "body{color:red}",
      "images/logo.png": new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    });
    const result = extractLandingZip(zip);
    expect(result.files.map((f) => f.path).sort()).toEqual([
      "css/site.css",
      "images/logo.png",
      "index.html",
    ]);
    expect(result.files.find((f) => f.path === "index.html")?.contentType).toContain(
      "text/html"
    );
    expect(result.wrapperFolder).toBeNull();
  });

  it("strips one wrapper folder", () => {
    const zip = buildZip({ "dist/index.html": html, "dist/app.js": "console.log(1)" });
    const result = extractLandingZip(zip);
    expect(result.wrapperFolder).toBe("dist");
    expect(result.files.map((f) => f.path).sort()).toEqual(["app.js", "index.html"]);
  });

  it("rejects path traversal", () => {
    const zip = buildZip({ "index.html": html, "../evil.html": "x" });
    expect(() => extractLandingZip(zip)).toThrow(/traversal/i);
  });

  it("rejects absolute paths", () => {
    const zip = buildZip({ "index.html": html, "/var/www/evil.html": "x" });
    expect(() => extractLandingZip(zip)).toThrow(LandingZipError);
  });

  it("rejects server-side and executable files", () => {
    const zip = buildZip({ "index.html": html, "shell.php": "<?php echo 1; ?>" });
    expect(() => extractLandingZip(zip)).toThrow(/Forbidden file type/i);
  });

  it("requires an index.html", () => {
    const zip = buildZip({ "about.html": html });
    expect(() => extractLandingZip(zip)).toThrow(/index\.html/i);
  });

  it("rejects when a single file exceeds the limit", () => {
    const zip = buildZip({
      "index.html": html,
      "big.js": "x".repeat(4096),
    });
    expect(() =>
      extractLandingZip(zip, { maxSingleFileBytes: 1024 })
    ).toThrow(/too large/i);
  });

  it("rejects when the unzipped total exceeds the limit", () => {
    const zip = buildZip({
      "index.html": html,
      "a.js": "a".repeat(2048),
      "b.js": "b".repeat(2048),
    });
    expect(() =>
      extractLandingZip(zip, { maxSingleFileBytes: 4096, maxTotalUnzippedBytes: 3000 })
    ).toThrow(/too large/i);
  });

  it("rejects when there are too many files", () => {
    const entries: Record<string, string> = { "index.html": html };
    for (let i = 0; i < 5; i += 1) entries[`f${i}.js`] = "x";
    expect(() => extractLandingZip(buildZip(entries), { maxFiles: 3 })).toThrow(
      /more than 3 files/i
    );
  });

  it("drops unknown types but keeps going", () => {
    const zip = buildZip({
      "index.html": html,
      "design.psd": "x",
      ".DS_Store": "junk",
    });
    const result = extractLandingZip(zip);
    expect(result.files.map((f) => f.path)).toEqual(["index.html"]);
    expect(result.skippedCount).toBe(2);
  });

  it("sanitizes SVG files", () => {
    const zip = buildZip({
      "index.html": html,
      "logo.svg": '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="2"/></svg>',
    });
    const result = extractLandingZip(zip);
    const svg = new TextDecoder().decode(
      result.files.find((f) => f.path === "logo.svg")!.data
    );
    expect(svg).not.toMatch(/script/i);
    expect(svg).toContain("<circle");
  });

  it("throws a clear error for corrupt archives", () => {
    expect(() => extractLandingZip(new Uint8Array([1, 2, 3, 4]))).toThrow(
      LandingZipError
    );
  });
});

describe("limits", () => {
  it("uses the documented defaults", () => {
    expect(LANDING_LIMITS.maxFiles).toBe(2000);
    expect(LANDING_LIMITS.maxTotalUnzippedBytes).toBe(300 * 1024 * 1024);
  });

  it("reads extensions safely", () => {
    expect(extensionOf("a/b/index.HTML")).toBe("html");
    expect(extensionOf("no-extension")).toBe("");
    expect(extensionOf(".env")).toBe("");
  });
});
