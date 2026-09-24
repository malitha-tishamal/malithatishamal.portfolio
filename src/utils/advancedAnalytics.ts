import { AdvancedAnalyticsData, defaultAdvancedAnalytics } from '@/types/advancedAnalytics';

/**
 * Helper function to remove undefined/null values recursively
 */
const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = cleanObject(obj[key]);
        if (value !== null && value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Collect comprehensive user/device analytics data
 */
export const collectAdvancedAnalytics = async (): Promise<AdvancedAnalyticsData> => {
  const data = {
    ...defaultAdvancedAnalytics,
    timestamp: new Date(),
  } as AdvancedAnalyticsData;

  // Device Information
  data.device = await collectDeviceInfo();

  // Network Information
  data.network = await collectNetworkInfo();

  // Battery Information
  data.battery = await collectBatteryInfo();

  // Location Information
  data.location = await collectLocationInfo();

  // Browser Information
  data.browser = collectBrowserInfo();

  // UI Preferences
  data.uiPreferences = collectUIPreferences();

  // Session Information
  data.session = collectSessionInfo();

  // Navigation Information
  data.navigation = collectNavigationInfo();

  // Performance Information
  data.performance = await collectPerformanceInfo();

  // PWA Information
  data.pwa = collectPWAInfo();

  // Storage Information
  data.storage = await collectStorageInfo();

  // Engagement Information
  data.engagement = collectEngagementInfo();

  // Lifecycle Information
  data.lifecycle = collectLifecycleInfo();

  // Client Hints
  data.clientHints = await collectClientHints();

  // Clean the entire data object before returning
  return cleanObject(data);
};

/**
 * Collect device information
 */
const collectDeviceInfo = async () => {
  const device: any = {
    type: 'unknown' as 'desktop' | 'mobile' | 'tablet' | 'unknown',
    os: 'Unknown',
    osVersion: 'Unknown',
    browser: 'Unknown',
    browserVersion: 'Unknown',
    screenResolution: 'Unknown',
    viewport: 'Unknown',
    pixelRatio: 1,
    orientation: 'landscape' as 'portrait' | 'landscape',
    touchSupport: false,
    pointerType: 'unknown' as 'mouse' | 'touch' | 'pen' | 'unknown',
  };

  if (typeof window !== 'undefined') {
    // Screen resolution
    device.screenResolution = `${window.screen.width} × ${window.screen.height}`;
    device.availableScreenSize = `${window.screen.availWidth} × ${window.screen.availHeight}`;
    device.viewport = `${window.innerWidth} × ${window.innerHeight}`;
    device.pixelRatio = window.devicePixelRatio || 1;
    device.colorDepth = window.screen.colorDepth;
    device.pixelDepth = window.screen.pixelDepth;
    device.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    device.orientationAngle = (screen as any).orientation?.angle;
    device.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    device.touchPoints = navigator.maxTouchPoints;

    // CPU cores
    if (navigator.hardwareConcurrency) {
      device.cpuCores = navigator.hardwareConcurrency;
      device.hardwareConcurrency = navigator.hardwareConcurrency;
    }

    // Device memory
    if ((navigator as any).deviceMemory) {
      device.deviceMemory = (navigator as any).deviceMemory;
    }

    // Pointer type
    if ((navigator as any).pointerType) {
      device.pointerType = (navigator as any).pointerType;
    }

    // Device type detection
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      device.type = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
    } else {
      device.type = 'desktop';
    }

    // OS detection
    if (userAgent.includes('Windows')) {
      device.os = 'Windows';
      const match = userAgent.match(/Windows NT (\d+\.\d+)/);
      device.osVersion = match ? `Windows ${match[1]}` : 'Windows';
    } else if (userAgent.includes('Mac')) {
      device.os = 'macOS';
      const match = userAgent.match(/Mac OS X (\d+[_\.]\d+)/);
      device.osVersion = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
    } else if (userAgent.includes('Linux')) {
      device.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      device.os = 'Android';
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      device.osVersion = match ? `Android ${match[1]}` : 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      device.os = 'iOS';
    }

    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      device.browser = 'Chrome';
      device.browserEngine = 'Blink';
      const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      device.browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      device.browser = 'Firefox';
      device.browserEngine = 'Gecko';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      device.browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      device.browser = 'Safari';
      device.browserEngine = 'WebKit';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      device.browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edg')) {
      device.browser = 'Edge';
      device.browserEngine = 'Blink';
      const match = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
      device.browserVersion = match ? match[1] : 'Unknown';
    }

    // Visual viewport
    if ((window as any).visualViewport) {
      const vv = (window as any).visualViewport;
      device.visualViewport = `${Math.round(vv.width)} × ${Math.round(vv.height)} (scale: ${vv.scale})`;
    }
  }

  // Remove undefined values before returning
  Object.keys(device).forEach(key => {
    if (device[key] === undefined) {
      delete device[key];
    }
  });

  return device;
};

