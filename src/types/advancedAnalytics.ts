export interface AdvancedAnalyticsData {
  id?: string;
  timestamp: any;
  
  // Account Data
  account?: {
    name?: string;
    email?: string;
    username?: string;
    profileImage?: string;
    role?: string;
    accountId?: string;
    accountCreationDate?: any;
    accountStatus?: string;
    authenticationState?: string;
    authenticationMethod?: string;
  };
  
  // Device Information
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    manufacturer?: string;
    model?: string;
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    browserEngine?: string;
    screenResolution: string;
    availableScreenSize?: string;
    viewport: string;
    visualViewport?: string;
    pixelRatio: number;
    colorDepth?: number;
    pixelDepth?: number;
    orientation: 'portrait' | 'landscape';
    orientationAngle?: number;
    cpuCores?: number;
    deviceMemory?: number;
    touchSupport: boolean;
    touchPoints?: number;
    pointerType?: 'mouse' | 'touch' | 'pen' | 'unknown';
    hardwareConcurrency?: number;
  };
  
  // Network Information
  network: {
    ip?: string;
    onlineStatus: boolean;
    connectionType?: string;
    effectiveType?: string;
    downloadSpeed?: number;
    rtt?: number;
    saveData?: boolean;
    connectionChanges?: number;
    offlineDuration?: number;
    networkLatency?: number;
    downlink?: number;
  };
  
  // Battery Information
  battery?: {
    level?: number;
    charging?: boolean;
    chargingTime?: number;
    dischargingTime?: number;
  };
  
  // Location
  location: {
    country?: string;
    region?: string;
    city?: string;
    timezone: string;
    timezoneOffset?: number;
    gpsCoordinates?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      altitude?: number;
      heading?: number;
      speed?: number;
    };
    gpsPermission?: 'granted' | 'denied' | 'prompt' | 'unknown';
  };
  
  // Browser Data
  browser: {
    userAgent: string;
    language: string;
    languages: string[];
    cookiesEnabled: boolean;
    capabilities: {
      webGL?: boolean;
      webGL2?: boolean;
      touch?: boolean;
      bluetooth?: boolean;
      usb?: boolean;
      midi?: boolean;
      ambientLight?: boolean;
      vibration?: boolean;
      webShare?: boolean;
      webRTCPeerConnection?: boolean;
      nfc?: boolean;
      clipboard?: boolean;
      file?: boolean;
      print?: boolean;
      storage?: boolean;
      notifications?: boolean;
      geolocation?: boolean;
      sensors?: boolean;
      webBluetooth?: boolean;
    };
    mediaCapabilities?: {
      audioOutput?: boolean;
      camera?: boolean;
      microphone?: boolean;
      supportedFormats?: string[];
    };
    permissionStates?: {
      notifications?: string;
      geolocation?: string;
      camera?: string;
      microphone?: string;
    };
  };
  
  // UI Preferences
  uiPreferences: {
    colorScheme: 'light' | 'dark' | 'unknown';
    reducedMotion?: boolean;
    contrastPreference?: string;
    theme?: string;
  };
  
  // Accessibility
  accessibility?: {
    screenReader?: boolean;
    highContrast?: boolean;
    fontSize?: number;
  };
  
  // Activity
  activity: {
    pageViews: number;
    clicks: number;
    scrollDepth: number;
    scrollDirection?: 'up' | 'down' | 'none';
    scrollSpeed?: number;
    scrollEvents: number;
    searchQueries: string[];
    downloads: number;
    downloadsList: Array<{ filename: string; type: string; timestamp: any }>;
    formsStarted: number;
    formsSubmitted: number;
    formsAbandoned: number;
    formFieldsInteracted: number;
    timeOnPage: number;
    activeTime: number;
    inactiveTime: number;
    mouseMovements: number;
    pointerCoordinates?: Array<{ x: number; y: number; timestamp: any }>;
    keyboardEvents: number;
    touchEvents: number;
    touchPoints?: number;
    gestureInteractions?: number;
    sectionViews?: Array<{
      section: string;
      enterTime: any;
      exitTime?: any;
      duration?: number;
      scrollPercentage?: number;
    }>;
  };
  
  // Navigation
  navigation: {
    entryPage: string;
    exitPage?: string;
    previousPage?: string;
    referrer?: string;
    referrerDomain?: string;
    navigationType?: string;
    redirectCount?: number;
    routeTransitions: string[];
    url: string;
    urlPath: string;
    queryParams?: Record<string, string>;
    hash?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  };
  
  // Session
  session: {
    sessionId: string;
    startTime: any;
    endTime?: any;
    duration?: number;
    entryPage: string;
    exitPage?: string;
    pagesVisited: string[];
    pageSequence: string[];
    sessionCount: number;
    isNewVisitor: boolean;
    isReturningVisitor: boolean;
    tabVisibility: 'visible' | 'hidden';
    tabSwitches: number;
    lastActivity: any;
  };
  
  // Performance
  performance: {
    lcp?: number;
    cls?: number;
    inp?: number;
    fcp?: number;
    ttfb?: number;
    pageLoadTime?: number;
    apiResponseTime?: number;
    dnsTime?: number;
    connectionTime?: number;
    tlsTime?: number;
    resourceTiming?: Array<{
      name: string;
      duration: number;
      size: number;
      type: string;
    }>;
    memoryInfo?: {
      usedJSHeapSize?: number;
      totalJSHeapSize?: number;
      jsHeapSizeLimit?: number;
    };
  };
  
  // Security
  security: {
    loginAttempts?: number;
    failedLogins?: number;
    ip?: string;
    suspiciousActivity?: boolean;
    rateLimitEvents?: number;
    csrfFailures?: number;
    invalidTokens?: number;
    blockedRequests?: number;
  };
  
  // Errors
  errors: {
    javascriptErrors: Array<{ message: string; stack?: string; timestamp: any; route?: string }>;
    apiErrors: Array<{ endpoint: string; status: number; message: string; timestamp: any }>;
    httpErrors: Array<{ url: string; status: number; message: string; timestamp: any }>;
    resourceFailures: Array<{ resource: string; type: string; timestamp: any }>;
  };
  
  // PWA
  pwa?: {
    installState?: 'installed' | 'not-installed' | 'unknown';
    standalone?: boolean;
    displayMode?: string;
    serviceWorkerStatus?: string;
  };
  
  // Storage
  storage?: {
    usage?: number;
    quota?: number;
    localStorageUsed?: number;
    sessionStorageUsed?: number;
  };
  
  // Experimentation
  experimentation?: {
    abTestVariant?: string;
    featureFlags?: string[];
    experimentId?: string;
  };
  
  // Engagement
  engagement: {
    engagementScore?: number;
    interactionCount: number;
    returnVisits: number;
    scrollCompletionRate?: number;
    clickThroughRate?: number;
    conversionRate?: number;
    retentionRate?: number;
    featureAdoption?: Record<string, number>;
  };
  
  // Lifecycle
  lifecycle: {
    pageLoaded: any;
    pageUnloaded?: any;
    tabHiddenCount: number;
    tabVisibleCount: number;
    pageFrozen?: boolean;
    sessionResumed?: boolean;
  };
  
  // Client Hints
  clientHints?: {
    platform?: string;
    architecture?: string;
    model?: string;
    formFactor?: string;
  };
}

