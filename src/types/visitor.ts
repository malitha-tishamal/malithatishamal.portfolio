export interface Visitor {
  id: string;
  ip: string;
  location: {
    country: string;
    city: string;
    countryCode: string;
    region?: string;
  };
  visitDate: {
    date: string; // YYYY-MM-DD format
    timestamp: number; // Unix timestamp
  };
  userAgent?: string;
  referrer?: string;
  page?: string;
}

export interface VisitorData {
  ip: string;
  location: {
    country: string;
    city: string;
    countryCode: string;
    region?: string;
  };
  visitDate: {
    date: string;
    timestamp: number;
  };
  userAgent?: string;
  referrer?: string;
  page?: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalVisitors: number;
  uniqueVisitors: number;
  locations: Record<string, number>; // country: count
}

export interface VisitorAnalytics {
  totalVisitors: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  weeklyVisitors: number;
  monthlyVisitors: number;
  dailyStats: DailyStats[];
  topLocations: Array<{ country: string; count: number; countryCode: string }>;
}