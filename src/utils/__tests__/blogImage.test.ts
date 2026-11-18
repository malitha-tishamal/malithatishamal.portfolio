import { describe, expect, it } from "vitest";
import { isValidCoverImageSource } from "@/utils/blogImage";
import { formatBlogDate } from "@/utils/blogDate";

describe("isValidCoverImageSource", () => {
  it("accepts site-relative paths", () => {
    expect(isValidCoverImageSource("/images/blog/blog_1.png")).toBe(true);
  });

  it("accepts http(s) URLs", () => {
    expect(isValidCoverImageSource("https://res.cloudinary.com/x/y.jpg")).toBe(true);
  });

  it("rejects protocol-relative, javascript and empty values", () => {
    expect(isValidCoverImageSource("//cdn.example.com/a.png")).toBe(false);
    expect(isValidCoverImageSource("javascript:alert(1)")).toBe(false);
    expect(isValidCoverImageSource("")).toBe(false);
    expect(isValidCoverImageSource("   ")).toBe(false);
  });
});

describe("formatBlogDate", () => {
  it("formats real dates without hand-typed month names", () => {
    expect(formatBlogDate("2025-02-02")).toBe("02 Feb 2025");
  });

  it("returns unparsable input unchanged", () => {
    expect(formatBlogDate("someday")).toBe("someday");
  });
});
