import { toDateValue, type DateLike } from "@/utils/relativeTime";

/**
 * One formatter for every blog date. `en-GB` gives "02 Feb 2025" without any
 * hand-typed month names, and invalid values fall back to the raw text.
 */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatBlogDate(value: DateLike): string {
  const date = toDateValue(value);
  if (!date) return typeof value === "string" ? value : "";
  return dateFormatter.format(date);
}
