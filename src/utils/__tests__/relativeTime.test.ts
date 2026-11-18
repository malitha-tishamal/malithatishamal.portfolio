import { describe, expect, it } from "vitest";
import { formatRelativeTime, toDateValue } from "../relativeTime";

/** 2026-11-18 12:00 in Asia/Colombo (UTC+05:30). */
const NOW = new Date("2026-11-18T06:30:00.000Z");

const before = (ms: number) => new Date(NOW.getTime() - ms);

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Build a Colombo wall-clock instant, e.g. colombo("2025-12-18T12:00:00"). */
const colombo = (local: string) => new Date(`${local}+05:30`);

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
  it("shows 'just now' up to the 60 second mark", () => {
    expect(formatRelativeTime(before(30 * SECOND), NOW)).toBe("just now");
    expect(formatRelativeTime(before(59 * SECOND), NOW)).toBe("just now");
  });

  it("switches to minutes at exactly 60 seconds", () => {
    expect(formatRelativeTime(before(60 * SECOND), NOW)).toBe("1 minute ago");
    expect(formatRelativeTime(before(5 * MINUTE), NOW)).toBe("5 minutes ago");
    expect(formatRelativeTime(before(59 * MINUTE), NOW)).toBe("59 minutes ago");
  });

  it("switches to hours at exactly 60 minutes", () => {
    expect(formatRelativeTime(before(60 * MINUTE), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(before(3 * HOUR), NOW)).toBe("3 hours ago");
    expect(formatRelativeTime(before(23 * HOUR), NOW)).toBe("23 hours ago");
  });

  it("uses 'yesterday' for 24 hours", () => {
    expect(formatRelativeTime(before(24 * HOUR), NOW)).toBe("yesterday");
  });

  it("counts 47 hours as two calendar days", () => {
    // 12:00 on Nov 18 → 13:00 on Nov 16 in Colombo.
    expect(formatRelativeTime(before(47 * HOUR), NOW)).toBe("2 days ago");
  });

  it("formats days 2–6", () => {
    expect(formatRelativeTime(before(2 * DAY), NOW)).toBe("2 days ago");
    expect(formatRelativeTime(before(3 * DAY), NOW)).toBe("3 days ago");
    expect(formatRelativeTime(before(4 * DAY), NOW)).toBe("4 days ago");
    expect(formatRelativeTime(before(5 * DAY), NOW)).toBe("5 days ago");
    expect(formatRelativeTime(before(6 * DAY), NOW)).toBe("6 days ago");
  });

  it("formats weeks 7–29 days (floor of days / 7)", () => {
    expect(formatRelativeTime(before(7 * DAY), NOW)).toBe("1 week ago");
    expect(formatRelativeTime(before(10 * DAY), NOW)).toBe("1 week ago");
    expect(formatRelativeTime(before(14 * DAY), NOW)).toBe("2 weeks ago");
    expect(formatRelativeTime(before(21 * DAY), NOW)).toBe("3 weeks ago");
    expect(formatRelativeTime(before(28 * DAY), NOW)).toBe("4 weeks ago");
    expect(formatRelativeTime(before(29 * DAY), NOW)).toBe("4 weeks ago");
  });

  it("formats calendar months from 30 days", () => {
    expect(formatRelativeTime(before(30 * DAY), NOW)).toBe("1 month ago");
    expect(formatRelativeTime(before(35 * DAY), NOW)).toBe("1 month ago");
    expect(formatRelativeTime(colombo("2026-09-18T12:00:00"), NOW)).toBe("2 months ago");
    expect(formatRelativeTime(colombo("2026-06-18T12:00:00"), NOW)).toBe("5 months ago");
    expect(formatRelativeTime(colombo("2025-12-18T12:00:00"), NOW)).toBe("11 months ago");
  });

  it("formats years from 12 calendar months", () => {
    expect(formatRelativeTime(colombo("2025-10-18T12:00:00"), NOW)).toBe("1 year ago");
    expect(formatRelativeTime(colombo("2023-11-18T12:00:00"), NOW)).toBe("3 years ago");
  });

  it("handles leap years and month ends", () => {
    expect(
      formatRelativeTime(colombo("2024-02-29T12:00:00"), colombo("2025-03-01T12:00:00"))
    ).toBe("1 year ago");
    // Day-of-month not reached yet → one month less.
    expect(
      formatRelativeTime(colombo("2026-01-31T12:00:00"), colombo("2026-03-30T12:00:00"))
    ).toBe("1 month ago");
    expect(
      formatRelativeTime(colombo("2026-01-31T12:00:00"), colombo("2026-03-31T12:00:00"))
    ).toBe("2 months ago");
  });

  it("counts calendar days in Asia/Colombo, not UTC", () => {
    // Colombo: Nov 18 00:30 vs Nov 16 23:30 → 25 hours → 2 calendar days.
    expect(
      formatRelativeTime(
        new Date("2026-11-16T18:00:00.000Z"),
        new Date("2026-11-17T19:00:00.000Z")
      )
    ).toBe("2 days ago");

    // Colombo: just after midnight vs just before it → minutes, same UTC day.
    expect(
      formatRelativeTime(
        new Date("2026-11-17T18:29:00.000Z"),
        new Date("2026-11-17T18:31:00.000Z")
      )
    ).toBe("2 minutes ago");
  });

  it("never shows future or invalid dates", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + HOUR), NOW)).toBeNull();
    expect(formatRelativeTime(null, NOW)).toBeNull();
    expect(formatRelativeTime(undefined, NOW)).toBeNull();
    expect(formatRelativeTime("garbage", NOW)).toBeNull();
    expect(formatRelativeTime("", NOW)).toBeNull();
  });
});
