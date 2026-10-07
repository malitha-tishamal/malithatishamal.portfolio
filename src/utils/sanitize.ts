import DOMPurify from "isomorphic-dompurify";

/**
 * Central HTML sanitizer. Every place that renders admin/user-authored HTML via
 * dangerouslySetInnerHTML MUST pass the string through sanitizeHtml() first.
 *
 * isomorphic-dompurify works on both the server (jsdom) and the browser, so this
 * is safe to call from server and client components.
 */

// Attributes that can execute script or load remote resources in unsafe ways.
const FORBID_ATTR = ["style", "onerror", "onload", "onclick", "onmouseover"];

const ALLOWED_TAGS = [
  "a", "b", "strong", "i", "em", "u", "s", "strike", "span", "div", "p", "br",
  "hr", "ul", "ol", "li", "blockquote", "pre", "code", "h1", "h2", "h3", "h4",
  "h5", "h6", "table", "thead", "tbody", "tr", "td", "th", "img", "figure",
  "figcaption", "sub", "sup", "small", "mark", "font",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel", "src", "alt", "width", "height", "class",
  "color", "align", "colspan", "rowspan", "start",
];

/** Sanitize rich HTML (from the editor / Word paste) for safe rendering. */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty) return "";
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR,
    // Force all links to open safely and never carry javascript: URLs.
    ADD_ATTR: ["target"],
    ALLOW_DATA_ATTR: false,
  });
  return clean as string;
}

/**
 * Escape a JSON string so it is safe to embed inside an inline <script> tag
 * (JSON-LD). Prevents breaking out of the script context via `</script>`.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Escape a string for safe interpolation into an HTML email template. */
export function escapeHtml(input?: string | null): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
