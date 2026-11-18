/**
 * Relative-time helper for every card pill ("3 days ago", "1 week ago", …).
 *
 * Calendar days/months are measured in Asia/Colombo wall-clock time, so a card
 * dated just after midnight does not jump a day early for visitors in another
 * timezone. Sub-day values use the real elapsed time.
 */

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

const TIME_ZONE = "Asia/Colombo";

const colomboParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function colomboDate(date: Date): CalendarDate {
  const parts = colomboParts.formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/** Whole calendar days between two instants, counted on Colombo wall-clock dates. */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = colomboDate(from);
  const b = colomboDate(to);
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bUtc - aUtc) / 86_400_000);
}

/** Whole calendar months, adjusted when the day-of-month has not been reached yet. */
function calendarMonthsBetween(from: Date, to: Date): number {
  const a = colomboDate(from);
  const b = colomboDate(to);
  const months = (b.year - a.year) * 12 + (b.month - a.month) - (b.day < a.day ? 1 : 0);
  return months;
}

const plural = (value: number, unit: string): string =>
  `${value} ${unit}${value === 1 ? "" : "s"} ago`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now", "5 minutes ago", "3 hours ago", "yesterday", "2 days ago",
 * "3 weeks ago", "2 months ago", "1 year ago".
 *
 * Returns `null` for missing/invalid dates and for future (scheduled) dates so
 * callers can hide the pill instead of showing a wrong value.
 */
export function formatRelativeTime(value: DateLike, now: Date = new Date()): string | null {
  const date = toDateValue(value);
  if (!date) return null;

  const diff = now.getTime() - date.getTime();
  if (diff < 0) return null;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return plural(Math.floor(diff / HOUR), "hour");

  const days = calendarDaysBetween(date, now);
  if (days <= 1) return "yesterday";
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");

  // 30 days or more: calendar months. Anything short of a full month still
  // reads "1 month ago" (30 days is the documented cut-off).
  const months = Math.max(1, calendarMonthsBetween(date, now));
  if (months < 12) return plural(months, "month");

  return plural(Math.floor(months / 12), "year");
}
