import { Visitor } from '@/types/visitor';

// Get client IP address using a free API
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
};

// Get location information from IP using a free API
export const getLocationFromIP = async (ip: string): Promise<Visitor['location']> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      countryCode: data.country_code || 'XX',
      region: data.region || undefined,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      country: 'Unknown',
      city: 'Unknown',
      countryCode: 'XX',
    };
  }
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get yesterday's date in YYYY-MM-DD format
export const getYesterdayDate = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Check if visitor has already been tracked today
export const hasVisitedToday = (): boolean => {
  const lastVisit = localStorage.getItem('lastVisitDate');
  const today = getTodayDate();
  return lastVisit === today;
};

// Mark visitor as visited today
export const markVisitedToday = (): void => {
  localStorage.setItem('lastVisitDate', getTodayDate());
};

// Get user agent information
export const getUserAgent = (): string => {
  if (typeof window !== 'undefined') {
    return navigator.userAgent;
  }
  return 'unknown';
};

// Get referrer information
export const getReferrer = (): string => {
  if (typeof window !== 'undefined') {
    return document.referrer || 'direct';
  }
  return 'unknown';
};

// Get current page path
export const getCurrentPage = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};