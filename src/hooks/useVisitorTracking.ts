import { useEffect, useState } from 'react';
import { whenIdleOrInteraction } from '@/lib/deferClientWork';
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

type FirestoreModule = typeof import('firebase/firestore');

/**
 * Visitor counter + one-off visit record.
 *
 * Everything here is deferred to idle time and the Firestore SDK is imported
 * dynamically, so analytics never competes with hydration or the LCP image.
 */
export const useVisitorTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [totalVisitors, setTotalVisitors] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    const start = async () => {
      try {
        const [mod, { getDb }] = await Promise.all([
          import('firebase/firestore'),
          import('@/lib/firebaseApp'),
        ]);
        if (cancelled) return;
        const db = await getDb();
        if (cancelled) return;

        unsub = mod.onSnapshot(mod.doc(db, 'siteContent', 'visitorCounter'), (snap) => {
          if (snap.exists()) {
            setTotalVisitors(snap.data()?.totalVisitors || 0);
          }
        });

        if (hasVisitedToday()) return;
        setIsTracking(true);

        const ip = await getClientIP();
        const location = await getLocationFromIP(ip);
        const userAgent = getUserAgent();
        const referrer = getReferrer();
        const page = getCurrentPage();
        const today = getTodayDate();

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

        await mod.addDoc(mod.collection(db, 'visitors'), visitorData);
        await updateDailyStats(mod, db, today, location.country);
        await incrementTotalVisitors(mod, db);
        markVisitedToday();
      } catch (error) {
        console.error('Error tracking visitor:', error);
      } finally {
        if (!cancelled) setIsTracking(false);
      }
    };

    if (typeof window === "undefined") return;
    const stop = whenIdleOrInteraction(() => void start(), 12000);
    return () => {
      cancelled = true;
      stop();
      unsub?.();
    };
  }, []);

  const updateDailyStats = async (
    mod: FirestoreModule,
    db: Awaited<ReturnType<typeof import('@/lib/firebaseApp').getDb>>,
    date: string,
    country: string
  ) => {
    try {
      const dailyStatsRef = mod.doc(db, 'dailyStats', date);
      const dailyStatsDoc = await mod.getDoc(dailyStatsRef);

      if (dailyStatsDoc.exists()) {
        await mod.setDoc(
          dailyStatsRef,
          {
            totalVisitors: mod.increment(1),
            uniqueVisitors: mod.increment(1),
            [`locations.${country}`]: mod.increment(1),
            updatedAt: mod.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await mod.setDoc(dailyStatsRef, {
          date,
          totalVisitors: 1,
          uniqueVisitors: 1,
          locations: {
            [country]: 1,
          },
          createdAt: mod.serverTimestamp(),
          updatedAt: mod.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  const incrementTotalVisitors = async (
    mod: FirestoreModule,
    db: Awaited<ReturnType<typeof import('@/lib/firebaseApp').getDb>>
  ) => {
    try {
      const counterRef = mod.doc(db, 'siteContent', 'visitorCounter');
      const counterDoc = await mod.getDoc(counterRef);

      if (!counterDoc.exists()) {
        await mod.setDoc(counterRef, {
          totalVisitors: 1,
          createdAt: mod.serverTimestamp(),
          updatedAt: mod.serverTimestamp(),
        });
      } else {
        await mod.setDoc(
          counterRef,
          {
            totalVisitors: mod.increment(1),
            updatedAt: mod.serverTimestamp(),
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
