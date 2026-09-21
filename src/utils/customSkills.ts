import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setCustomSkills, skillExistsInDatabase } from "@/data/skillsDatabase";

const CUSTOM_SKILLS_DOC = "siteContent/customSkills";

export async function loadCustomSkillsFromFirestore(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "siteContent", "customSkills"));
    if (!snap.exists()) return [];
    const data = snap.data();
    const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : [];
    setCustomSkills(skills);
    return skills;
  } catch (err) {
    console.warn("Could not load custom skills:", err);
    return [];
  }
}

export async function registerCustomSkills(skills: string[]): Promise<string[]> {
  const newSkills = skills.filter((s) => s.trim() && !skillExistsInDatabase(s.trim()));
  if (newSkills.length === 0) return [];

  try {
    const snap = await getDoc(doc(db, "siteContent", "customSkills"));
    const existing: string[] = snap.exists() && Array.isArray(snap.data().skills)
      ? snap.data().skills
      : [];

    const merged = [...existing];
    const added: string[] = [];

    for (const skill of newSkills) {
      const trimmed = skill.trim();
      if (!trimmed) continue;
      const exists = merged.some((s) => s.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        merged.push(trimmed);
        added.push(trimmed);
      }
    }

    if (added.length === 0) return [];

    await setDoc(
      doc(db, "siteContent", "customSkills"),
      { skills: merged, updatedAt: serverTimestamp() },
      { merge: true }
    );

    setCustomSkills(merged);
    return added;
  } catch (err) {
    console.error("Failed to register custom skills:", err);
    return [];
  }
}
