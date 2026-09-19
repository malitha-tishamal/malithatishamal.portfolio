"use client";

import React, { useState } from "react";
import { useVisitorAnalytics } from "@/hooks/useVisitorAnalytics";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Visitor } from "@/types/visitor";
import toast from "react-hot-toast";

export const VisitorAnalytics: React.FC = () => {
  const { analytics, loading, error } = useVisitorAnalytics();
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const fetchRecentVisitors = async () => {
    setLoadingVisitors(true);
    try {
      const visitorsQuery = query(
        collection(db, "visitors"),
        orderBy("visitDate.timestamp", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(visitorsQuery);
      const visitors = snapshot.docs.map(doc => ({
        ...(doc.data() as Visitor),
        id: doc.id,
      }));
      setRecentVisitors(visitors);
    } catch (err) {
      console.error("Error fetching recent visitors:", err);
      toast.error("Failed to load recent visitors");
    } finally {
      setLoadingVisitors(false);
    }
  };

  React.useEffect(() => {
    fetchRecentVisitors();
  }, []);

  const filteredVisitors = recentVisitors.filter(visitor => {
    const visitorDate = new Date(visitor.visitDate.date);
    
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return visitorDate >= today;
    }
    
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return visitorDate >= weekAgo;
    }
    
    if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return visitorDate >= monthAgo;
    }
    
    return true;
  }).filter(visitor => {
    if (countryFilter === "all") return true;
    return visitor.location.country === countryFilter;
  });

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-dark dark:text-white">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 dark:bg-darkmode rounded-xl p-6">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Visitor Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track website visitors, locations, and engagement metrics
          </p>
        </div>
        <button
          onClick={fetchRecentVisitors}
          disabled={loadingVisitors}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
        >
          {loadingVisitors ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Visitors"
          value={analytics.totalVisitors}
          subtitle="All time"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-blue-500"
        />
        <StatCard
          title="Today's Visitors"
          value={analytics.todayVisitors}
          subtitle="Unique today"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-green-500"
        />
        <StatCard
          title="Yesterday's Visitors"
          value={analytics.yesterdayVisitors}
          subtitle="Previous day"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          color="bg-amber-500"
        />
        <StatCard
          title="Weekly Visitors"
          value={analytics.weeklyVisitors}
          subtitle="Last 7 days"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="bg-purple-500"
        />
      </div>

      {/* Top Locations */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
        <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Top Visitor Locations
        </h3>
        <div className="space-y-3">
          {analytics.topLocations.length > 0 ? (
            analytics.topLocations.map((location, index) => (
              <div key={location.country} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-darkmode rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{location.countryCode === 'XX' ? '🌍' : getCountryFlag(location.countryCode)}</span>
                  <div>
                    <p className="font-semibold text-dark dark:text-white text-sm">{location.country}</p>
                    <p className="text-xs text-gray-500">{location.countryCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">{location.count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">visitors</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No location data available</p>
          )}
        </div>
      </div>

      {/* Recent Visitors Table */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold text-dark dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Recent Visitors
          </h3>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darkmode text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darkmode text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Countries</option>
              {analytics.topLocations.map(loc => (
                <option key={loc.country} value={loc.country}>{loc.country}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-dark_border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">IP Address</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Location</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Page</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b border-border dark:border-dark_border hover:bg-gray-50 dark:hover:bg-darkmode">
                    <td className="py-3 px-4 text-sm text-dark dark:text-white font-mono">
                      {visitor.ip}
                    </td>
                    <td className="py-3 px-4 text-sm text-dark dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{visitor.location.countryCode === 'XX' ? '🌍' : getCountryFlag(visitor.location.countryCode)}</span>
                        <span>{visitor.location.city}, {visitor.location.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(visitor.visitDate.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {visitor.page || '/'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No visitors found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
};