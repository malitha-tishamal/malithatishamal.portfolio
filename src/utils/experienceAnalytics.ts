import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const hoverSessionKey = (itemId: string) => `exp_hover_${itemId}`;
const sectionSessionKey = "exp_section_viewed";

/**
 * Tracks when a user clicks on an Experience or Education card (opens details modal)
 */
export async function trackExperienceClick(itemId: string): Promise<void> {
  if (!itemId) return;
  try {
    await setDoc(
      doc(db, "experiences", itemId),
      { clickCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Experience click tracking failed:", err);
  }
}

/**
 * Tracks when a user hovers over an Experience or Education card
 * Uses sessionStorage to count unique hover sessions per item
 */
export async function trackExperienceHover(itemId: string): Promise<void> {
  if (!itemId || typeof sessionStorage === "undefined") return;

  const key = hoverSessionKey(itemId);
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  try {
    await setDoc(
      doc(db, "experiences", itemId),
      { hoverCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Experience hover tracking failed:", err);
  }
}

/**
 * Tracks when the user scrolls into the Experience & Education section on the page
 * Deduplicated per visitor session
 */
export async function trackExperienceSectionView(): Promise<void> {
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sectionSessionKey)) {
    return;
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(sectionSessionKey, "1");
  }

  try {
    await setDoc(
      doc(db, "siteContent", "experienceAnalytics"),
      { sectionViewCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Experience section view tracking failed:", err);
  }
}
