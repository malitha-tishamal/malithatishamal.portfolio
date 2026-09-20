"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdvancedAnalyticsData } from "@/types/advancedAnalytics";
import toast from "react-hot-toast";

export const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedData, setSelectedData] = useState<AdvancedAnalyticsData | null>(null);
  const [filterType, setFilterType] = useState<"all" | "device" | "network" | "location" | "browser" | "activity" | "session" | "performance" | "security" | "errors" | "battery" | "uiPreferences" | "pwa" | "storage" | "engagement" | "lifecycle" | "clientHints" | "navigation" | "sections">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // First, try without orderBy to see if collection exists
        const snapshot = await getDocs(collection(db, "advancedAnalytics"));
        console.log("Advanced analytics collection size:", snapshot.size);
        
        if (snapshot.empty) {
          console.log("No advanced analytics data found");
          setError("No analytics data available yet. Visit your website to start collecting data.");
          setLoading(false);
          return;
        }

        // If there's data, try with orderBy
        const q = query(
          collection(db, "advancedAnalytics"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as AdvancedAnalyticsData),
          }));
          console.log("Advanced analytics data loaded:", data.length);
          setAnalyticsData(data);
          setLoading(false);
          setError(null);
        }, (error) => {
          console.error("Firestore query error:", error);
          setError("Firestore index required. To fix this:\n1. Go to Firebase Console → Firestore → Indexes\n2. Click 'Add Index'\n3. Collection: advancedAnalytics\n4. Fields: timestamp (descending)\n5. Click 'Create Index'");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setError("Failed to load analytics data. Please check your Firestore configuration.");
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredData = analyticsData.filter((data) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        data.device.os.toLowerCase().includes(searchLower) ||
        data.device.browser.toLowerCase().includes(searchLower) ||
        data.location.country?.toLowerCase().includes(searchLower) ||
        data.network.ip?.includes(searchLower) ||
        data.session.sessionId.includes(searchLower) ||
        data.device.type.toLowerCase().includes(searchLower) ||
        data.location.city?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this analytics record?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "advancedAnalytics", id));
      toast.success("Analytics record deleted successfully");
      setAnalyticsData(analyticsData.filter((data) => data.id !== id));
    } catch (error) {
      console.error("Error deleting analytics record:", error);
      toast.error("Failed to delete analytics record");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL analytics records? This cannot be undone.")) {
      return;
    }

    try {
      const promises = analyticsData.map((data) => deleteDoc(doc(db, "advancedAnalytics", data.id)));
      await Promise.all(promises);
      toast.success("All analytics records deleted successfully");
      setAnalyticsData([]);
    } catch (error) {
      console.error("Error deleting analytics records:", error);
      toast.error("Failed to delete analytics records");
    }
  };

  const renderDataSection = (data: AdvancedAnalyticsData) => {
    switch (filterType) {
      case "device":
        return renderDeviceInfo(data);
      case "network":
        return renderNetworkInfo(data);
      case "location":
        return renderLocationInfo(data);
      case "browser":
        return renderBrowserInfo(data);
      case "activity":
        return renderActivityInfo(data);
      case "session":
        return renderSessionInfo(data);
      case "performance":
        return renderPerformanceInfo(data);
      case "security":
        return renderSecurityInfo(data);
      case "errors":
        return renderErrorsInfo(data);
      case "battery":
        return renderBatteryInfo(data);
      case "uiPreferences":
        return renderUIPreferencesInfo(data);
      case "pwa":
        return renderPWAInfo(data);
      case "storage":
        return renderStorageInfo(data);
      case "engagement":
        return renderEngagementInfo(data);
      case "lifecycle":
        return renderLifecycleInfo(data);
      case "clientHints":
        return renderClientHintsInfo(data);
      case "navigation":
        return renderNavigationInfo(data);
      case "sections":
        return renderSectionViews(data);
      default:
        return renderAllInfo(data);
    }
  };

  const renderDeviceInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.device.type === 'mobile' 
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700' 
            : data.device.type === 'tablet'
            ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700'
            : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Device Type</p>
          <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.device.type}</p>
        </div>
        {data.device.manufacturer && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Manufacturer</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.manufacturer}</p>
          </div>
        )}
        {data.device.model && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Model</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.model}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-2 rounded-lg border border-orange-300 dark:border-orange-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">OS</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.os} {data.device.osVersion}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-2 rounded-lg border border-pink-300 dark:border-pink-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Browser</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.browser} {data.device.browserVersion}</p>
        </div>
        {data.device.browserEngine && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Browser Engine</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.browserEngine}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-2 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Screen Resolution</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.screenResolution}</p>
        </div>
        {data.device.availableScreenSize && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Available Screen</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.availableScreenSize}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-2 rounded-lg border border-teal-300 dark:border-teal-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Viewport</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.viewport}</p>
        </div>
        {data.device.visualViewport && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Visual Viewport</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.visualViewport}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-2 rounded-lg border border-amber-300 dark:border-amber-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Pixel Ratio</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.pixelRatio}</p>
        </div>
        {data.device.colorDepth && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Color Depth</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.colorDepth} bits</p>
          </div>
        )}
        {data.device.pixelDepth && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Pixel Depth</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.pixelDepth} bits</p>
          </div>
        )}
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.device.orientation === 'landscape'
            ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-300 dark:border-indigo-700'
            : 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-300 dark:border-rose-700'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Orientation</p>
          <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.device.orientation}</p>
        </div>
        {data.device.orientationAngle !== undefined && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Orientation Angle</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.orientationAngle}°</p>
          </div>
        )}
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.device.touchSupport
            ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Touch Support</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.touchSupport ? "Yes" : "No"}</p>
        </div>
        {data.device.touchPoints !== undefined && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Touch Points</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.touchPoints}</p>
          </div>
        )}
        {data.device.pointerType !== 'unknown' && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Pointer Type</p>
            <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.device.pointerType}</p>
          </div>
        )}
        {data.device.cpuCores && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-2 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">CPU Cores</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.cpuCores}</p>
          </div>
        )}
        {data.device.hardwareConcurrency && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Hardware Concurrency</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.hardwareConcurrency}</p>
          </div>
        )}
        {data.device.deviceMemory && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Device Memory</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.device.deviceMemory} GB</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNetworkInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-2 rounded-lg border border-red-300 dark:border-red-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">IP Address</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.ip || "N/A"}</p>
        </div>
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.network.onlineStatus
            ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Online Status</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.onlineStatus ? "Online" : "Offline"}</p>
        </div>
        {data.network.connectionType && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Connection Type</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.connectionType}</p>
          </div>
        )}
        {data.network.effectiveType && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Effective Type</p>
            <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.network.effectiveType}</p>
          </div>
        )}
        {data.network.downloadSpeed && (
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-2 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Download Speed</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.downloadSpeed} Mbps</p>
          </div>
        )}
        {data.network.rtt && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-2 rounded-lg border border-orange-300 dark:border-orange-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">RTT (Latency)</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.rtt} ms</p>
          </div>
        )}
        {data.network.saveData !== undefined && (
          <div className={`p-2 rounded-lg border shadow-sm ${
            data.network.saveData
              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode border-gray-200 dark:border-dark_border'
          }`}>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Save Data</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.saveData ? "Enabled" : "Disabled"}</p>
          </div>
        )}
        {data.network.connectionChanges > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Connection Changes</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.connectionChanges}</p>
          </div>
        )}
        {data.network.offlineDuration > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-2 rounded-lg border border-red-300 dark:border-red-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Offline Duration</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{Math.floor(data.network.offlineDuration / 60)}m</p>
          </div>
        )}
        {data.network.networkLatency && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Network Latency</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.networkLatency} ms</p>
          </div>
        )}
        {data.network.downlink && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Downlink</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.network.downlink} Mbps</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Country</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.country || "N/A"}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-2 rounded-lg border border-teal-300 dark:border-teal-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Region</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.region || "N/A"}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-2 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">City</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.city || "N/A"}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Timezone</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.timezone}</p>
        </div>
        {data.location.timezoneOffset !== undefined && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Timezone Offset</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.timezoneOffset} min</p>
          </div>
        )}
        {data.location.gpsPermission && (
          <div className={`p-2 rounded-lg border shadow-sm ${
            data.location.gpsPermission === 'granted'
              ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
              : data.location.gpsPermission === 'denied'
              ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
              : 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700'
          }`}>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">GPS Permission</p>
            <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.location.gpsPermission}</p>
          </div>
        )}
        {data.location.gpsCoordinates && (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Latitude</p>
              <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.latitude}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-2 rounded-lg border border-pink-300 dark:border-pink-700 shadow-sm">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Longitude</p>
              <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.longitude}</p>
            </div>
            {data.location.gpsCoordinates.accuracy && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Accuracy</p>
                <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.accuracy}m</p>
              </div>
            )}
            {data.location.gpsCoordinates.altitude && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Altitude</p>
                <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.altitude}m</p>
              </div>
            )}
            {data.location.gpsCoordinates.heading && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Heading</p>
                <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.heading}°</p>
              </div>
            )}
            {data.location.gpsCoordinates.speed && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Speed</p>
                <p className="font-bold text-xs text-midnight_text dark:text-white">{data.location.gpsCoordinates.speed} m/s</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderBrowserInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
        <p className="text-xs text-gray-500">User Agent</p>
        <p className="font-semibold text-xs break-all">{data.browser.userAgent}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Language</p>
          <p className="font-semibold text-sm">{data.browser.language}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Cookies Enabled</p>
          <p className="font-semibold text-sm">{data.browser.cookiesEnabled ? "Yes" : "No"}</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Browser Capabilities</p>
        <div className="flex flex-wrap gap-2">
          {data.browser.capabilities.webGL && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">WebGL</span>}
          {data.browser.capabilities.webGL2 && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">WebGL2</span>}
          {data.browser.capabilities.touch && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">Touch</span>}
          {data.browser.capabilities.bluetooth && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Bluetooth</span>}
          {data.browser.capabilities.webBluetooth && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Web Bluetooth</span>}
          {data.browser.capabilities.usb && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">USB</span>}
          {data.browser.capabilities.midi && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">MIDI</span>}
          {data.browser.capabilities.ambientLight && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Ambient Light</span>}
          {data.browser.capabilities.vibration && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Vibration</span>}
          {data.browser.capabilities.webShare && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Web Share</span>}
          {data.browser.capabilities.webRTCPeerConnection && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">WebRTC</span>}
          {data.browser.capabilities.nfc && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">NFC</span>}
          {data.browser.capabilities.clipboard && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Clipboard</span>}
          {data.browser.capabilities.file && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">File API</span>}
          {data.browser.capabilities.print && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Print</span>}
          {data.browser.capabilities.storage && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Storage</span>}
          {data.browser.capabilities.notifications && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Notifications</span>}
          {data.browser.capabilities.geolocation && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Geolocation</span>}
          {data.browser.capabilities.sensors && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Sensors</span>}
        </div>
      </div>
      {data.browser.mediaCapabilities && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Media Capabilities</p>
          <div className="flex flex-wrap gap-2">
            {data.browser.mediaCapabilities.audioOutput && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">Audio Output</span>}
            {data.browser.mediaCapabilities.camera && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">Camera</span>}
            {data.browser.mediaCapabilities.microphone && <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">Microphone</span>}
          </div>
        </div>
      )}
      {data.browser.permissionStates && Object.keys(data.browser.permissionStates).length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Permission States</p>
          <div className="space-y-1">
            {Object.entries(data.browser.permissionStates).map(([permission, state]) => (
              <p key={permission} className="text-xs font-semibold capitalize">{permission}: {state}</p>
            ))}
          </div>
        </div>
      )}
      <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Preferred Languages</p>
        <div className="flex flex-wrap gap-2">
          {data.browser.languages.map((lang, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-200 dark:bg-dark text-gray-700 dark:text-gray-300 rounded text-xs">{lang}</span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivityInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Page Views</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.pageViews}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Clicks</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.clicks}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-2 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Scroll Depth</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.scrollDepth}%</p>
        </div>
        {data.activity.scrollDirection && data.activity.scrollDirection !== 'none' && (
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-2 rounded-lg border border-teal-300 dark:border-teal-700 shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Scroll Direction</p>
            <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.activity.scrollDirection}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Scroll Events</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.scrollEvents}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-2 rounded-lg border border-green-300 dark:border-green-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Downloads</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.downloads}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-2 rounded-lg border border-orange-300 dark:border-orange-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Forms Started</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.formsStarted}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-2 rounded-lg border border-pink-300 dark:border-pink-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Forms Submitted</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.formsSubmitted}</p>
        </div>
        {data.activity.formsAbandoned > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Forms Abandoned</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.formsAbandoned}</p>
          </div>
        )}
        {data.activity.formFieldsInteracted > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Fields Interacted</p>
            <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.formFieldsInteracted}</p>
          </div>
        )}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-2 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Time on Page</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{Math.floor(data.activity.timeOnPage / 60)}m {data.activity.timeOnPage % 60}s</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Active Time</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{Math.floor(data.activity.activeTime / 60)}m {data.activity.activeTime % 60}s</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-2 rounded-lg border border-red-300 dark:border-red-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Inactive Time</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{Math.floor(data.activity.inactiveTime / 60)}m {data.activity.inactiveTime % 60}s</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-2 rounded-lg border border-violet-300 dark:border-violet-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Mouse Movements</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.mouseMovements}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 p-2 rounded-lg border border-rose-300 dark:border-rose-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Keyboard Events</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.keyboardEvents}</p>
        </div>
        <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-900/20 dark:to-fuchsia-800/20 p-2 rounded-lg border border-fuchsia-300 dark:border-fuchsia-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Touch Events</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.activity.touchEvents}</p>
        </div>
      </div>
      {data.activity.sectionViews && data.activity.sectionViews.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin='round' strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-midnight_text dark:text-white">Section Views Timeline</p>
          </div>
          <div className="space-y-1">
            {data.activity.sectionViews.map((section, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white dark:bg-darkmode p-2 rounded-lg shadow-sm">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  section.duration ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                }`} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-midnight_text dark:text-white">{section.section}</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">
                    {section.enterTime ? new Date(section.enterTime.seconds ? section.enterTime.seconds * 1000 : section.enterTime).toLocaleTimeString() : 'Unknown'}
                    {section.exitTime && ' → ' + new Date(section.exitTime.seconds ? section.exitTime.seconds * 1000 : section.exitTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {section.duration ? `${Math.floor(section.duration / 60)}m ${section.duration % 60}s` : 'Active'}
                  </p>
                  {section.scrollPercentage !== undefined && (
                    <p className="text-[9px] text-gray-500 dark:text-gray-400">{section.scrollPercentage}% scroll</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.activity.searchQueries.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">Search Queries</p>
          <div className="space-y-1">
            {data.activity.searchQueries.map((query, idx) => (
              <p key={idx} className="text-xs font-bold text-midnight_text dark:text-white">{query}</p>
            ))}
          </div>
        </div>
      )}
      {data.activity.downloadsList.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">Downloads List</p>
          <div className="space-y-1">
            {data.activity.downloadsList.map((download, idx) => (
              <p key={idx} className="text-[10px] font-bold text-midnight_text dark:text-white">{download.filename} ({download.type})</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSessionInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-2">
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-sm">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Session ID</p>
        <p className="font-bold text-[10px] break-all text-midnight_text dark:text-white">{data.session.sessionId}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-2 rounded-lg border border-green-300 dark:border-green-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Start Time</p>
          <p className="font-bold text-[10px] text-midnight_text dark:text-white">{data.session.startTime?.seconds ? new Date(data.session.startTime.seconds * 1000).toLocaleString() : "N/A"}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-2 rounded-lg border border-red-300 dark:border-red-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">End Time</p>
          <p className="font-bold text-[10px] text-midnight_text dark:text-white">{data.session.endTime?.seconds ? new Date(data.session.endTime.seconds * 1000).toLocaleString() : "Active"}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-2 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Duration</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.duration ? `${Math.floor(data.session.duration / 60)}m ${data.session.duration % 60}s` : "Active"}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Entry Page</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.entryPage}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Exit Page</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.exitPage || "Active"}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-2 rounded-lg border border-teal-300 dark:border-teal-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Session Count</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.sessionCount}</p>
        </div>
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.session.isNewVisitor
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-300 dark:border-emerald-700'
            : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Visitor Type</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.isNewVisitor ? "New" : "Returning"}</p>
        </div>
        <div className={`p-2 rounded-lg border shadow-sm ${
          data.session.tabVisibility === 'visible'
            ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode border-gray-200 dark:border-dark_border'
        }`}>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Tab Visibility</p>
          <p className="font-bold text-xs capitalize text-midnight_text dark:text-white">{data.session.tabVisibility}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-2 rounded-lg border border-pink-300 dark:border-pink-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Tab Switches</p>
          <p className="font-bold text-xs text-midnight_text dark:text-white">{data.session.tabSwitches}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-2 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Last Activity</p>
          <p className="font-bold text-[10px] text-midnight_text dark:text-white">{data.session.lastActivity?.seconds ? new Date(data.session.lastActivity.seconds * 1000).toLocaleString() : "N/A"}</p>
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkmode dark:to-darkmode p-2 rounded-lg border border-gray-200 dark:border-dark_border shadow-sm">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">Pages Visited</p>
        <div className="flex flex-wrap gap-2">
          {data.session.pagesVisited.map((page, idx) => (
            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">{page}</span>
          ))}
        </div>
      </div>
      {data.session.pageSequence.length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Page Sequence</p>
          <div className="flex flex-wrap gap-2">
            {data.session.pageSequence.map((page, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">{idx + 1}. {page}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {data.performance.lcp && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">LCP (Largest Contentful Paint)</p>
            <p className="font-semibold text-sm">{data.performance.lcp} ms</p>
          </div>
        )}
        {data.performance.cls && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">CLS (Cumulative Layout Shift)</p>
            <p className="font-semibold text-sm">{data.performance.cls}</p>
          </div>
        )}
        {data.performance.inp && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">INP (Interaction to Next Paint)</p>
            <p className="font-semibold text-sm">{data.performance.inp} ms</p>
          </div>
        )}
        {data.performance.fcp && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">FCP (First Contentful Paint)</p>
            <p className="font-semibold text-sm">{data.performance.fcp} ms</p>
          </div>
        )}
        {data.performance.ttfb && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">TTFB (Time to First Byte)</p>
            <p className="font-semibold text-sm">{data.performance.ttfb} ms</p>
          </div>
        )}
        {data.performance.pageLoadTime && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Page Load Time</p>
            <p className="font-semibold text-sm">{data.performance.pageLoadTime} ms</p>
          </div>
        )}
        {data.performance.apiResponseTime && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">API Response Time</p>
            <p className="font-semibold text-sm">{data.performance.apiResponseTime} ms</p>
          </div>
        )}
        {data.performance.dnsTime && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">DNS Time</p>
            <p className="font-semibold text-sm">{data.performance.dnsTime} ms</p>
          </div>
        )}
        {data.performance.connectionTime && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Connection Time</p>
            <p className="font-semibold text-sm">{data.performance.connectionTime} ms</p>
          </div>
        )}
        {data.performance.tlsTime && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">TLS Time</p>
            <p className="font-semibold text-sm">{data.performance.tlsTime} ms</p>
          </div>
        )}
      </div>
      {data.performance.resourceTiming && data.performance.resourceTiming.length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Resource Timing (Top 20)</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.performance.resourceTiming.map((resource, idx) => (
              <div key={idx} className="text-xs border-b border-gray-200 dark:border-dark_border pb-1">
                <p className="font-semibold truncate">{resource.name}</p>
                <p className="text-[10px] text-gray-500">{resource.type} - {resource.duration}ms - {(resource.size / 1024).toFixed(2)}KB</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.performance.memoryInfo && Object.keys(data.performance.memoryInfo).length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Memory Info</p>
          <div className="grid grid-cols-2 gap-2">
            {data.performance.memoryInfo.usedJSHeapSize && (
              <div>
                <p className="text-[10px] text-gray-500">Used JS Heap</p>
                <p className="text-xs font-semibold">{(data.performance.memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            {data.performance.memoryInfo.totalJSHeapSize && (
              <div>
                <p className="text-[10px] text-gray-500">Total JS Heap</p>
                <p className="text-xs font-semibold">{(data.performance.memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            {data.performance.memoryInfo.jsHeapSizeLimit && (
              <div>
                <p className="text-[10px] text-gray-500">Heap Limit</p>
                <p className="text-xs font-semibold">{(data.performance.memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSecurityInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">IP Address</p>
          <p className="font-semibold text-sm">{data.security.ip || "N/A"}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Login Attempts</p>
          <p className="font-semibold text-sm">{data.security.loginAttempts || 0}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Failed Logins</p>
          <p className="font-semibold text-sm">{data.security.failedLogins || 0}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Suspicious Activity</p>
          <p className="font-semibold text-sm">{data.security.suspiciousActivity ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );

  const renderErrorsInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      {data.errors.javascriptErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">JavaScript Errors ({data.errors.javascriptErrors.length})</p>
          <div className="space-y-1">
            {data.errors.javascriptErrors.map((error, idx) => (
              <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                <p className="font-semibold">{error.message}</p>
                {error.route && <p className="text-[10px] opacity-75">Route: {error.route}</p>}
                {error.timestamp && <p className="text-[10px] opacity-75">{new Date(error.timestamp).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.errors.apiErrors.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">API Errors ({data.errors.apiErrors.length})</p>
          <div className="space-y-1">
            {data.errors.apiErrors.map((error, idx) => (
              <div key={idx} className="text-xs text-orange-700 dark:text-orange-300">
                <p className="font-semibold">{error.endpoint} - {error.status}</p>
                <p>{error.message}</p>
                {error.timestamp && <p className="text-[10px] opacity-75">{new Date(error.timestamp).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.errors.httpErrors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">HTTP Errors ({data.errors.httpErrors.length})</p>
          <div className="space-y-1">
            {data.errors.httpErrors.map((error, idx) => (
              <div key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                <p className="font-semibold">{error.url} - {error.status}</p>
                <p>{error.message}</p>
                {error.timestamp && <p className="text-[10px] opacity-75">{new Date(error.timestamp).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.errors.resourceFailures.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">Resource Failures ({data.errors.resourceFailures.length})</p>
          <div className="space-y-1">
            {data.errors.resourceFailures.map((error, idx) => (
              <div key={idx} className="text-xs text-purple-700 dark:text-purple-300">
                <p className="font-semibold">{error.resource} ({error.type})</p>
                {error.timestamp && <p className="text-[10px] opacity-75">{new Date(error.timestamp).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.errors.javascriptErrors.length === 0 && data.errors.apiErrors.length === 0 && data.errors.httpErrors.length === 0 && data.errors.resourceFailures.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400">No errors recorded</p>
        </div>
      )}
    </div>
  );

  const renderBatteryInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      {data.battery?.level !== undefined ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Battery Level</p>
            <p className="font-semibold text-sm">{Math.round(data.battery.level * 100)}%</p>
          </div>
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Charging Status</p>
            <p className="font-semibold text-sm">{data.battery.charging ? 'Charging' : 'Discharging'}</p>
          </div>
          {data.battery.chargingTime !== undefined && data.battery.chargingTime !== Infinity && (
            <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
              <p className="text-xs text-gray-500">Time to Full Charge</p>
              <p className="font-semibold text-sm">{Math.round(data.battery.chargingTime / 60)}m</p>
            </div>
          )}
          {data.battery.dischargingTime !== undefined && data.battery.dischargingTime !== Infinity && (
            <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
              <p className="text-xs text-gray-500">Time to Empty</p>
              <p className="font-semibold text-sm">{Math.round(data.battery.dischargingTime / 60)}m</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Battery Information</p>
          <p className="font-semibold text-sm">Not available (requires user permission)</p>
        </div>
      )}
    </div>
  );

  const renderUIPreferencesInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Color Scheme</p>
          <p className="font-semibold text-sm capitalize">{data.uiPreferences.colorScheme}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Reduced Motion</p>
          <p className="font-semibold text-sm">{data.uiPreferences.reducedMotion ? 'Enabled' : 'Disabled'}</p>
        </div>
        {data.uiPreferences.contrastPreference && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Contrast Preference</p>
            <p className="font-semibold text-sm capitalize">{data.uiPreferences.contrastPreference}</p>
          </div>
        )}
        {data.uiPreferences.theme && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Theme</p>
            <p className="font-semibold text-sm capitalize">{data.uiPreferences.theme}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPWAInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Install State</p>
          <p className="font-semibold text-sm capitalize">{data.pwa?.installState || 'Unknown'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Standalone Mode</p>
          <p className="font-semibold text-sm">{data.pwa?.standalone ? 'Yes' : 'No'}</p>
        </div>
        {data.pwa?.displayMode && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Display Mode</p>
            <p className="font-semibold text-sm capitalize">{data.pwa.displayMode}</p>
          </div>
        )}
        {data.pwa?.serviceWorkerStatus && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Service Worker</p>
            <p className="font-semibold text-sm capitalize">{data.pwa.serviceWorkerStatus}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStorageInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Local Storage Used</p>
          <p className="font-semibold text-sm">{data.storage?.localStorageUsed ? (data.storage.localStorageUsed / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Session Storage Used</p>
          <p className="font-semibold text-sm">{data.storage?.sessionStorageUsed ? (data.storage.sessionStorageUsed / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
        </div>
        {data.storage?.usage !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Storage Usage</p>
            <p className="font-semibold text-sm">{(data.storage.usage / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
        {data.storage?.quota !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Storage Quota</p>
            <p className="font-semibold text-sm">{(data.storage.quota / 1024 / 1024 / 1024).toFixed(2)} GB</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEngagementInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Engagement Score</p>
          <p className="font-semibold text-sm">{data.engagement.engagementScore ? Math.round(data.engagement.engagementScore) : 'N/A'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Interaction Count</p>
          <p className="font-semibold text-sm">{data.engagement.interactionCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Return Visits</p>
          <p className="font-semibold text-sm">{data.engagement.returnVisits}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">New/Returning</p>
          <p className="font-semibold text-sm">{data.session.isNewVisitor ? 'New' : 'Returning'}</p>
        </div>
      </div>
      {Object.keys(data.engagement.featureAdoption || {}).length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Feature Adoption</p>
          <div className="space-y-1">
            {Object.entries(data.engagement.featureAdoption || {}).map(([feature, count]) => (
              <p key={feature} className="text-sm font-semibold">{feature}: {count}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLifecycleInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Page Loaded</p>
          <p className="font-semibold text-xs">{data.lifecycle.pageLoaded ? new Date(data.lifecycle.pageLoaded).toLocaleString() : 'N/A'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Page Unloaded</p>
          <p className="font-semibold text-xs">{data.lifecycle.pageUnloaded ? new Date(data.lifecycle.pageUnloaded).toLocaleString() : 'Active'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Tab Hidden Count</p>
          <p className="font-semibold text-sm">{data.lifecycle.tabHiddenCount}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Tab Visible Count</p>
          <p className="font-semibold text-sm">{data.lifecycle.tabVisibleCount}</p>
        </div>
      </div>
    </div>
  );

  const renderClientHintsInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {data.clientHints?.platform && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Platform</p>
            <p className="font-semibold text-sm">{data.clientHints.platform}</p>
          </div>
        )}
        {data.clientHints?.architecture && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Architecture</p>
            <p className="font-semibold text-sm">{data.clientHints.architecture}</p>
          </div>
        )}
        {data.clientHints?.model && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Model</p>
            <p className="font-semibold text-sm">{data.clientHints.model}</p>
          </div>
        )}
        {data.clientHints?.formFactor && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Form Factor</p>
            <p className="font-semibold text-sm">{data.clientHints.formFactor}</p>
          </div>
        )}
      </div>
      {!data.clientHints?.platform && !data.clientHints?.architecture && !data.clientHints?.model && !data.clientHints?.formFactor && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Client Hints</p>
          <p className="font-semibold text-sm">Not available (requires browser support)</p>
        </div>
      )}
    </div>
  );

  const renderNavigationInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Entry Page</p>
          <p className="font-semibold text-sm">{data.navigation.entryPage}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Exit Page</p>
          <p className="font-semibold text-sm">{data.navigation.exitPage || 'Active'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Referrer</p>
          <p className="font-semibold text-xs break-all">{data.navigation.referrer || 'Direct'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500">Referrer Domain</p>
          <p className="font-semibold text-sm">{data.navigation.referrerDomain || 'Direct'}</p>
        </div>
        {data.navigation.navigationType && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Navigation Type</p>
            <p className="font-semibold text-sm capitalize">{data.navigation.navigationType}</p>
          </div>
        )}
        {data.navigation.redirectCount !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Redirect Count</p>
            <p className="font-semibold text-sm">{data.navigation.redirectCount}</p>
          </div>
        )}
      </div>
      {Object.keys(data.navigation.queryParams || {}).length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Query Parameters</p>
          <div className="space-y-1">
            {Object.entries(data.navigation.queryParams).map(([key, value]) => (
              <p key={key} className="text-xs font-semibold">{key}: {value}</p>
            ))}
          </div>
        </div>
      )}
      {Object.keys(data.navigation.utm || {}).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">UTM Parameters</p>
          <div className="space-y-1">
            {Object.entries(data.navigation.utm).map(([key, value]) => (
              <p key={key} className="text-xs font-semibold text-blue-700 dark:text-blue-300">{key}: {value}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionViews = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      {data.activity.sectionViews && data.activity.sectionViews.length > 0 ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-midnight_text dark:text-white">Section Views Timeline</p>
          </div>
          <div className="space-y-2">
            {data.activity.sectionViews.map((section, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-darkmode p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-4 h-4 rounded-full shadow-sm ${
                  section.duration ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                }`} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-midnight_text dark:text-white">{section.section}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {section.enterTime ? new Date(section.enterTime.seconds ? section.enterTime.seconds * 1000 : section.enterTime).toLocaleTimeString() : 'Unknown'}
                    {section.exitTime && ' → ' + new Date(section.exitTime.seconds ? section.exitTime.seconds * 1000 : section.exitTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {section.duration ? `${Math.floor(section.duration / 60)}m ${section.duration % 60}s` : 'Active'}
                  </p>
                  {section.scrollPercentage !== undefined && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{section.scrollPercentage}% scroll</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-darkmode p-5 rounded-xl border border-gray-200 dark:border-dark_border">
          <p className="text-xs text-gray-500 dark:text-gray-400">No section views recorded</p>
        </div>
      )}
    </div>
  );

  const renderAllInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-4">
      {renderDeviceInfo(data)}
      {renderNetworkInfo(data)}
      {data.battery && renderBatteryInfo(data)}
      {renderLocationInfo(data)}
      {renderBrowserInfo(data)}
      {renderUIPreferencesInfo(data)}
      {renderActivityInfo(data)}
      {renderNavigationInfo(data)}
      {renderSessionInfo(data)}
      {renderPerformanceInfo(data)}
      {renderSecurityInfo(data)}
      {renderErrorsInfo(data)}
      {data.pwa && renderPWAInfo(data)}
      {data.storage && renderStorageInfo(data)}
      {renderEngagementInfo(data)}
      {renderLifecycleInfo(data)}
      {data.clientHints && renderClientHintsInfo(data)}
      {data.activity.sectionViews && data.activity.sectionViews.length > 0 && renderSectionViews(data)}
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
      <div className="p-12 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <p className="font-bold text-sm text-midnight_text dark:text-white">Analytics Error</p>
        <p className="text-xs text-gray-500 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
              </div>
              <p className="text-sm text-white/80 mt-1">
                Comprehensive user/device data collection and analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-white/80 text-xs">Total Records</span>
                <p className="text-white text-xl font-bold">{analyticsData.length}</p>
              </div>
              {analyticsData.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filter Tabs */}
      <div className="bg-white dark:bg-darklight rounded-2xl p-2 shadow-lg border border-gray-100 dark:border-dark_border">
        <div className="flex flex-wrap gap-2">
          {(["all", "device", "network", "location", "browser", "activity", "session", "performance", "security", "errors", "battery", "uiPreferences", "pwa", "storage", "engagement", "lifecycle", "clientHints", "navigation", "sections"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 cursor-pointer ${
                filterType === type
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkmode"
              }`}
            >
              {type.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by OS, browser, country, IP, or session ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-darklight border border-gray-200 dark:border-dark_border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-midnight_text dark:text-white shadow-sm transition-all"
        />
      </div>

      {/* Data List */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <div className="text-4xl">📊</div>
            <p className="font-bold text-sm text-midnight_text dark:text-white">No analytics data found</p>
            <p className="text-xs text-gray-500">
              {searchQuery ? "Try adjusting your search query." : "Analytics data will appear here as users visit your site."}
            </p>
            <button
              onClick={() => window.open('/', '_blank')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              Visit Website to Generate Data
            </button>
          </div>
        ) : (
          filteredData.map((data) => (
            <div
              key={data.id}
              className="bg-white dark:bg-darklight rounded-2xl border border-gray-100 dark:border-dark_border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Modern Header */}
              <div
                className={`p-3 border-b border-gray-100 dark:border-dark_border cursor-pointer transition-all duration-300 ${
                  selectedData?.id === data.id 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' 
                    : 'bg-white dark:bg-darklight hover:bg-gray-50 dark:hover:bg-darkmode'
                }`}
                onClick={() => setSelectedData(selectedData?.id === data.id ? null : data)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center text-lg shadow-lg ${
                      data.session.isNewVisitor 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-br from-purple-400 to-pink-500'
                    }`}>
                      {data.session.isNewVisitor ? '🆕' : '🔄'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-midnight_text dark:text-white">
                        {data.device.os} {data.device.osVersion} - {data.device.browser} {data.device.browserVersion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                          data.device.type === 'mobile' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : data.device.type === 'tablet'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.device.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {data.location.country || "Unknown"} • {data.location.city || "Unknown"}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {data.network.ip || "Unknown IP"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-semibold ${
                          data.session.isNewVisitor 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {data.session.isNewVisitor ? '🆕 New Visitor' : '🔄 Returning Visitor'}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">
                          • {data.session.sessionCount} visits
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">
                          • {data.session.duration ? `${Math.floor(data.session.duration / 60)}m ${data.session.duration % 60}s` : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(data.id);
                      }}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition cursor-pointer"
                      title="Delete this record"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-darkmode px-2 py-1 rounded-lg">
                      {data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleString() : "Unknown"}
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      selectedData?.id === data.id 
                        ? 'bg-blue-500 text-white rotate-180' 
                        : 'bg-gray-100 dark:bg-darkmode text-gray-400 dark:text-gray-500'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {selectedData?.id === data.id && (
                <div className="p-3 bg-gray-50 dark:bg-darkmode">
                  {renderDataSection(data)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
