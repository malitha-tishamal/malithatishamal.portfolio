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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border-2 ${
          data.device.type === 'mobile' 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
            : data.device.type === 'tablet'
            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
            : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
        }`}>
          <p className="text-xs text-gray-500">Device Type</p>
          <p className="font-semibold text-sm capitalize">{data.device.type}</p>
        </div>
        {data.device.manufacturer && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Manufacturer</p>
            <p className="font-semibold text-sm">{data.device.manufacturer}</p>
          </div>
        )}
        {data.device.model && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Model</p>
            <p className="font-semibold text-sm">{data.device.model}</p>
          </div>
        )}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-300 dark:border-orange-700">
          <p className="text-xs text-gray-500">OS</p>
          <p className="font-semibold text-sm">{data.device.os} {data.device.osVersion}</p>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-300 dark:border-pink-700">
          <p className="text-xs text-gray-500">Browser</p>
          <p className="font-semibold text-sm">{data.device.browser} {data.device.browserVersion}</p>
        </div>
        {data.device.browserEngine && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Browser Engine</p>
            <p className="font-semibold text-sm">{data.device.browserEngine}</p>
          </div>
        )}
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-300 dark:border-cyan-700">
          <p className="text-xs text-gray-500">Screen Resolution</p>
          <p className="font-semibold text-sm">{data.device.screenResolution}</p>
        </div>
        {data.device.availableScreenSize && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Available Screen</p>
            <p className="font-semibold text-sm">{data.device.availableScreenSize}</p>
          </div>
        )}
        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-300 dark:border-teal-700">
          <p className="text-xs text-gray-500">Viewport</p>
          <p className="font-semibold text-sm">{data.device.viewport}</p>
        </div>
        {data.device.visualViewport && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Visual Viewport</p>
            <p className="font-semibold text-sm">{data.device.visualViewport}</p>
          </div>
        )}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-300 dark:border-amber-700">
          <p className="text-xs text-gray-500">Pixel Ratio</p>
          <p className="font-semibold text-sm">{data.device.pixelRatio}</p>
        </div>
        {data.device.colorDepth && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Color Depth</p>
            <p className="font-semibold text-sm">{data.device.colorDepth} bits</p>
          </div>
        )}
        {data.device.pixelDepth && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Pixel Depth</p>
            <p className="font-semibold text-sm">{data.device.pixelDepth} bits</p>
          </div>
        )}
        <div className={`p-3 rounded-lg border-2 ${
          data.device.orientation === 'landscape'
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
        }`}>
          <p className="text-xs text-gray-500">Orientation</p>
          <p className="font-semibold text-sm capitalize">{data.device.orientation}</p>
        </div>
        {data.device.orientationAngle !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Orientation Angle</p>
            <p className="font-semibold text-sm">{data.device.orientationAngle}°</p>
          </div>
        )}
        <div className={`p-3 rounded-lg border-2 ${
          data.device.touchSupport
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <p className="text-xs text-gray-500">Touch Support</p>
          <p className="font-semibold text-sm">{data.device.touchSupport ? "Yes" : "No"}</p>
        </div>
        {data.device.touchPoints !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Touch Points</p>
            <p className="font-semibold text-sm">{data.device.touchPoints}</p>
          </div>
        )}
        {data.device.pointerType !== 'unknown' && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Pointer Type</p>
            <p className="font-semibold text-sm capitalize">{data.device.pointerType}</p>
          </div>
        )}
        {data.device.cpuCores && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="text-xs text-gray-500">CPU Cores</p>
            <p className="font-semibold text-sm">{data.device.cpuCores}</p>
          </div>
        )}
        {data.device.hardwareConcurrency && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Hardware Concurrency</p>
            <p className="font-semibold text-sm">{data.device.hardwareConcurrency}</p>
          </div>
        )}
        {data.device.deviceMemory && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-300 dark:border-purple-700">
            <p className="text-xs text-gray-500">Device Memory</p>
            <p className="font-semibold text-sm">{data.device.deviceMemory} GB</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNetworkInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-300 dark:border-red-700">
          <p className="text-xs text-gray-500">IP Address</p>
          <p className="font-semibold text-sm">{data.network.ip || "N/A"}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${
          data.network.onlineStatus
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <p className="text-xs text-gray-500">Online Status</p>
          <p className="font-semibold text-sm">{data.network.onlineStatus ? "Online" : "Offline"}</p>
        </div>
        {data.network.connectionType && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
            <p className="text-xs text-gray-500">Connection Type</p>
            <p className="font-semibold text-sm">{data.network.connectionType}</p>
          </div>
        )}
        {data.network.effectiveType && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-300 dark:border-purple-700">
            <p className="text-xs text-gray-500">Effective Type</p>
            <p className="font-semibold text-sm capitalize">{data.network.effectiveType}</p>
          </div>
        )}
        {data.network.downloadSpeed && (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-300 dark:border-cyan-700">
            <p className="text-xs text-gray-500">Download Speed</p>
          <p className="font-semibold text-sm">{data.network.downloadSpeed} Mbps</p>
          </div>
        )}
        {data.network.rtt && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-300 dark:border-orange-700">
            <p className="text-xs text-gray-500">RTT (Latency)</p>
          <p className="font-semibold text-sm">{data.network.rtt} ms</p>
          </div>
        )}
        {data.network.saveData !== undefined && (
          <div className={`p-3 rounded-lg border-2 ${
            data.network.saveData
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
              : 'bg-gray-50 dark:bg-darkmode border border-gray-200 dark:border-dark_border'
          }`}>
            <p className="text-xs text-gray-500">Save Data</p>
            <p className="font-semibold text-sm">{data.network.saveData ? "Enabled" : "Disabled"}</p>
          </div>
        )}
        {data.network.connectionChanges > 0 && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Connection Changes</p>
            <p className="font-semibold text-sm">{data.network.connectionChanges}</p>
          </div>
        )}
        {data.network.offlineDuration > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="text-xs text-gray-500">Offline Duration</p>
            <p className="font-semibold text-sm">{Math.floor(data.network.offlineDuration / 60)}m</p>
          </div>
        )}
        {data.network.networkLatency && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Network Latency</p>
            <p className="font-semibold text-sm">{data.network.networkLatency} ms</p>
          </div>
        )}
        {data.network.downlink && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Downlink</p>
          <p className="font-semibold text-sm">{data.network.downlink} Mbps</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLocationInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-300 dark:border-emerald-700">
          <p className="text-xs text-gray-500">Country</p>
          <p className="font-semibold text-sm">{data.location.country || "N/A"}</p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-300 dark:border-teal-700">
          <p className="text-xs text-gray-500">Region</p>
          <p className="font-semibold text-sm">{data.location.region || "N/A"}</p>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-300 dark:border-cyan-700">
          <p className="text-xs text-gray-500">City</p>
          <p className="font-semibold text-sm">{data.location.city || "N/A"}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-300 dark:border-indigo-700">
          <p className="text-xs text-gray-500">Timezone</p>
          <p className="font-semibold text-sm">{data.location.timezone}</p>
        </div>
        {data.location.timezoneOffset !== undefined && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
            <p className="text-xs text-gray-500">Timezone Offset</p>
            <p className="font-semibold text-sm">{data.location.timezoneOffset} min</p>
          </div>
        )}
        {data.location.gpsPermission && (
          <div className={`p-3 rounded-lg border-2 ${
            data.location.gpsPermission === 'granted'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
              : data.location.gpsPermission === 'denied'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
          }`}>
            <p className="text-xs text-gray-500">GPS Permission</p>
            <p className="font-semibold text-sm capitalize">{data.location.gpsPermission}</p>
          </div>
        )}
        {data.location.gpsCoordinates && (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="font-semibold text-sm">{data.location.gpsCoordinates.latitude}</p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-300 dark:border-pink-700">
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="font-semibold text-sm">{data.location.gpsCoordinates.longitude}</p>
            </div>
            {data.location.gpsCoordinates.accuracy && (
              <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="font-semibold text-sm">{data.location.gpsCoordinates.accuracy}m</p>
              </div>
            )}
            {data.location.gpsCoordinates.altitude && (
              <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
                <p className="text-xs text-gray-500">Altitude</p>
                <p className="font-semibold text-sm">{data.location.gpsCoordinates.altitude}m</p>
              </div>
            )}
            {data.location.gpsCoordinates.heading && (
              <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
                <p className="text-xs text-gray-500">Heading</p>
                <p className="font-semibold text-sm">{data.location.gpsCoordinates.heading}°</p>
              </div>
            )}
            {data.location.gpsCoordinates.speed && (
              <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
                <p className="text-xs text-gray-500">Speed</p>
                <p className="font-semibold text-sm">{data.location.gpsCoordinates.speed} m/s</p>
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
          <p className="text-xs text-gray-500">Page Views</p>
          <p className="font-semibold text-sm">{data.activity.pageViews}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-300 dark:border-purple-700">
          <p className="text-xs text-gray-500">Clicks</p>
          <p className="font-semibold text-sm">{data.activity.clicks}</p>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-300 dark:border-cyan-700">
          <p className="text-xs text-gray-500">Scroll Depth</p>
          <p className="font-semibold text-sm">{data.activity.scrollDepth}%</p>
        </div>
        {data.activity.scrollDirection && data.activity.scrollDirection !== 'none' && (
          <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-300 dark:border-teal-700">
            <p className="text-xs text-gray-500">Scroll Direction</p>
            <p className="font-semibold text-sm capitalize">{data.activity.scrollDirection}</p>
          </div>
        )}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-300 dark:border-indigo-700">
          <p className="text-xs text-gray-500">Scroll Events</p>
          <p className="font-semibold text-sm">{data.activity.scrollEvents}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-300 dark:border-green-700">
          <p className="text-xs text-gray-500">Downloads</p>
          <p className="font-semibold text-sm">{data.activity.downloads}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-300 dark:border-orange-700">
          <p className="text-xs text-gray-500">Forms Started</p>
          <p className="font-semibold text-sm">{data.activity.formsStarted}</p>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-300 dark:border-pink-700">
          <p className="text-xs text-gray-500">Forms Submitted</p>
          <p className="font-semibold text-sm">{data.activity.formsSubmitted}</p>
        </div>
        {data.activity.formsAbandoned > 0 && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Forms Abandoned</p>
            <p className="font-semibold text-sm">{data.activity.formsAbandoned}</p>
          </div>
        )}
        {data.activity.formFieldsInteracted > 0 && (
          <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
            <p className="text-xs text-gray-500">Fields Interacted</p>
            <p className="font-semibold text-sm">{data.activity.formFieldsInteracted}</p>
          </div>
        )}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <p className="text-xs text-gray-500">Time on Page</p>
          <p className="font-semibold text-sm">{Math.floor(data.activity.timeOnPage / 60)}m {data.activity.timeOnPage % 60}s</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-300 dark:border-emerald-700">
          <p className="text-xs text-gray-500">Active Time</p>
          <p className="font-semibold text-sm">{Math.floor(data.activity.activeTime / 60)}m {data.activity.activeTime % 60}s</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-300 dark:border-red-700">
          <p className="text-xs text-gray-500">Inactive Time</p>
          <p className="font-semibold text-sm">{Math.floor(data.activity.inactiveTime / 60)}m {data.activity.inactiveTime % 60}s</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg border border-violet-300 dark:border-violet-700">
          <p className="text-xs text-gray-500">Mouse Movements</p>
          <p className="font-semibold text-sm">{data.activity.mouseMovements}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-300 dark:border-rose-700">
          <p className="text-xs text-gray-500">Keyboard Events</p>
          <p className="font-semibold text-sm">{data.activity.keyboardEvents}</p>
        </div>
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 p-3 rounded-lg border border-fuchsia-300 dark:border-fuchsia-700">
          <p className="text-xs text-gray-500">Touch Events</p>
          <p className="font-semibold text-sm">{data.activity.touchEvents}</p>
        </div>
      </div>
      {data.activity.sectionViews && data.activity.sectionViews.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-300 dark:border-purple-700">
          <p className="text-xs text-gray-500 mb-3 font-bold">Section Views Timeline</p>
          <div className="space-y-2">
            {data.activity.sectionViews.map((section, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-darkmode p-2 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  section.duration ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-midnight_text dark:text-white">{section.section}</p>
                  <p className="text-[10px] text-gray-500">
                    {section.enterTime ? new Date(section.enterTime.seconds ? section.enterTime.seconds * 1000 : section.enterTime).toLocaleTimeString() : 'Unknown'}
                    {section.exitTime && ' → ' + new Date(section.exitTime.seconds ? section.exitTime.seconds * 1000 : section.exitTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {section.duration ? `${Math.floor(section.duration / 60)}m ${section.duration % 60}s` : 'Active'}
                  </p>
                  {section.scrollPercentage !== undefined && (
                    <p className="text-[10px] text-gray-500">{section.scrollPercentage}% scroll</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.activity.searchQueries.length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Search Queries</p>
          <div className="space-y-1">
            {data.activity.searchQueries.map((query, idx) => (
              <p key={idx} className="text-sm font-semibold">{query}</p>
            ))}
          </div>
        </div>
      )}
      {data.activity.downloadsList.length > 0 && (
        <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Downloads List</p>
          <div className="space-y-1">
            {data.activity.downloadsList.map((download, idx) => (
              <p key={idx} className="text-xs font-semibold">{download.filename} ({download.type})</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSessionInfo = (data: AdvancedAnalyticsData) => (
    <div className="space-y-3">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-300 dark:border-indigo-700">
        <p className="text-xs text-gray-500">Session ID</p>
        <p className="font-semibold text-xs break-all">{data.session.sessionId}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-300 dark:border-green-700">
          <p className="text-xs text-gray-500">Start Time</p>
          <p className="font-semibold text-xs">{data.session.startTime?.seconds ? new Date(data.session.startTime.seconds * 1000).toLocaleString() : "N/A"}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-300 dark:border-red-700">
          <p className="text-xs text-gray-500">End Time</p>
          <p className="font-semibold text-xs">{data.session.endTime?.seconds ? new Date(data.session.endTime.seconds * 1000).toLocaleString() : "Active"}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold text-sm">{data.session.duration ? `${Math.floor(data.session.duration / 60)}m ${data.session.duration % 60}s` : "Active"}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
          <p className="text-xs text-gray-500">Entry Page</p>
          <p className="font-semibold text-sm">{data.session.entryPage}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-300 dark:border-purple-700">
          <p className="text-xs text-gray-500">Exit Page</p>
          <p className="font-semibold text-sm">{data.session.exitPage || "Active"}</p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-300 dark:border-teal-700">
          <p className="text-xs text-gray-500">Session Count</p>
          <p className="font-semibold text-sm">{data.session.sessionCount}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${
          data.session.isNewVisitor
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
        }`}>
          <p className="text-xs text-gray-500">Visitor Type</p>
          <p className="font-semibold text-sm">{data.session.isNewVisitor ? "New" : "Returning"}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${
          data.session.tabVisibility === 'visible'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-gray-50 dark:bg-darkmode border border-gray-200 dark:border-dark_border'
        }`}>
          <p className="text-xs text-gray-500">Tab Visibility</p>
          <p className="font-semibold text-sm capitalize">{data.session.tabVisibility}</p>
        </div>
        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-300 dark:border-pink-700">
          <p className="text-xs text-gray-500">Tab Switches</p>
          <p className="font-semibold text-sm">{data.session.tabSwitches}</p>
        </div>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-300 dark:border-cyan-700">
          <p className="text-xs text-gray-500">Last Activity</p>
          <p className="font-semibold text-xs">{data.session.lastActivity?.seconds ? new Date(data.session.lastActivity.seconds * 1000).toLocaleString() : "N/A"}</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-darkmode p-3 rounded-lg border border-gray-200 dark:border-dark_border">
        <p className="text-xs text-gray-500 mb-2">Pages Visited</p>
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
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-300 dark:border-purple-700">
          <p className="text-xs text-gray-500 mb-3 font-bold">Section Views Timeline</p>
          <div className="space-y-2">
            {data.activity.sectionViews.map((section, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-darkmode p-2 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  section.duration ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-midnight_text dark:text-white">{section.section}</p>
                  <p className="text-[10px] text-gray-500">
                    {section.enterTime ? new Date(section.enterTime.seconds ? section.enterTime.seconds * 1000 : section.enterTime).toLocaleTimeString() : 'Unknown'}
                    {section.exitTime && ' → ' + new Date(section.exitTime.seconds ? section.exitTime.seconds * 1000 : section.exitTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {section.duration ? `${Math.floor(section.duration / 60)}m ${section.duration % 60}s` : 'Active'}
                  </p>
                  {section.scrollPercentage !== undefined && (
                    <p className="text-[10px] text-gray-500">{section.scrollPercentage}% scroll</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-darkmode p-4 rounded-lg">
          <p className="text-xs text-gray-500">No section views recorded</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-midnight_text dark:text-white">Advanced Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Comprehensive user/device data collection and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
            {analyticsData.length} Records
          </span>
          {analyticsData.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition cursor-pointer"
            >
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border dark:border-dark_border pb-2">
        {(["all", "device", "network", "location", "browser", "activity", "session", "performance", "security", "errors", "battery", "uiPreferences", "pwa", "storage", "engagement", "lifecycle", "clientHints", "navigation", "sections"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
              filterType === type
                ? "bg-primary text-white"
                : "text-gray-500 hover:text-dark dark:hover:text-white"
            }`}
          >
            {type.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by OS, browser, country, IP, or session ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border focus:outline-none focus:border-primary text-midnight_text dark:text-white"
        />
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
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
              className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border overflow-hidden"
            >
              {/* Header */}
              <div
                className={`p-4 border-b border-border dark:border-dark_border cursor-pointer hover:bg-gray-100 dark:hover:bg-darklight transition ${
                  selectedData?.id === data.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-darkmode'
                }`}
                onClick={() => setSelectedData(selectedData?.id === data.id ? null : data)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center text-lg ${
                      data.session.isNewVisitor 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                    }`}>
                      {data.session.isNewVisitor ? '🆕' : '�'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-midnight_text dark:text-white">
                        {data.device.os} {data.device.osVersion} - {data.device.browser} {data.device.browserVersion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          data.device.type === 'mobile' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : data.device.type === 'tablet'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.device.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {data.location.country || "Unknown"} • {data.location.city || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {data.network.ip || "Unknown IP"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold ${
                          data.session.isNewVisitor 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {data.session.isNewVisitor ? '🆕 New Visitor' : '🔄 Returning Visitor'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          • {data.session.sessionCount} visits
                        </span>
                        <span className="text-[10px] text-gray-400">
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
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition cursor-pointer"
                      title="Delete this record"
                    >
                      🗑️
                    </button>
                    <span className="text-xs text-gray-400">
                      {data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleString() : "Unknown"}
                    </span>
                    <span className="text-lg">{selectedData?.id === data.id ? "▼" : "▶"}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {selectedData?.id === data.id && (
                <div className="p-4">
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
