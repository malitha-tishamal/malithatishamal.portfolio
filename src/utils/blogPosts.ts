import { BlogPost } from "@/types/blog";
import { toDateValue } from "@/utils/relativeTime";

/**
 * Drafts and future-dated (scheduled) posts never reach the public sections.
 * A post without a parsable date is still shown rather than silently hidden.
 */
export function isPostVisible(post: BlogPost, now: Date = new Date()): boolean {
  if (post.published === false) return false;
  const date = toDateValue(post.date);
  return !date || date.getTime() <= now.getTime();
}

/** Newest published date first; the original order breaks ties. */
export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return posts
    .map((post, index) => ({ post, index, date: toDateValue(post.date) }))
    .sort(
      (a, b) =>
        (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.index - b.index
    )
    .map((entry) => entry.post);
}
