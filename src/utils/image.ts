export const PLACEHOLDER_COVER = "/images/portfolio/cozycasa.png";

export const isDefaultPlaceholder = (url?: string): boolean =>
  !url || url.includes("cozycasa.png") || url.trim() === "";

export const getImgPath = (path: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  
  if (!basePath) {
    return path;  
  }
  
  if (path.startsWith(basePath)) {
    return path; 
  }
  
  return `${basePath}${path}`;
};

export const getDataPath = (path: string): string => {
  if (typeof window !== "undefined") {
    const basePath = window.location.pathname.split("/")[1] || "";
    if (basePath && path.startsWith("/")) {
      return `/${basePath}${path}`;
    }
  }
  
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!basePath) {
    return path;
  }
  
  if (path.startsWith(basePath)) {
    return path;
  }
  
  return `${basePath}${path}`;
};

/**
 * Card videos render at ≤640 px CSS width, but Cloudinary serves the original
 * 9–10 MB upload unless a transformation is asked for. Requesting a 640 px,
 * low-quality rendition brings the same clip down to ~1 MB. URLs that already
 * carry a transformation (or are not Cloudinary) pass through untouched.
 */
export const getVideoSrc = (url: string): string => {
  if (!url) return url;
  const path = getImgPath(url);
  const marker = "/video/upload/";
  const index = path.indexOf(marker);
  if (index === -1) return path;
  const rest = path.slice(index + marker.length);
  if (!/^v\d+\//.test(rest)) return path;
  return `${path.slice(0, index + marker.length)}q_auto:low,w_640/${rest}`;
};