/**
 * Collect network information
 */
const collectNetworkInfo = async () => {
  const network: any = {
    onlineStatus: true,
    connectionChanges: 0,
    offlineDuration: 0,
  };

  if (typeof navigator !== 'undefined') {
    network.onlineStatus = navigator.onLine;

    // Network Information API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      network.connectionType = connection.type;
      network.effectiveType = connection.effectiveType;
      network.downloadSpeed = connection.downlink;
      network.rtt = connection.rtt;
      network.saveData = connection.saveData;
      network.downlink = connection.downlink;
      network.networkLatency = connection.rtt;
    }
  }

  // Fetch IP address
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    network.ip = data.ip;
  } catch (error) {
    console.error('Failed to fetch IP:', error);
  }

  // Remove undefined values before returning
  Object.keys(network).forEach(key => {
    if (network[key] === undefined) {
      delete network[key];
    }
  });

  return network;
};

/**
 * Collect battery information
 */
const collectBatteryInfo = async () => {
  const battery: any = {};

  if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
    try {
      const batteryManager = await (navigator as any).getBattery();
      battery.level = batteryManager.level;
      battery.charging = batteryManager.charging;
      battery.chargingTime = batteryManager.chargingTime;
      battery.dischargingTime = batteryManager.dischargingTime;
    } catch (error) {
      // Battery API not supported or permission denied
    }
  }

  // Remove undefined values before returning
  Object.keys(battery).forEach(key => {
    if (battery[key] === undefined) {
      delete battery[key];
    }
  });

  // Return null if no battery data
  return Object.keys(battery).length > 0 ? battery : null;
};

/**
 * Collect location information
 */
const collectLocationInfo = async () => {
  const location: any = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    gpsPermission: 'unknown' as 'granted' | 'denied' | 'prompt' | 'unknown',
  };

  // Fetch IP-based location
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    location.country = data.country_name;
    location.region = data.region;
    location.city = data.city;
  } catch (error) {
    console.error('Failed to fetch location:', error);
  }

  // Try to get GPS coordinates (requires user permission)
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location.gpsCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
      };
      location.gpsPermission = 'granted';
    } catch (error: any) {
      if (error.code === 1) {
        location.gpsPermission = 'denied';
      } else if (error.code === 2) {
        location.gpsPermission = 'unknown';
      } else {
        location.gpsPermission = 'prompt';
      }
    }
  }

  // Remove undefined values before returning
  Object.keys(location).forEach(key => {
    if (location[key] === undefined) {
      delete location[key];
    }
  });

  // Clean up gpsCoordinates nested object
  if (location.gpsCoordinates) {
    Object.keys(location.gpsCoordinates).forEach(key => {
      if (location.gpsCoordinates[key] === undefined || location.gpsCoordinates[key] === null) {
        delete location.gpsCoordinates[key];
      }
    });
    // Remove gpsCoordinates if empty
    if (Object.keys(location.gpsCoordinates).length === 0) {
      delete location.gpsCoordinates;
    }
  }

  return location;
};

/**
 * Collect browser information
 */
