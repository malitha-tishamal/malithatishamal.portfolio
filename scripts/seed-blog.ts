// scripts/seed-blog.ts
// Seed the blog posts (including the newly added networking / devops / SE posts) into Firestore.
// Run with: `node scripts/seed-blog.ts`

import { db } from "../src/lib/firebase";
import { collection, doc, setDoc, writeBatch, getDocs } from "firebase/firestore";
import { defaultBlogPosts } from "../src/types/blog";

// Firestore collection name for blog posts
const BLOG_COLLECTION = "blogs";

async function seed() {
  const batch = writeBatch(db);
  const collRef = collection(db, BLOG_COLLECTION);

  // Get existing IDs to avoid overwriting unintentionally (optional)
  const existingSnap = await getDocs(collRef);
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  for (const post of defaultBlogPosts) {
    // Use the `id` field as the document ID
    const docRef = doc(collRef, post.id);
    // If you want to always overwrite, comment out the check.
    if (existingIds.has(post.id)) {
      console.log(`⚠️ Skipping existing post ${post.id}`);
      continue;
    }
    batch.set(docRef, post);
    console.log(`✅ Queued ${post.id}`);
  }

  await batch.commit();
  console.log("🚀 Blog seeding complete.");
}

seed()
  .catch((e) => {
    console.error("❌ Error seeding blogs:", e);
    process.exit(1);
  });
