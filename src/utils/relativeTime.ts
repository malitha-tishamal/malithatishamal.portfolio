/** Relative-time helper for the "Latest · 1 month ago" badges. */

export type DateLike =
  | Date
  | number
  | string
  | { seconds?: number; toDate?: () => Date }
  | null
  | undefined;

/** Normalise Firestore Timestamps, ISO strings, epoch numbers and Dates. */
export function toDateValue(value: DateLike): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      try {
        const date = value.toDate();
        return Number.isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }
    if (typeof value.seconds === "number") {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
// "always" keeps the badge readable: "1 month ago" instead of "last month".
const relativeAlways = new Intl.RelativeTimeFormat("en", { numeric: "always" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * "just now", "5 minutes ago", "3 hours ago", "yesterday", "2 days ago",
 * "3 weeks ago", "1 month ago", "2 months ago", "1 year ago".
 */
export function formatRelativeTime(value: DateLike, now: Date = new Date()): string {
  const date = toDateValue(value);
  if (!date) return "recently";

  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  if (abs < 45_000) return "just now";

  if (abs < HOUR) return relative.format(Math.round(diff / MINUTE), "minute");
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), "hour");
  if (abs < 2 * DAY) {
    return relative.format(diff < 0 ? -1 : 1, "day");
  }
  if (abs < WEEK) return relative.format(Math.round(diff / DAY), "day");
  if (abs < 4 * WEEK) return relativeAlways.format(Math.round(diff / WEEK), "week");
  if (abs < YEAR) return relativeAlways.format(Math.round(diff / MONTH), "month");
  return relativeAlways.format(Math.round(diff / YEAR), "year");
}
