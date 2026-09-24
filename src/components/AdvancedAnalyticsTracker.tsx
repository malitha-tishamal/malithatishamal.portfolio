"use client";

import { useEffect } from 'react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

export const AdvancedAnalyticsTracker = () => {
  const { trackActivity, trackError, trackNavigation, trackPermission } = useAdvancedAnalytics();

  useEffect(() => {
    // Track clicks
    const handleClick = () => {
      trackActivity('click');
    };

    // Track scroll
    const handleScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      trackActivity('scroll', scrollDepth.toString());
    };

    // Track scroll direction
    let lastScrollY = window.scrollY;
    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      trackActivity('scroll-direction', direction);
      lastScrollY = currentScrollY;
    };

    // Track keyboard events
    const handleKeyDown = () => {
      trackActivity('keyboard');
    };

    // Track touch events
    const handleTouch = () => {
      trackActivity('touch');
    };

    // Track mouse movements (sampled to avoid performance issues)
    let mouseMoveThrottle: NodeJS.Timeout | null = null;
    const handleMouseMove = () => {
      if (!mouseMoveThrottle) {
        mouseMoveThrottle = setTimeout(() => {
          mouseMoveThrottle = null;
        }, 1000); // Update once per second
      }
    };

    // Track page visibility changes (user leaving page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Update tab hidden count
        const tabHiddenCount = parseInt(localStorage.getItem('analytics_tab_hidden_count') || '0');
        localStorage.setItem('analytics_tab_hidden_count', (tabHiddenCount + 1).toString());
        
        // Update tab switches
        const tabSwitches = parseInt(localStorage.getItem('analytics_tab_switches') || '0');
        localStorage.setItem('analytics_tab_switches', (tabSwitches + 1).toString());
        
        console.log('User leaving page - saving analytics');
      } else if (document.visibilityState === 'visible') {
        // Update tab visible count
        const tabVisibleCount = parseInt(localStorage.getItem('analytics_tab_visible_count') || '0');
        localStorage.setItem('analytics_tab_visible_count', (tabVisibleCount + 1).toString());
      }
    };

    // Track network changes
    const handleOnline = () => {
      console.log('Network: online');
    };

    const handleOffline = () => {
      console.log('Network: offline');
      // Track offline duration
      const offlineStart = Date.now();
      localStorage.setItem('analytics_offline_start', offlineStart.toString());
    };

    // Track battery changes (if supported)
    const handleBatteryChange = (event: any) => {
      console.log('Battery change:', event);
    };

    // Track JavaScript errors
    const handleError = (event: ErrorEvent) => {
      trackError('javascript', {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError('javascript', {
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
      });
    };

    // Track form interactions
    const handleFormStart = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form) {
        trackActivity('form-start');
      }
    };

    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form) {
        trackActivity('form-submit');
      }
    };

    // Track page unload
    const handleBeforeUnload = () => {
      // Save analytics before page unload
      console.log('Page unloading - saving analytics');
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScrollDirection);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Battery API listener (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', handleBatteryChange);
        battery.addEventListener('chargingchange', handleBatteryChange);
      });
    }

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScrollDirection);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackActivity, trackError]);

  return null; // This component doesn't render anything
};
