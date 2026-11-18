import { describe, expect, it } from "vitest";
import { formatRelativeTime, toDateValue } from "../relativeTime";

const NOW = new Date("2026-11-18T12:00:00.000Z");

const before = (ms: number) => new Date(NOW.getTime() - ms);

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("toDateValue", () => {
  it("accepts a Date", () => {
    expect(toDateValue(new Date("2026-11-01T00:00:00.000Z"))?.toISOString()).toBe(
      "2026-11-01T00:00:00.000Z"
    );
  });

  it("accepts an ISO string", () => {
    expect(toDateValue("2026-11-01T00:00:00.000Z")?.toISOString()).toBe(
      "2026-11-01T00:00:00.000Z"
    );
  });

  it("accepts epoch seconds", () => {
    expect(toDateValue(1_700_000_000)?.toISOString()).toBe(
      new Date(1_700_000_000_000).toISOString()
    );
  });

  it("accepts a Firestore timestamp with toDate()", () => {
    const stamp = { toDate: () => new Date("2026-10-01T00:00:00.000Z") };
    expect(toDateValue(stamp)?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("accepts a { seconds } object", () => {
    expect(toDateValue({ seconds: 1_700_000_000 })?.toISOString()).toBe(
      new Date(1_700_000_000_000).toISOString()
    );
  });

  it("returns null for empty or invalid values", () => {
    expect(toDateValue(null)).toBeNull();
    expect(toDateValue(undefined)).toBeNull();
    expect(toDateValue("")).toBeNull();
    expect(toDateValue("not a date")).toBeNull();
    expect(toDateValue(new Date("nope"))).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  it("shows 'just now' for anything under 45 seconds", () => {
    expect(formatRelativeTime(before(5 * SECOND), NOW)).toBe("just now");
    expect(formatRelativeTime(before(44 * SECOND), NOW)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(before(1 * MINUTE), NOW)).toBe("1 minute ago");
    expect(formatRelativeTime(before(5 * MINUTE), NOW)).toBe("5 minutes ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(before(1 * HOUR), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(before(3 * HOUR), NOW)).toBe("3 hours ago");
  });

  it("uses 'yesterday' for a single day", () => {
    expect(formatRelativeTime(before(DAY + 2 * HOUR), NOW)).toBe("yesterday");
  });

  it("formats multiple days", () => {
    expect(formatRelativeTime(before(3 * DAY), NOW)).toBe("3 days ago");
  });

  it("formats weeks", () => {
    expect(formatRelativeTime(before(21 * DAY), NOW)).toBe("3 weeks ago");
  });

  it("formats months", () => {
    expect(formatRelativeTime(before(35 * DAY), NOW)).toBe("1 month ago");
    expect(formatRelativeTime(before(70 * DAY), NOW)).toBe("2 months ago");
  });

  it("formats years with correct singular/plural", () => {
    expect(formatRelativeTime(before(400 * DAY), NOW)).toBe("1 year ago");
    expect(formatRelativeTime(before(800 * DAY), NOW)).toBe("2 years ago");
  });

  it("falls back to 'recently' for unparsable dates", () => {
    expect(formatRelativeTime(null, NOW)).toBe("recently");
    expect(formatRelativeTime("garbage", NOW)).toBe("recently");
  });
});
