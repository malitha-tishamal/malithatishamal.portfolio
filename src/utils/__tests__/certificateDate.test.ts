import { describe, expect, it } from "vitest";
import {
  formatCertificateDate,
  formatCertificateExpiry,
  getCertificateIssueDate,
  parseCertificateDate,
} from "../certificateDate";

describe("parseCertificateDate", () => {
  it("reads ISO dates with day precision", () => {
    const parsed = parseCertificateDate("2023-09-11");
    expect(parsed?.precision).toBe("day");
    expect(parsed?.date.getFullYear()).toBe(2023);
    expect(parsed?.date.getMonth()).toBe(8);
    expect(parsed?.date.getDate()).toBe(11);
  });

  it("reads ISO month precision", () => {
    const parsed = parseCertificateDate("2026-09");
    expect(parsed?.precision).toBe("month");
    expect(parsed?.date.getMonth()).toBe(8);
  });

  it("reads month + year text", () => {
    expect(parseCertificateDate("Mar 2026")?.precision).toBe("month");
    expect(parseCertificateDate("Mar 2026")?.date.getMonth()).toBe(2);
  });

  it("survives a misspelled month", () => {
    expect(formatCertificateDate("Sepeember 2026")).toBe("September 2026");
  });

  it("accepts abbreviations and separators", () => {
    expect(formatCertificateDate("Sept, 2026")).toBe("September 2026");
    expect(formatCertificateDate("Sep-2026")).toBe("September 2026");
    expect(formatCertificateDate("9/2026")).toBe("September 2026");
  });

  it("keeps June and July apart", () => {
    expect(formatCertificateDate("jun 2026")).toBe("June 2026");
    expect(formatCertificateDate("jul 2026")).toBe("July 2026");
  });

  it("reads full dates in either order", () => {
    expect(formatCertificateDate("September 11, 2023")).toBe("September 11, 2023");
    expect(formatCertificateDate("11 September 2023")).toBe("September 11, 2023");
  });

  it("returns null for junk", () => {
    expect(parseCertificateDate("whenever")).toBeNull();
    expect(parseCertificateDate("")).toBeNull();
    expect(parseCertificateDate(null)).toBeNull();
  });
});

describe("formatCertificateDate", () => {
  it("spells month + year without a day", () => {
    expect(formatCertificateDate("2026-09")).toBe("September 2026");
  });

  it("falls back to the raw text when unparseable", () => {
    expect(formatCertificateDate("Mid 2026")).toBe("Mid 2026");
  });

  it("formats a Date instance", () => {
    expect(formatCertificateDate(new Date(2023, 8, 11))).toBe("September 11, 2023");
  });
});

describe("formatCertificateExpiry", () => {
  it("normalises empty and lifetime values", () => {
    expect(formatCertificateExpiry()).toBe("No Expiration");
    expect(formatCertificateExpiry("")).toBe("No Expiration");
    expect(formatCertificateExpiry("No Expiration")).toBe("No Expiration");
    expect(formatCertificateExpiry("never")).toBe("No Expiration");
  });

  it("formats a real expiry date", () => {
    expect(formatCertificateExpiry("Mar 2029")).toBe("March 2029");
  });
});

describe("getCertificateIssueDate", () => {
  it("prefers the issue date", () => {
    const date = getCertificateIssueDate({
      issueDate: "Mar 2026",
      createdAt: "2027-01-01T00:00:00.000Z",
    });
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
  });

  it("falls back to the created date", () => {
    const date = getCertificateIssueDate({ issueDate: "whenever", createdAt: "2026-05-04" });
    expect(date?.getMonth()).toBe(4);
  });
});