const collectBrowserInfo = () => {
  const browser: any = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    languages: typeof navigator !== 'undefined' ? navigator.languages : ['en-US'],
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    capabilities: {},
    mediaCapabilities: {},
    permissionStates: {},
  };

  if (typeof window !== 'undefined') {
    // WebGL support
    const canvas = document.createElement('canvas');
    browser.capabilities.webGL = !!(window as any).WebGLRenderingContext && 
      !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    browser.capabilities.webGL2 = !!(window as any).WebGL2RenderingContext && 
      !!canvas.getContext('webgl2');

    // Touch support
    browser.capabilities.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Bluetooth
    browser.capabilities.bluetooth = !!(navigator as any).bluetooth;
    browser.capabilities.webBluetooth = !!(navigator as any).bluetooth;

    // USB
    browser.capabilities.usb = !!(navigator as any).usb;

    // MIDI
    browser.capabilities.midi = !!(navigator as any).requestMIDIAccess;

    // Ambient Light
    browser.capabilities.ambientLight = !!(window as any).AmbientLightSensor;

    // Vibration
    browser.capabilities.vibration = 'vibrate' in navigator;

    // Web Share
    browser.capabilities.webShare = 'share' in navigator;

    // WebRTC
    browser.capabilities.webRTCPeerConnection = !!(window as any).RTCPeerConnection;

    // NFC
    browser.capabilities.nfc = !!(navigator as any).NDEFReader;

    // Clipboard
    browser.capabilities.clipboard = !!(navigator as any).clipboard;

    // File
    browser.capabilities.file = 'showOpenFilePicker' in window;

    // Print
    browser.capabilities.print = 'print' in window;

    // Storage
    browser.capabilities.storage = 'storage' in navigator;

    // Notifications
    browser.capabilities.notifications = 'Notification' in window;

    // Geolocation
    browser.capabilities.geolocation = 'geolocation' in navigator;

    // Sensors
    browser.capabilities.sensors = !!(window as any).Sensor || !!(window as any).DeviceOrientationEvent;

    // Media capabilities
    browser.mediaCapabilities.camera = !!(navigator as any).mediaDevices?.getUserMedia;
    browser.mediaCapabilities.microphone = !!(navigator as any).mediaDevices?.getUserMedia;
    browser.mediaCapabilities.audioOutput = !!(navigator as any).AudioContext;

    // Permission states
    if ('permissions' in navigator) {
      (navigator as any).permissions.query({ name: 'notifications' }).then((result: any) => {
        browser.permissionStates.notifications = result.state;
      }).catch(() => {});
      (navigator as any).permissions.query({ name: 'geolocation' }).then((result: any) => {
        browser.permissionStates.geolocation = result.state;
      }).catch(() => {});
    }
  }

  return cleanObject(browser);
};

/**
 * Collect UI preferences
 */
const collectUIPreferences = () => {
  const uiPreferences: any = {
    colorScheme: 'unknown' as 'light' | 'dark' | 'unknown',
    reducedMotion: false,
  };

  if (typeof window !== 'undefined') {
    // Color scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      uiPreferences.colorScheme = 'dark';
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      uiPreferences.colorScheme = 'light';
    }

    // Reduced motion
    uiPreferences.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      uiPreferences.contrastPreference = 'high';
    } else if (window.matchMedia('(prefers-contrast: low)').matches) {
      uiPreferences.contrastPreference = 'low';
    }

    // Theme from localStorage
    if (localStorage.getItem('theme')) {
      uiPreferences.theme = localStorage.getItem('theme');
    }
  }

  return cleanObject(uiPreferences);
};

/**
 * Collect session information
 */
const collectSessionInfo = () => {
  const sessionId = localStorage.getItem('analytics_session_id') || 
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('analytics_session_id', sessionId);

  // Check if returning visitor
  const visitCount = parseInt(localStorage.getItem('analytics_visit_count') || '0');
  const lastVisit = localStorage.getItem('analytics_last_visit');
  const isNewVisitor = visitCount === 0;
  const isReturningVisitor = visitCount > 0;

  // Update visit count
  localStorage.setItem('analytics_visit_count', (visitCount + 1).toString());
  localStorage.setItem('analytics_last_visit', new Date().toISOString());

  const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pagesVisited = JSON.parse(localStorage.getItem('analytics_pages_visited') || JSON.stringify([currentPage]));
  const pageSequence = JSON.parse(localStorage.getItem('analytics_page_sequence') || JSON.stringify([currentPage]));

  // Update pages visited
  if (!pagesVisited.includes(currentPage)) {
    pagesVisited.push(currentPage);
    localStorage.setItem('analytics_pages_visited', JSON.stringify(pagesVisited));
  }

  // Update page sequence
  pageSequence.push(currentPage);
  localStorage.setItem('analytics_page_sequence', JSON.stringify(pageSequence));

  const session: any = {
    sessionId,
    startTime: new Date(),
    entryPage: currentPage,
    pagesVisited,
    pageSequence,
    sessionCount: visitCount + 1,
    isNewVisitor,
    isReturningVisitor,
    tabVisibility: 'visible' as 'visible' | 'hidden',
    tabSwitches: parseInt(localStorage.getItem('analytics_tab_switches') || '0'),
    lastActivity: new Date(),
  };

  return cleanObject(session);
};

