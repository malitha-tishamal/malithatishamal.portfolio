import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PORTFOLIO_CATEGORIES } from "@/types/portfolio";

export const BUILT_IN_PORTFOLIO_CATEGORIES = PORTFOLIO_CATEGORIES.filter(
  (c) => c !== "All Photos" && c !== "All"
);

/**
 * Fetch custom portfolio categories from Firestore (siteContent/portfolioCategories)
 */
export async function loadCustomPortfolioCategories(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "portfolioCategories"));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.categories) ? data.categories.filter(Boolean) : [];
  } catch (err) {
    console.warn("Could not load custom portfolio categories:", err);
    return [];
  }
}

/**
 * Save a new custom category to Firestore
 */
export async function saveCustomPortfolioCategory(newCategory: string): Promise<{
  success: boolean;
  categories: string[];
  message: string;
}> {
  const trimmed = newCategory.trim();
  if (!trimmed) {
    return { success: false, categories: [], message: "Category name cannot be empty." };
  }

  // Check if it already matches a built-in category
  const isBuiltIn = BUILT_IN_PORTFOLIO_CATEGORIES.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (isBuiltIn) {
    return { success: true, categories: [], message: "Category already exists in built-in list." };
  }

  try {
    const snap = await getDoc(doc(db, "siteContent", "portfolioCategories"));
    const existing: string[] =
      snap.exists() && Array.isArray(snap.data().categories) ? snap.data().categories : [];

    const alreadyExists = existing.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      return { success: true, categories: existing, message: "Category already exists." };
    }

    const updated = [...existing, trimmed];
    await setDoc(
      doc(db, "siteContent", "portfolioCategories"),
      {
        categories: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, categories: updated, message: `Category "${trimmed}" added successfully!` };
  } catch (err: any) {
    console.error("Error saving custom portfolio category:", err);
    return { success: false, categories: [], message: err.message || "Failed to save category." };
  }
}

/**
 * Delete a custom category from Firestore
 */
export async function deleteCustomPortfolioCategory(categoryToDelete: string): Promise<{
  success: boolean;
  categories: string[];
  message: string;
}> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "portfolioCategories"));
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
      doc(db, "siteContent", "portfolioCategories"),
      {
        categories: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, categories: updated, message: `Category "${categoryToDelete}" deleted.` };
  } catch (err: any) {
    console.error("Error deleting custom portfolio category:", err);
    return { success: false, categories: [], message: err.message || "Failed to delete category." };
  }
}

/**
 * Returns merged unique list of built-in and custom categories
 */
export function getCombinedPortfolioCategories(customCategories: string[] = []): string[] {
  const merged = Array.from(new Set([...BUILT_IN_PORTFOLIO_CATEGORIES, ...customCategories]));
  return merged;
}
