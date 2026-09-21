import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const hoverSessionKey = (certId: string) => `cert_hover_${certId}`;
const sectionSessionKey = "cert_section_viewed";

export async function trackCertificationClick(certId: string): Promise<void> {
  if (!certId) return;
  try {
    await setDoc(
      doc(db, "certifications", certId),
      { clickCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Certification click tracking failed:", err);
  }
}

export async function trackCertificationHover(certId: string): Promise<void> {
  if (!certId || typeof sessionStorage === "undefined") return;

  const key = hoverSessionKey(certId);
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");

  try {
    await setDoc(
      doc(db, "certifications", certId),
      { hoverCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Certification hover tracking failed:", err);
  }
}

export async function trackCertificationSectionView(): Promise<void> {
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sectionSessionKey)) {
    return;
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(sectionSessionKey, "1");
  }

  try {
    await setDoc(
      doc(db, "siteContent", "certificationAnalytics"),
      { sectionViewCount: increment(1) },
      { merge: true }
    );
  } catch (err) {
    console.warn("Certification section view tracking failed:", err);
  }
}
