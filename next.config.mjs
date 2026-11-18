import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  analyzerMode: "static",
  openAnalyzer: false,
  generateStatsFile: true,
});

// Content-Security-Policy. script-src keeps 'unsafe-inline' (Next.js bootstrap)
// and, in dev only, 'unsafe-eval' (HMR / react-refresh). DOMPurify remains the
// primary XSS defence; CSP is defence-in-depth.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  // Iconify ships icon data as JSON at runtime, so its API hosts must be reachable.
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.cloudinary.com https://api.ipify.org https://ipapi.co https://accounts.google.com https://api.pwnedpasswords.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com wss:",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.firebaseio.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 'self' instead of DENY: the admin panel previews uploaded landing pages in
  // a same-origin iframe, so framing by the site itself must stay possible.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Reporting-Endpoints", value: 'csp-endpoint="/api/csp-report"' },
];

// Uploaded landing pages get their own CSP. `sandbox` without allow-same-origin
// puts the document on an opaque origin: no cookies, no localStorage and no
// access to the portfolio origin. These rules come after the global one so the
// header value replaces the site CSP for /projects/{slug}/...
// Keep in sync with LANDING_PAGE_CSP in src/lib/landingPage/serve.ts.
const landingCsp = [
  "sandbox allow-scripts allow-forms allow-popups allow-modals allow-downloads",
  "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "script-src * data: blob: 'unsafe-inline' 'unsafe-eval'",
  "style-src * data: blob: 'unsafe-inline'",
  "img-src * data: blob:",
  "font-src * data:",
  "media-src * data: blob:",
  "connect-src * https: http: ws: wss:",
  "base-uri *",
  "form-action *",
  "frame-ancestors 'self'",
].join("; ");

const landingPageHeaders = [
  { key: "Content-Security-Policy", value: landingCsp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    // Content images come from Firebase Storage and Cloudinary; letting the
    // optimizer resize/re-encode them is the single biggest LCP win.
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 80],
    minimumCacheTTL: 31536000,
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 128, 200, 256, 320, 384, 460],
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@iconify/react", "date-fns", "react-slick"],
  },
  outputFileTracingExcludes: {
    '*': ['./venus-nextjs-1.0.0/**', './venus-nextjs-1.0.0.zip'],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Static art and self-hosted fonts are content-addressed by us and
        // never mutate in place, so they can be cached for a year.
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Signed-in areas and API responses must never be cached.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/projects/:slug",
        headers: landingPageHeaders,
      },
      {
        source: "/projects/:slug/:path*",
        headers: landingPageHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
