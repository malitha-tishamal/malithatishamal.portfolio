/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

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
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.cloudinary.com https://api.ipify.org https://ipapi.co https://accounts.google.com wss:",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.firebaseio.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
  images: {
    unoptimized: true,
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

export default nextConfig;
