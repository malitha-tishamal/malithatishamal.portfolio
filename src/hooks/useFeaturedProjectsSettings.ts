"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FEATURED_PROJECTS_COLLECTION,
  FEATURED_PROJECTS_DEFAULTS,
  FEATURED_PROJECTS_DOC_ID,
  normalizeFeaturedProjectsSettings,
  type FeaturedProjectsSettings,
} from "@/types/featuredProjects";

/**
 * Live view of the section settings. Firestore's listener means an admin save
 * shows up on the public site within seconds — no rebuild or revalidation.
 */
export function useFeaturedProjectsSettings(): FeaturedProjectsSettings {
  const [settings, setSettings] = useState<FeaturedProjectsSettings>(
    FEATURED_PROJECTS_DEFAULTS
  );

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, FEATURED_PROJECTS_COLLECTION, FEATURED_PROJECTS_DOC_ID),
        (snapshot) => {
          if (snapshot.exists()) {
            setSettings(normalizeFeaturedProjectsSettings(snapshot.data()));
          } else {
            setSettings(FEATURED_PROJECTS_DEFAULTS);
          }
        },
        (error) => {
          console.warn("Featured projects settings listener notice:", error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not subscribe to featured project settings:", err);
      return undefined;
    }
  }, []);

  return settings;
}

export default useFeaturedProjectsSettings;
