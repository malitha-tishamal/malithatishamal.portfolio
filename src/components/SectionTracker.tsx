"use client";

import { useSectionTracking } from '@/hooks/useSectionTracking';
import { trackCertificationSectionView } from '@/utils/certificationAnalytics';

export const SectionTracker = () => {
  // Track Hero section
  useSectionTracking({
    sectionId: 'hero',
    sectionName: 'Hero',
    threshold: 0.5,
  });

  // Track Certificates section
  useSectionTracking({
    sectionId: 'certifications',
    sectionName: 'Certificates',
    threshold: 0.3,
    onEnter: trackCertificationSectionView,
  });

  // Track Portfolio section
  useSectionTracking({
    sectionId: 'portfolio',
    sectionName: 'Portfolio',
    threshold: 0.3,
  });

  // Track Projects section
  useSectionTracking({
    sectionId: 'projects',
    sectionName: 'Projects',
    threshold: 0.3,
  });

  // Track Services section
  useSectionTracking({
    sectionId: 'services',
    sectionName: 'Services',
    threshold: 0.3,
  });

  // Track Blogs section
  useSectionTracking({
    sectionId: 'blog',
    sectionName: 'Blogs',
    threshold: 0.3,
  });

  return null; // This component doesn't render anything
};
