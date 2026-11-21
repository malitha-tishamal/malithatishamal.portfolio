// src/app/api/admin/seed-blogs/route.ts
// API route to seed all defaultBlogPosts into Firestore.
// POST /api/admin/seed-blogs
//
// This pushes all blog posts (including the new networking, DevOps,
// and software engineering articles) into the "blogs" Firestore collection
// so the data is fully dynamic — not hard‑coded.

import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { defaultBlogPosts } from "@/types/blog";

export async function POST(request: Request) {
  try {
    // Optional: check for a secret key to prevent public access
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const expectedKey = process.env.SEED_SECRET_KEY;
    if (expectedKey && key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogsRef = collection(db, "blogs");

    // Check existing docs to decide skip vs overwrite
    const existingSnap = await getDocs(blogsRef);
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));

    const results: { id: string; action: string }[] = [];

    for (const post of defaultBlogPosts) {
      const docRef = doc(blogsRef, post.id);
      const action = existingIds.has(post.id) ? "updated" : "created";

      await setDoc(docRef, {
        ...post,
        createdAt: existingIds.has(post.id) ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      results.push({ id: post.id, action });
    }

    await setDoc(
      doc(db, "siteContent", "blogsConfig"),
      { initialized: true, deletedDefaultIds: [], updatedAt: serverTimestamp() },
      { merge: true }
    );

    revalidateTag("blogs");
    revalidatePath("/");
    revalidatePath("/blog");

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} blog posts into Firestore.`,
      results,
    });
  } catch (error: any) {
    console.error("Error seeding blogs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed blogs" },
      { status: 500 }
    );
  }
}
