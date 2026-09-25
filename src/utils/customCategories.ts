import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CERTIFICATION_CATEGORIES } from "@/types/certification";

const CATEGORIES_DOC = "siteContent/certificationCategories";

/**
 * Built-in default categories that cannot be deleted
 */
export const BUILT_IN_CATEGORIES = CERTIFICATION_CATEGORIES.filter((c) => c !== "All");

/**
 * Fetch custom certification categories from Firestore
 */
export async function loadCustomCertificationCategories(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "certificationCategories"));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.categories) ? data.categories.filter(Boolean) : [];
  } catch (err) {
    console.warn("Could not load custom certification categories:", err);
    return [];
  }
}

/**
 * Save a new custom category to Firestore and return the updated custom list
 */
export async function saveCustomCertificationCategory(newCategory: string): Promise<{
  success: boolean;
  categories: string[];
  message: string;
}> {
  const trimmed = newCategory.trim();
  if (!trimmed) {
    return { success: false, categories: [], message: "Category name cannot be empty." };
  }

  // Check if it already matches a built-in category
  const isBuiltIn = BUILT_IN_CATEGORIES.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (isBuiltIn) {
    return { success: true, categories: [], message: "Category already exists in built-in list." };
  }

  try {
    const snap = await getDoc(doc(db, "siteContent", "certificationCategories"));
    const existing: string[] = snap.exists() && Array.isArray(snap.data().categories)
      ? snap.data().categories
      : [];

    const alreadyExists = existing.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      return { success: true, categories: existing, message: "Category already exists." };
    }

    const updated = [...existing, trimmed];
    await setDoc(
      doc(db, "siteContent", "certificationCategories"),
      { categories: updated, updatedAt: serverTimestamp() },
      { merge: true }
    );

    return { success: true, categories: updated, message: `Category "${trimmed}" added successfully!` };
  } catch (err: any) {
    console.error("Failed to save custom category:", err);
    return { success: false, categories: [], message: err?.message || "Failed to save category." };
  }
}

/**
 * Remove a custom category from Firestore
 */
export async function deleteCustomCertificationCategory(categoryToDelete: string): Promise<{
  success: boolean;
  categories: string[];
}> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "certificationCategories"));
    if (!snap.exists()) return { success: true, categories: [] };
    const existing: string[] = Array.isArray(snap.data().categories) ? snap.data().categories : [];

    const updated = existing.filter(
      (c) => c.toLowerCase() !== categoryToDelete.toLowerCase()
    );

    await setDoc(
      doc(db, "siteContent", "certificationCategories"),
      { categories: updated, updatedAt: serverTimestamp() },
      { merge: true }
    );

    return { success: true, categories: updated };
  } catch (err) {
    console.error("Failed to delete custom category:", err);
    return { success: false, categories: [] };
  }
}

/**
 * Combine built-in categories and custom categories with deduplication
 */
export function getCombinedCategories(customCategories: string[] = []): string[] {
  const set = new Set<string>();
  BUILT_IN_CATEGORIES.forEach((c) => set.add(c));
  customCategories.forEach((c) => {
    if (c && c.trim()) set.add(c.trim());
  });
  return Array.from(set);
}
