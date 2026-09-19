import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Visitor } from '@/types/visitor';
import {
  getClientIP,
  getLocationFromIP,
  getTodayDate,
  hasVisitedToday,
  markVisitedToday,
  getUserAgent,
  getReferrer,
  getCurrentPage,
} from '@/utils/visitorTracking';

export const useVisitorTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [totalVisitors, setTotalVisitors] = useState(0);

  useEffect(() => {
    const trackVisitor = async () => {
      // Check if already visited today to avoid duplicate tracking
      if (hasVisitedToday()) {
        return;
      }

      try {
        setIsTracking(true);

        // Get visitor information
        const ip = await getClientIP();
        const location = await getLocationFromIP(ip);
        const userAgent = getUserAgent();
        const referrer = getReferrer();
        const page = getCurrentPage();
        const today = getTodayDate();

        // Create visitor document
        const visitorData: Omit<Visitor, 'id'> = {
          ip,
          location: {
            country: location.country,
            city: location.city,
            countryCode: location.countryCode,
            ...(location.region && { region: location.region }),
          },
          visitDate: {
            date: today,
            timestamp: Date.now(),
          },
          ...(userAgent && { userAgent }),
          ...(referrer && { referrer }),
          ...(page && { page }),
        };

        // Add visitor to Firestore
        await addDoc(collection(db, 'visitors'), visitorData);

        // Update daily stats
        await updateDailyStats(today, location.country);

        // Update total visitors count
        await incrementTotalVisitors();

        // Mark as visited today
        markVisitedToday();
      } catch (error) {
        console.error('Error tracking visitor:', error);
      } finally {
        setIsTracking(false);
      }
    };

    trackVisitor();

    // Listen for real-time updates to total visitors count
    const counterRef = doc(db, 'siteContent', 'visitorCounter');
    const unsubscribe = onSnapshot(counterRef, (doc) => {
      if (doc.exists()) {
        setTotalVisitors(doc.data()?.totalVisitors || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateDailyStats = async (date: string, country: string) => {
    try {
      const dailyStatsRef = doc(db, 'dailyStats', date);
      const dailyStatsDoc = await getDoc(dailyStatsRef);

      if (dailyStatsDoc.exists()) {
        // Update existing daily stats
        await setDoc(
          dailyStatsRef,
          {
            totalVisitors: increment(1),
            uniqueVisitors: increment(1),
            [`locations.${country}`]: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Create new daily stats
        await setDoc(dailyStatsRef, {
          date,
          totalVisitors: 1,
          uniqueVisitors: 1,
          locations: {
            [country]: 1,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  const incrementTotalVisitors = async () => {
    try {
      const counterRef = doc(db, 'siteContent', 'visitorCounter');
      const counterDoc = await getDoc(counterRef);
      
      if (!counterDoc.exists()) {
        // Initialize counter if it doesn't exist
        await setDoc(counterRef, {
          totalVisitors: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Increment existing counter
        await setDoc(
          counterRef,
          {
            totalVisitors: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error incrementing total visitors:', error);
    }
  };

  return { isTracking, totalVisitors };
};