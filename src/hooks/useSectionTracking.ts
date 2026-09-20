import { useEffect, useRef } from 'react';
import { trackSectionEnter, trackSectionExit } from '@/utils/advancedAnalytics';

interface SectionTrackingOptions {
  sectionId: string;
  sectionName: string;
  threshold?: number;
}

export const useSectionTracking = (options: SectionTrackingOptions) => {
  const { sectionId, sectionName, threshold = 0.5 } = options;
  const hasEntered = useRef(false);
  const entryTime = useRef<number | null>(null);

  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            if (!hasEntered.current) {
              // Section entered
              trackSectionEnter(sectionName);
              hasEntered.current = true;
              entryTime.current = Date.now();
            }
          } else if (hasEntered.current && entry.intersectionRatio < threshold * 0.5) {
            // Section exited
            const scrollPercentage = Math.round(entry.intersectionRatio * 100);
            trackSectionExit(sectionName, scrollPercentage);
            hasEntered.current = false;
            entryTime.current = null;
          }
        });
      },
      {
        threshold: [threshold, threshold * 0.5],
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      // Track exit if user leaves while in section
      if (hasEntered.current) {
        trackSectionExit(sectionName, 0);
      }
    };
  }, [sectionId, sectionName, threshold]);

  return null;
};
