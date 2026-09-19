import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VisitorAnalytics, DailyStats, Visitor } from '@/types/visitor';
import { getTodayDate, getYesterdayDate } from '@/utils/visitorTracking';

export const useVisitorAnalytics = () => {
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get total visitors count
        const counterRef = doc(db, 'siteContent', 'visitorCounter');
        const counterDoc = await getDoc(counterRef);
        const totalVisitors = counterDoc.exists() ? (counterDoc.data()?.totalVisitors || 0) : 0;

        // Get daily stats for the last 30 days
        const dailyStatsQuery = query(
          collection(db, 'dailyStats'),
          orderBy('date', 'desc'),
          limit(30)
        );
        const dailyStatsSnapshot = await getDocs(dailyStatsQuery);
        const dailyStats: DailyStats[] = dailyStatsSnapshot.docs.map(doc => 
          doc.data() as DailyStats
        );

        // Calculate today's visitors
        const today = getTodayDate();
        const todayStats = dailyStats.find(stat => stat.date === today);
        const todayVisitors = todayStats?.totalVisitors || 0;

        // Calculate yesterday's visitors
        const yesterday = getYesterdayDate();
        const yesterdayStats = dailyStats.find(stat => stat.date === yesterday);
        const yesterdayVisitors = yesterdayStats?.totalVisitors || 0;

        // Calculate weekly visitors (last 7 days)
        const weeklyVisitors = dailyStats
          .filter(stat => {
            const statDate = new Date(stat.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return statDate >= weekAgo;
          })
          .reduce((sum, stat) => sum + stat.totalVisitors, 0);

        // Calculate monthly visitors (last 30 days)
        const monthlyVisitors = dailyStats.reduce((sum, stat) => sum + stat.totalVisitors, 0);

        // Calculate top locations
        const locationCounts: Record<string, { count: number; countryCode: string }> = {};
        dailyStats.forEach(stat => {
          Object.entries(stat.locations || {}).forEach(([country, count]) => {
            if (!locationCounts[country]) {
              locationCounts[country] = { count: 0, countryCode: 'XX' };
            }
            locationCounts[country].count += count;
          });
        });

        const topLocations = Object.entries(locationCounts)
          .map(([country, data]) => ({
            country,
            count: data.count,
            countryCode: data.countryCode,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setAnalytics({
          totalVisitors,
          todayVisitors,
          yesterdayVisitors,
          weeklyVisitors,
          monthlyVisitors,
          dailyStats,
          topLocations,
        });
      } catch (err) {
        console.error('Error fetching visitor analytics:', err);
        setError('Failed to load visitor analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
};