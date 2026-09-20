import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collectAdvancedAnalytics, updateActivityData, getActivityData, endSession } from '@/utils/advancedAnalytics';
import { AdvancedAnalyticsData } from '@/types/advancedAnalytics';
import toast from 'react-hot-toast';

export const useAdvancedAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsData | null>(null);

  // Sync fallback data to Firestore when connection is restored
  const syncFallbackData = async () => {
    const fallbackKey = 'analytics_fallback';
    const fallbackData = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    
    if (fallbackData.length === 0) return;
    
    try {
      for (const data of fallbackData) {
        if (data.saveFailed) {
          await addDoc(collection(db, 'advancedAnalytics'), {
            ...data,
            timestamp: serverTimestamp(),
            syncedFromFallback: true,
          });
        }
      }
      localStorage.removeItem(fallbackKey);
      console.log('Fallback data synced to Firestore');
    } catch (error) {
      console.error('Failed to sync fallback data:', error);
    }
  };

  useEffect(() => {
    initializeAnalytics();
    return () => {
      // Save data when component unmounts (user leaves page)
      saveAnalyticsOnExit();
    };
  }, []);

  const initializeAnalytics = async () => {
    try {
      setIsLoading(true);

      // Initialize session start time
      localStorage.setItem('analytics_session_start', Date.now().toString());

      // Sync any fallback data first
      await syncFallbackData();

      // Collect comprehensive analytics data
      const data = await collectAdvancedAnalytics();
      
      // Get activity data from localStorage
      const activity = getActivityData();
      data.activity = {
        ...data.activity,
        ...activity,
      };

      setAnalyticsData(data);
      setSessionId(data.session.sessionId);

      // Save to Firestore immediately on every page visit
      await saveToFirestore(data);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      toast.error('Failed to save analytics data');
      setIsLoading(false);
    }
  };

  const saveToFirestore = async (data: AdvancedAnalyticsData) => {
    try {
      // Remove undefined values before saving to Firestore
      const cleanData = removeUndefinedValues(data);
      
      // Add retry logic for network issues
      let retries = 3;
      let lastError: any;
      
      for (let i = 0; i < retries; i++) {
        try {
          const docRef = await addDoc(collection(db, 'advancedAnalytics'), {
            ...cleanData,
            timestamp: serverTimestamp(),
          });
          console.log('Advanced analytics saved to Firestore with ID:', docRef.id);
          return; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          console.error(`Save attempt ${i + 1} failed:`, error);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
          }
        }
      }
      
      // All retries failed
      throw lastError;
    } catch (error: any) {
      console.error('Failed to save analytics to Firestore after retries:', error);
      toast.error(`Failed to save analytics: ${error.message || 'Unknown error'}`);
      
      // Save to localStorage as fallback
      const fallbackKey = 'analytics_fallback';
      const fallbackData = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      fallbackData.push({
        ...data,
        timestamp: new Date().toISOString(),
        saveFailed: true,
      });
      localStorage.setItem(fallbackKey, JSON.stringify(fallbackData.slice(-50))); // Keep last 50
    }
  };

  // Remove undefined and null values recursively
  const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    
    if (Array.isArray(obj)) {
      return obj.map(item => removeUndefinedValues(item)).filter(item => item !== null && item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = removeUndefinedValues(obj[key]);
          // Only include the field if it's not null or undefined
          if (value !== null && value !== undefined) {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  const saveAnalyticsOnExit = async () => {
    try {
      // End session
      const session = await endSession();
      
      // Update activity data
      const activity = getActivityData();
      
      // Collect final data
      const data = await collectAdvancedAnalytics();
      data.activity = {
        ...data.activity,
        ...activity,
      };
      data.session = {
        ...data.session,
        ...session,
      };

      // Save to Firestore
      await saveToFirestore(data);
    } catch (error) {
      console.error('Failed to save analytics on exit:', error);
    }
  };

  const trackActivity = (type: 'click' | 'scroll' | 'search' | 'download' | 'form-start' | 'form-submit' | 'form-abandon' | 'keyboard' | 'touch' | 'scroll-direction', value?: string) => {
    updateActivityData(type, value);
  };

  const trackError = (type: 'javascript' | 'api' | 'http' | 'resource', error: any) => {
    const errorsKey = 'analytics_errors';
    const errors = JSON.parse(localStorage.getItem(errorsKey) || JSON.stringify({
      javascriptErrors: [],
      apiErrors: [],
      httpErrors: [],
      resourceFailures: [],
    }));

    const errorData = {
      message: error.message || error.toString(),
      stack: error.stack,
      timestamp: new Date(),
      route: typeof window !== 'undefined' ? window.location.pathname : '/',
    };

    switch (type) {
      case 'javascript':
        errors.javascriptErrors.push(errorData);
        break;
      case 'api':
        errors.apiErrors.push({
          endpoint: error.endpoint || 'unknown',
          status: error.status || 0,
          message: error.message || error.toString(),
          timestamp: new Date(),
        });
        break;
      case 'http':
        errors.httpErrors.push({
          url: error.url || 'unknown',
          status: error.status || 0,
          message: error.message || error.toString(),
          timestamp: new Date(),
        });
        break;
      case 'resource':
        errors.resourceFailures.push({
          resource: error.resource || 'unknown',
          type: error.type || 'unknown',
          timestamp: new Date(),
        });
        break;
    }

    localStorage.setItem(errorsKey, JSON.stringify(errors));
  };

  const trackNavigation = (from: string, to: string) => {
    const navigationKey = 'analytics_navigation';
    const navigation = JSON.parse(localStorage.getItem(navigationKey) || JSON.stringify({
      routeTransitions: [],
    }));

    navigation.routeTransitions.push({ from, to, timestamp: new Date() });
    localStorage.setItem(navigationKey, JSON.stringify(navigation));
  };

  const trackPermission = (permission: string, state: string) => {
    const permissionsKey = 'analytics_permissions';
    const permissions = JSON.parse(localStorage.getItem(permissionsKey) || '{}');
    permissions[permission] = state;
    localStorage.setItem(permissionsKey, JSON.stringify(permissions));
  };

  return {
    isLoading,
    sessionId,
    analyticsData,
    trackActivity,
    trackError,
    trackNavigation,
    trackPermission,
    syncFallbackData,
  };
};
