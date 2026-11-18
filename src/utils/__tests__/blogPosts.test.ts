import { describe, expect, it } from "vitest";
import { isPostVisible, sortPostsByDate } from "@/utils/blogPosts";
import { BlogPost } from "@/types/blog";

const base = (overrides: Partial<BlogPost>): BlogPost => ({
  id: "id",
  slug: "slug",
  title: "Title",
  excerpt: "Excerpt",
  category: "Web Development",
  coverImage: "/images/blog/blog_1.png",
  content: "",
  author: { name: "A", role: "R", avatar: "" },
  date: "2025-01-01",
  tags: [],
  published: true,
  ...overrides,
});

describe("isPostVisible", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("shows published posts dated in the past", () => {
    expect(isPostVisible(base({ date: "2026-05-01" }), now)).toBe(true);
  });

  it("hides drafts", () => {
    expect(isPostVisible(base({ published: false }), now)).toBe(false);
  });

  it("hides scheduled posts dated in the future", () => {
    expect(isPostVisible(base({ date: "2026-07-01" }), now)).toBe(false);
  });

  it("keeps a post whose date cannot be parsed", () => {
    expect(isPostVisible(base({ date: "not a date" }), now)).toBe(true);
  });
});

describe("sortPostsByDate", () => {
  it("orders newest first and keeps input order on ties", () => {
    const a = base({ id: "a", date: "2025-01-01" });
    const b = base({ id: "b", date: "2025-03-01" });
    const c = base({ id: "c", date: "2025-03-01" });
    expect(sortPostsByDate([a, b, c]).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input", () => {
    const posts = [base({ id: "a", date: "2025-01-01" }), base({ id: "b", date: "2025-02-01" })];
    sortPostsByDate(posts);
    expect(posts.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