/**
 * Collect navigation information
 */
const collectNavigationInfo = () => {
  const navigation: any = {
    entryPage: typeof window !== 'undefined' ? window.location.pathname : '/',
    routeTransitions: JSON.parse(localStorage.getItem('analytics_route_transitions') || '[]'),
    url: typeof window !== 'undefined' ? window.location.href : '',
    urlPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    queryParams: {},
    utm: {},
  };

  if (typeof window !== 'undefined') {
    // Referrer
    if (document.referrer) {
      navigation.referrer = document.referrer;
      try {
        const url = new URL(document.referrer);
        navigation.referrerDomain = url.hostname;
      } catch (error) {
        // Invalid referrer URL
      }
    }

    // Hash
    if (window.location.hash) {
      navigation.hash = window.location.hash;
    }

    // Query parameters
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      navigation.queryParams[key] = value;
    });

    // UTM parameters
    if (urlParams.get('utm_source')) navigation.utm.source = urlParams.get('utm_source');
    if (urlParams.get('utm_medium')) navigation.utm.medium = urlParams.get('utm_medium');
    if (urlParams.get('utm_campaign')) navigation.utm.campaign = urlParams.get('utm_campaign');
    if (urlParams.get('utm_term')) navigation.utm.term = urlParams.get('utm_term');
    if (urlParams.get('utm_content')) navigation.utm.content = urlParams.get('utm_content');

    // Navigation type
    if (window.performance && (window.performance as any).navigation) {
      navigation.navigationType = (window.performance as any).navigation.type;
      navigation.redirectCount = (window.performance as any).navigation.redirectCount;
    }
  }

  return cleanObject(navigation);
};

/**
 * Collect performance information
 */
const collectPerformanceInfo = async () => {
  const performance: any = {
    resourceTiming: [],
  };

  if (typeof window !== 'undefined' && 'performance' in window) {
    const perf = window.performance;

    // Page load time
    const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      performance.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      performance.dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      performance.connectionTime = navigation.connectEnd - navigation.connectStart;
      performance.ttfb = navigation.responseStart - navigation.fetchStart;
      performance.fcp = navigation.responseStart - navigation.fetchStart;
    }

    // Resource timing
    const resources = perf.getEntriesByType('resource') as PerformanceResourceTiming[];
    performance.resourceTiming = resources.slice(0, 20).map(r => ({
      name: r.name,
      duration: r.duration,
      size: r.transferSize,
      type: r.initiatorType,
    }));

    // Memory info
    if ((perf as any).memory) {
      performance.memoryInfo = {
        usedJSHeapSize: (perf as any).memory.usedJSHeapSize,
        totalJSHeapSize: (perf as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (perf as any).memory.jsHeapSizeLimit,
      };
    }
  }

  return cleanObject(performance);
};

/**
 * Collect PWA information
 */
const collectPWAInfo = () => {
  const pwa: any = {
    installState: 'unknown' as 'installed' | 'not-installed' | 'unknown',
    standalone: false,
  };

  if (typeof window !== 'undefined') {
    // Standalone mode
    pwa.standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (navigator as any).standalone === true;

    // Display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      pwa.displayMode = 'standalone';
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      pwa.displayMode = 'fullscreen';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      pwa.displayMode = 'minimal-ui';
    }

    // Service worker status
    if ('serviceWorker' in navigator) {
      pwa.serviceWorkerStatus = 'supported';
      if ((navigator as any).serviceWorker.controller) {
        pwa.serviceWorkerStatus = 'active';
      }
    }

    // Install state
    if (pwa.standalone) {
      pwa.installState = 'installed';
    }
  }

  return cleanObject(pwa);
};

/**
 * Collect storage information
 */
