import { doc, setDoc, increment, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TechItem } from "@/types/techstack";
import { getClientIP, getTodayDate } from "@/utils/visitorTracking";

let cachedClientIp: string | null = null;

async function getOrFetchIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;
  try {
    cachedClientIp = await getClientIP();
    return cachedClientIp || "Unknown";
  } catch {
    return "Unknown";
  }
}

function getDeviceInfo() {
  if (typeof navigator === "undefined") {
    return { browser: "Unknown", device: "Desktop", userAgent: "Unknown" };
  }
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  let device = "Desktop";
  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/iPad|Tablet/i.test(ua)) device = "Tablet";

  return { browser, device, userAgent: ua };
}

function getMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Record an activity event in Firestore techStackActivityLogs
 */
async function logActivity(
  item: TechItem,
  eventType: "click" | "hover" | "modal_open"
) {
  try {
    const ip = await getOrFetchIp();
    const { browser, device, userAgent } = getDeviceInfo();
    const today = getTodayDate();
    const month = getMonthString();

    await addDoc(collection(db, "techStackActivityLogs"), {
      itemId: item.id,
      itemName: item.name,
      categoryId: item.categoryId || "",
      eventType,
      ip,
      browser,
      device,
      userAgent,
      dateString: today,
      monthString: month,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Error logging tech activity:", err);
  }
}

/**
 * Tracks when a user hovers over a tech stack card
 * Deduplicated per browser session per tech item
 */
export async function trackTechStackHover(item: TechItem): Promise<void> {
  if (!item?.id || typeof sessionStorage === "undefined") return;

  const sessionKey = `tech_hover_${item.id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");

  try {
    // 1. Update item document
    await setDoc(
      doc(db, "techItems", item.id),
      { hoverCount: increment(1) },
      { merge: true }
    );

    // 2. Update aggregate analytics document
    await setDoc(
      doc(db, "siteContent", "techStackAnalytics"),
      {
        totalHovers: increment(1),
        [`hovers_${getTodayDate()}`]: increment(1),
        [`hovers_${getMonthString()}`]: increment(1),
      },
      { merge: true }
    );

    // 3. Log detailed activity entry
    await logActivity(item, "hover");
  } catch (err) {
    console.warn("Tech stack hover tracking error:", err);
  }
}

/**
 * Tracks when a user clicks on a tech stack card (modal open trigger)
 */
export async function trackTechStackClick(item: TechItem): Promise<void> {
  if (!item?.id) return;

  try {
    // 1. Update item document click & modalOpen counts
    await setDoc(
      doc(db, "techItems", item.id),
      {
        clickCount: increment(1),
        modalOpenCount: increment(1),
      },
      { merge: true }
    );

    // 2. Update aggregate analytics document
    await setDoc(
      doc(db, "siteContent", "techStackAnalytics"),
      {
        totalClicks: increment(1),
        totalModalOpens: increment(1),
        [`clicks_${getTodayDate()}`]: increment(1),
        [`clicks_${getMonthString()}`]: increment(1),
        [`modalOpens_${getTodayDate()}`]: increment(1),
        [`modalOpens_${getMonthString()}`]: increment(1),
      },
      { merge: true }
    );

    // 3. Log detailed activity entry
    await logActivity(item, "click");
    await logActivity(item, "modal_open");
  } catch (err) {
    console.warn("Tech stack click tracking error:", err);
  }
}
