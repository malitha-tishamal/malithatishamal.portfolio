'use client';

import { usePathname } from 'next/navigation';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

const VisitorTracker: React.FC = () => {
  const pathname = usePathname();

  // Don't track visitors on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useVisitorTracking();

  return null; // This component doesn't render anything, it just tracks visitors
};

export default VisitorTracker;