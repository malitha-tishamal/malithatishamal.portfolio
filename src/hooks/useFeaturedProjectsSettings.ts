"use client";

import { useEffect, useState } from "react";
import {
  FEATURED_PROJECTS_COLLECTION,
  FEATURED_PROJECTS_DEFAULTS,
  FEATURED_PROJECTS_DOC_ID,
  normalizeFeaturedProjectsSettings,
  type FeaturedProjectsSettings,
} from "@/types/featuredProjects";

/**
 * Section settings for the project grids.
 *
 * The Firestore SDK is imported after hydration (and only once) so the cards
 * render from defaults immediately instead of waiting on a 55 kB module.
 */
export function useFeaturedProjectsSettings(
  initial: FeaturedProjectsSettings = FEATURED_PROJECTS_DEFAULTS
): FeaturedProjectsSettings {
  const [settings, setSettings] = useState<FeaturedProjectsSettings>(initial);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    const start = async () => {
      try {
        const [{ doc, onSnapshot }, { getDb }] = await Promise.all([
          import("firebase/firestore"),
          import("@/lib/firebaseApp"),
        ]);
        if (cancelled) return;
        const db = await getDb();
        if (cancelled) return;
        unsub = onSnapshot(
          doc(db, FEATURED_PROJECTS_COLLECTION, FEATURED_PROJECTS_DOC_ID),
          (snapshot) => {
            setSettings(
              snapshot.exists()
                ? normalizeFeaturedProjectsSettings(snapshot.data())
                : FEATURED_PROJECTS_DEFAULTS
            );
          },
          (error) => {
            console.warn("Featured projects settings listener notice:", error.message);
          }
        );
      } catch (err) {
        console.warn("Could not subscribe to featured project settings:", err);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void start(), { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
        unsub?.();
      };
    }
    const timer = setTimeout(() => void start(), 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub?.();
    };
  }, []);

  return settings;
}

export default useFeaturedProjectsSettings;