export const defaultAdvancedAnalytics: Partial<AdvancedAnalyticsData> = {
  device: {
    type: 'unknown',
    os: 'Unknown',
    osVersion: 'Unknown',
    browser: 'Unknown',
    browserVersion: 'Unknown',
    screenResolution: 'Unknown',
    viewport: 'Unknown',
    pixelRatio: 1,
    orientation: 'landscape',
    touchSupport: false,
  },
  network: {
    onlineStatus: true,
  },
  location: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  browser: {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    languages: typeof navigator !== 'undefined' ? navigator.languages : ['en-US'],
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    capabilities: {},
  },
  uiPreferences: {
    colorScheme: 'unknown',
  },
  activity: {
    pageViews: 1,
    clicks: 0,
    scrollDepth: 0,
    scrollEvents: 0,
    searchQueries: [],
    downloads: 0,
    downloadsList: [],
    formsStarted: 0,
    formsSubmitted: 0,
    formsAbandoned: 0,
    formFieldsInteracted: 0,
    timeOnPage: 0,
    activeTime: 0,
    inactiveTime: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    touchEvents: 0,
  },
  navigation: {
    entryPage: typeof window !== 'undefined' ? window.location.pathname : '/',
    url: typeof window !== 'undefined' ? window.location.href : '',
    urlPath: typeof window !== 'undefined' ? window.location.pathname : '/',
    routeTransitions: [],
  },
  session: {
    sessionId: '',
    startTime: null,
    entryPage: typeof window !== 'undefined' ? window.location.pathname : '/',
    pagesVisited: [typeof window !== 'undefined' ? window.location.pathname : '/'],
    pageSequence: [typeof window !== 'undefined' ? window.location.pathname : '/'],
    sessionCount: 1,
    isNewVisitor: true,
    isReturningVisitor: false,
    tabVisibility: 'visible',
    tabSwitches: 0,
    lastActivity: new Date(),
  },
  performance: {},
  security: {},
  errors: {
    javascriptErrors: [],
    apiErrors: [],
    httpErrors: [],
    resourceFailures: [],
  },
  engagement: {
    interactionCount: 0,
    returnVisits: 0,
    featureAdoption: {},
  },
  lifecycle: {
    pageLoaded: new Date(),
    tabHiddenCount: 0,
    tabVisibleCount: 1,
  },
};