const collectStorageInfo = async () => {
  const storage: any = {
    localStorageUsed: 0,
    sessionStorageUsed: 0,
  };

  if (typeof window !== 'undefined') {
    // Local storage usage
    let localStorageSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageSize += localStorage[key].length + key.length;
      }
    }
    storage.localStorageUsed = localStorageSize;

    // Session storage usage
    let sessionStorageSize = 0;
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        sessionStorageSize += sessionStorage[key].length + key.length;
      }
    }
    storage.sessionStorageUsed = sessionStorageSize;

    // Storage estimate
    if ('storage' in navigator && (navigator as any).storage.estimate) {
      try {
        const estimate = await (navigator as any).storage.estimate();
        storage.usage = estimate.usage;
        storage.quota = estimate.quota;
      } catch (error) {
        // Storage estimate not supported
      }
    }
  }

  return cleanObject(storage);
};

/**
 * Collect engagement information
 */
const collectEngagementInfo = () => {
  const engagement: any = {
    interactionCount: 0,
    returnVisits: parseInt(localStorage.getItem('analytics_visit_count') || '0'),
    featureAdoption: {},
  };

  if (typeof window !== 'undefined') {
    // Get interaction count from activity data
    const activity = JSON.parse(localStorage.getItem('analytics_activity') || '{}');
    engagement.interactionCount = activity.clicks || 0;

    // Calculate engagement score (simple formula)
    const timeOnPage = (Date.now() - parseInt(localStorage.getItem('analytics_session_start') || Date.now().toString())) / 1000;
    const clicks = engagement.interactionCount;
    const scrollDepth = activity.scrollDepth || 0;
    engagement.engagementScore = Math.min(100, (timeOnPage / 60) * 10 + clicks * 5 + scrollDepth * 0.5);
  }

  return cleanObject(engagement);
};

/**
 * Collect lifecycle information
 */
const collectLifecycleInfo = () => {
  const lifecycle: any = {
    pageLoaded: new Date(),
    tabHiddenCount: parseInt(localStorage.getItem('analytics_tab_hidden_count') || '0'),
    tabVisibleCount: parseInt(localStorage.getItem('analytics_tab_visible_count') || '1'),
    pageFrozen: false,
    sessionResumed: false,
  };

  return cleanObject(lifecycle);
};

/**
 * Collect client hints
 */
const collectClientHints = async () => {
  const clientHints: any = {};

  if (typeof navigator !== 'undefined' && (navigator as any).userAgentData) {
    try {
      const uaData = await (navigator as any).userAgentData.getHighEntropyValues(['architecture', 'model', 'platform', 'formFactor']);
      clientHints.platform = uaData.platform;
      clientHints.architecture = uaData.architecture;
      clientHints.model = uaData.model;
      clientHints.formFactor = uaData.formFactor;
    } catch (error) {
      // Client hints not supported
    }
  }

  return cleanObject(clientHints);
};

/**
 * Update activity data (called on user interactions)
 */
export const updateActivityData = (type: 'click' | 'scroll' | 'search' | 'download' | 'form-start' | 'form-submit' | 'form-abandon' | 'keyboard' | 'touch' | 'scroll-direction', value?: string) => {
  const activityKey = 'analytics_activity';
  const activity = JSON.parse(localStorage.getItem(activityKey) || JSON.stringify({
    clicks: 0,
    scrollDepth: 0,
    scrollDirection: 'none',
    scrollEvents: 0,
    searchQueries: [],
    downloads: 0,
    downloadsList: [],
    formsStarted: 0,
    formsSubmitted: 0,
    formsAbandoned: 0,
    formFieldsInteracted: 0,
    timeOnPage: Date.now(),
    activeTime: 0,
    inactiveTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    touchEvents: 0,
    sectionViews: [],
  }));

  switch (type) {
    case 'click':
      activity.clicks++;
      break;
    case 'scroll':
      activity.scrollDepth = Math.max(activity.scrollDepth, value ? parseInt(value) : 0);
      activity.scrollEvents++;
      break;
    case 'scroll-direction':
      activity.scrollDirection = value || 'none';
      break;
    case 'search':
      if (value) activity.searchQueries.push(value);
      break;
    case 'download':
      activity.downloads++;
      if (value) {
        activity.downloadsList.push({
          filename: value,
          type: value.split('.').pop() || 'unknown',
          timestamp: new Date(),
        });
      }
      break;
    case 'form-start':
      activity.formsStarted++;
      break;
    case 'form-submit':
      activity.formsSubmitted++;
      break;
    case 'form-abandon':
      activity.formsAbandoned++;
      break;
    case 'keyboard':
      activity.keyboardEvents++;
      break;
    case 'touch':
      activity.touchEvents++;
      break;
  }

  localStorage.setItem(activityKey, JSON.stringify(activity));
  return activity;
};

