export type CertificateImageLayout = "side-by-side" | "stacked" | "single" | "tabs";

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issuerLogo?: string;
  logoShape?: "rounded" | "circle" | "square";
  logoBgColor?: string; // e.g. "transparent", "#ffffff", "#0b1120", "#049fd9", etc.
  issueDate: string; // e.g. "Mar 2026"
  expirationDate?: string; // e.g. "No Expiration" or "Mar 2029"
  credentialId?: string; // e.g. "e4e1215f-35c6-4416-8d4c-83407362d262"
  credentialUrl?: string; // e.g. "https://www.credly.com/..."
  certificateImage?: string; // Primary image URL (legacy / first image)
  certificateImages?: string[]; // Multiple certificate images
  certificateImageLayout?: CertificateImageLayout; // "side-by-side" (image 1) | "stacked" (image 2) | "single" | "tabs"
  certificatePdfUrl?: string; // Optional direct PDF URL
  pdfPagesCount?: number; // Total pages in PDF if applicable
  clickCount?: number;
  hoverCount?: number;
  skills: string[]; // e.g. ["Threat Detection", "Privacy And Data Confidentiality"]
  category: string; // e.g. "Cybersecurity", "Networking", "IoT"
  description?: string;
  displayOrder?: number;
  featured?: boolean;
  published?: boolean;
}

export interface CertificationSettings {
  autoplay: boolean;
  autoplaySpeed: number; // ms
  transitionSpeed: number; // ms
  pauseOnHover: boolean;
}

export interface CertificationAnalytics {
  sectionViewCount?: number;
}

/** Generates a Cloudinary page JPG URL from a PDF URL if Cloudinary, or fallback JPG */
export function getPdfPageImageUrl(pdfUrl: string, pageNumber: number = 1): string {
  if (!pdfUrl) return "";
  if (!pdfUrl.toLowerCase().includes(".pdf")) return pdfUrl;
  if (pdfUrl.includes("res.cloudinary.com") && pdfUrl.includes("/upload/")) {
    const transformed = pdfUrl.replace("/upload/", `/upload/pg_${pageNumber}/`);
    return transformed.replace(/\.pdf$/i, ".jpg");
  }
  return pdfUrl.replace(/\.pdf$/i, ".jpg");
}

/** Returns certificate image URLs, supporting legacy single-image field. */
export function getCertificateImages(item: CertificationItem): string[] {
  if (item.certificateImages && item.certificateImages.length > 0) {
    return item.certificateImages.filter(Boolean);
  }
  if (item.certificateImage) {
    return [item.certificateImage];
  }
  return [];
}

export const defaultCertificationSettings: CertificationSettings = {
  autoplay: true,
  autoplaySpeed: 4500,
  transitionSpeed: 600,
  pauseOnHover: true,
};

export const CERTIFICATION_CATEGORIES = [
  "All",
  "Cybersecurity",
  "Networking",
  "IoT & Embedded",
  "Cloud & DevOps",
  "Software Engineering",
] as const;

export const defaultCertifications: CertificationItem[] = [
  {
    id: "cert-1",
    title: "Introduction to Cybersecurity",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
    issueDate: "Mar 2026",
    expirationDate: "No Expiration",
    credentialId: "CSCO-CYBER-2026-01",
    credentialUrl: "https://www.credly.com/org/cisco",
    certificateImage: "/images/portfolio/portfolio_1.jpg",
    skills: [
      "Threat Detection",
      "Privacy And Data Confidentiality",
      "Network Vulnerability",
      "Cybersecurity",
      "Security Best Practices",
    ],
    category: "Cybersecurity",
    description: "Demonstrated fundamental understanding of cybersecurity concepts, defense techniques, threat landscape mitigation, and institutional data privacy protocols.",
    displayOrder: 1,
    featured: true,
    published: true,
  },
  {
    id: "cert-2",
    title: "Exploring Internet of Things with Cisco Packet Tracer",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
    issueDate: "Apr 2026",
    expirationDate: "No Expiration",
    credentialId: "e4e1215f-35c6-4416-8d4c-83407362d262",
    credentialUrl: "https://www.credly.com/org/cisco",
    certificateImage: "/images/portfolio/portfolio_2.jpg",
    skills: [
      "Packet Tracer",
      "Internet of Things (IoT)",
      "Cisco Networking",
      "Smart Devices Simulation",
      "Sensors & Actuators",
    ],
    category: "IoT & Embedded",
    description: "Designed, interconnected, and configured smart IoT device ecosystems and automation scripts utilizing Cisco Packet Tracer simulation environments.",
    displayOrder: 2,
    featured: true,
    published: true,
  },
  {
    id: "cert-3",
    title: "Exploring Networking with Cisco Packet Tracer",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
    issueDate: "Mar 2026",
    expirationDate: "No Expiration",
    credentialId: "08edcf6a-3a20-48f0-b538-8d7315d737e5",
    credentialUrl: "https://www.credly.com/org/cisco",
    certificateImage: "/images/portfolio/portfolio_3.jpg",
    skills: [
      "Packet Tracer",
      "Exploring Networking",
      "Cisco Networking",
      "IPv4/IPv6 Subnetting",
      "Switching & Routing",
    ],
    category: "Networking",
    description: "Modeled enterprise local area networks (LANs), configured Cisco IOS switch and router protocols, and analyzed traffic packet flows.",
    displayOrder: 3,
    featured: true,
    published: true,
  },
  {
    id: "cert-4",
    title: "Getting Started with Cisco Packet Tracer",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
    issueDate: "Mar 2026",
    expirationDate: "No Expiration",
    credentialId: "1278b4f9-3a1b-43e6-bfe3-f47281259bb6",
    credentialUrl: "https://www.credly.com/org/cisco",
    certificateImage: "/images/portfolio/portfolio_4.jpg",
    skills: [
      "Cisco Networking",
      "Packet Tracer",
      "Getting Started with Cisco Packet Tracer",
      "Network Topologies",
    ],
    category: "Networking",
    description: "Fundamental mastery in navigating the Cisco Packet Tracer GUI, building physical and logical network models, and simulating endpoint communications.",
    displayOrder: 4,
    featured: true,
    published: true,
  },
];