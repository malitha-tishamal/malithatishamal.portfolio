import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECT_CATEGORIES } from "@/types/project";

export const BUILT_IN_PROJECT_CATEGORIES = PROJECT_CATEGORIES.filter(
  (c) => c !== "All Projects" && c !== "All"
);

/**
 * Fetch custom project categories from Firestore (siteContent/projectCategories)
 */
export async function loadCustomProjectCategories(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "projectCategories"));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.categories) ? data.categories.filter(Boolean) : [];
  } catch (err) {
    console.warn("Could not load custom project categories:", err);
    return [];
  }
}

/**
 * Save a new custom category to Firestore
 */
export async function saveCustomProjectCategory(newCategory: string): Promise<{
  success: boolean;
  categories: string[];
  message: string;
}> {
  const trimmed = newCategory.trim();
  if (!trimmed) {
    return { success: false, categories: [], message: "Category name cannot be empty." };
  }

  const isBuiltIn = BUILT_IN_PROJECT_CATEGORIES.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (isBuiltIn) {
    return { success: true, categories: [], message: "Category already exists in built-in list." };
  }

  try {
    const snap = await getDoc(doc(db, "siteContent", "projectCategories"));
    const existing: string[] =
      snap.exists() && Array.isArray(snap.data().categories) ? snap.data().categories : [];

    const alreadyExists = existing.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      return { success: true, categories: existing, message: "Category already exists." };
    }

    const updated = [...existing, trimmed];
    await setDoc(
      doc(db, "siteContent", "projectCategories"),
      {
        categories: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      categories: updated,
      message: `Category "${trimmed}" saved successfully!`,
    };
  } catch (err: any) {
    console.error("Save custom project category error:", err);
    return {
      success: false,
      categories: [],
      message: err.message || "Failed to save category.",
    };
  }
}

/**
 * Delete a custom category from Firestore
 */
export async function deleteCustomProjectCategory(categoryToDelete: string): Promise<{
  success: boolean;
  categories: string[];
  message: string;
}> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "projectCategories"));
    if (!snap.exists()) {
      return { success: false, categories: [], message: "No custom categories found." };
    }

    const existing: string[] = Array.isArray(snap.data().categories)
      ? snap.data().categories
      : [];
    const updated = existing.filter(
      (c) => c.toLowerCase() !== categoryToDelete.toLowerCase().trim()
    );

    await setDoc(
      doc(db, "siteContent", "projectCategories"),
      {
        categories: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      categories: updated,
      message: `Category "${categoryToDelete}" deleted.`,
    };
  } catch (err: any) {
    console.error("Delete custom project category error:", err);
    return {
      success: false,
      categories: [],
      message: err.message || "Failed to delete category.",
    };
  }
}

/**
 * Return built-in categories merged with any custom ones loaded from Firestore.
 */
export function getCombinedProjectCategories(customCategories: string[]): string[] {
  const combined = [...BUILT_IN_PROJECT_CATEGORIES];
  customCategories.forEach((cat) => {
    if (!combined.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      combined.push(cat);
    }
  });
  return combined;
}