/**
 * Get current activity data
 */
export const getActivityData = () => {
  const activityKey = 'analytics_activity';
  const activity = JSON.parse(localStorage.getItem(activityKey) || JSON.stringify({
    clicks: 0,
    scrollDepth: 0,
    scrollDirection: 'none',
    scrollEvents: 0,
    searchQueries: [],
    downloads: 0,
    downloadsList: [],
    formsStarted: 0,
    formsSubmitted: 0,
    formsAbandoned: 0,
    formFieldsInteracted: 0,
    timeOnPage: Date.now(),
    activeTime: 0,
    inactiveTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    touchEvents: 0,
  }));

  // Calculate time on page
  const now = Date.now();
  const sessionStart = parseInt(localStorage.getItem('analytics_session_start') || now.toString());
  activity.timeOnPage = Math.floor((now - sessionStart) / 1000);

  return activity;
};

/**
 * End session and save to Firestore
 */
export const endSession = async () => {
  const sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) return;

  const sessionKey = 'analytics_session';
  const session = JSON.parse(localStorage.getItem(sessionKey) || '{}');

  session.endTime = new Date();
  session.duration = Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000);
  session.exitPage = typeof window !== 'undefined' ? window.location.pathname : '/';

  localStorage.setItem(sessionKey, JSON.stringify(session));
  localStorage.removeItem('analytics_session_id');

  return session;
};

/**
 * Track section view entry
 */
export const trackSectionEnter = (sectionName: string) => {
  const activityKey = 'analytics_activity';
  const activity = JSON.parse(localStorage.getItem(activityKey) || JSON.stringify({
    clicks: 0,
    scrollDepth: 0,
    scrollDirection: 'none',
    scrollEvents: 0,
    searchQueries: [],
    downloads: 0,
    downloadsList: [],
    formsStarted: 0,
    formsSubmitted: 0,
    formsAbandoned: 0,
    formFieldsInteracted: 0,
    timeOnPage: Date.now(),
    activeTime: 0,
    inactiveTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    touchEvents: 0,
    sectionViews: [],
  }));

  if (!activity.sectionViews) {
    activity.sectionViews = [];
  }

  // Check if this section is already being tracked
  const existingSection = activity.sectionViews.find((s: any) => s.section === sectionName && !s.exitTime);
  
  if (!existingSection) {
    activity.sectionViews.push({
      section: sectionName,
      enterTime: new Date(),
      exitTime: null,
      duration: null,
      scrollPercentage: 0,
    });
  }

  localStorage.setItem(activityKey, JSON.stringify(activity));
};

/**
 * Track section view exit
 */
export const trackSectionExit = (sectionName: string, scrollPercentage: number = 0) => {
  const activityKey = 'analytics_activity';
  const activity = JSON.parse(localStorage.getItem(activityKey) || JSON.stringify({
    clicks: 0,
    scrollDepth: 0,
    scrollDirection: 'none',
    scrollEvents: 0,
    searchQueries: [],
    downloads: 0,
    downloadsList: [],
    formsStarted: 0,
    formsSubmitted: 0,
    formsAbandoned: 0,
    formFieldsInteracted: 0,
    timeOnPage: Date.now(),
    activeTime: 0,
    inactiveTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    touchEvents: 0,
    sectionViews: [],
  }));

  if (!activity.sectionViews) {
    activity.sectionViews = [];
  }

  // Find the open section view
  const sectionIndex = activity.sectionViews.findIndex((s: any) => s.section === sectionName && !s.exitTime);
  
  if (sectionIndex !== -1) {
    const section = activity.sectionViews[sectionIndex];
    section.exitTime = new Date();
    section.duration = Math.floor((new Date().getTime() - new Date(section.enterTime).getTime()) / 1000);
    section.scrollPercentage = scrollPercentage;
    activity.sectionViews[sectionIndex] = section;
  }

  localStorage.setItem(activityKey, JSON.stringify(activity));
};
