export type PortfolioImageLayout = "single" | "split_horizontal_2" | "grid_4";
export type PortfolioImageFit = "cover" | "contain" | "portrait_tall";

export interface PortfolioItem {
  id: string;
  title: string;
  subtitle: string; // Category (Events, Wins & Achivements, Office, Training Programs, Travel)
  description?: string;
  tags?: string[];
  projectUrl?: string; // Live Project URL
  githubUrl?: string; // GitHub Repository URL
  linkedinUrl?: string; // LinkedIn Post/Profile URL
  facebookUrl?: string; // Facebook Post/Page URL
  instagramUrl?: string; // Instagram Post/Profile URL
  images: string[]; // List of Cloudinary image URLs (1, 2, or 4 images)
  imageLayout?: PortfolioImageLayout;
  imageFit?: PortfolioImageFit; // Cover (Fill), Contain (Full Uncropped), Portrait Tall (Tall 3:4)
  displayOrder: number;
  featured?: boolean;
  altText?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: any;
  updatedAt?: any;
}

export const PORTFOLIO_CATEGORIES = [
  "All Photos",
  "Events",
  "Wins & Achivements",
  "Office",
  "Training Programs",
  "Travel",
];

export const defaultPortfolioItems: PortfolioItem[] = [
  {
    id: "cozycasa",
    title: "Cozycasa Smart IoT",
    subtitle: "Office",
    description: "An integrated smart IoT management application built with Flutter, Firebase, and real-time MQTT protocol.",
    tags: ["Flutter", "Firebase", "IoT"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    images: [
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "single",
    imageFit: "cover",
    displayOrder: 1,
    featured: true,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-25",
  },
  {
    id: "hackathon-award",
    title: "National Tech Wins & Innovation",
    subtitle: "Wins & Achivements",
    description: "Awarded 1st place in National Software Innovation Summit for developing high-impact intelligent cloud platforms.",
    tags: ["Hackathon", "Innovation", "Award"],
    projectUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    facebookUrl: "https://facebook.com/malithatishamal",
    images: [
      "/images/portfolio/mars.png",
    ],
    imageLayout: "single",
    imageFit: "cover",
    displayOrder: 2,
    featured: false,
    createdAt: "2026-08-05",
    updatedAt: "2026-08-25",
  },
  {
    id: "leadership-workshop",
    title: "DevOps Bootcamps",
    subtitle: "Training Programs",
    description: "Conducted technical training workshops for 200+ engineering students on Kubernetes orchestration and CI/CD pipelines.",
    tags: ["DevOps", "Kubernetes", "Training"],
    projectUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    instagramUrl: "https://instagram.com/malitha_tishamal",
    images: [
      "/images/portfolio/humans.png",
    ],
    imageLayout: "single",
    imageFit: "cover",
    displayOrder: 3,
    featured: true,
    createdAt: "2026-08-10",
    updatedAt: "2026-08-25",
  },
  {
    id: "tech-expedition",
    title: "Global Tech Summit",
    subtitle: "Events",
    description: "Keynote presentation and technical exploration at the Asia-Pacific Tech & Cybersecurity Conference.",
    tags: ["Events", "Conference", "Cybersecurity"],
    projectUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    facebookUrl: "https://facebook.com/malithatishamal",
    instagramUrl: "https://instagram.com/malitha_tishamal",
    images: [
      "/images/portfolio/roket-squred.png",
    ],
    imageLayout: "single",
    imageFit: "cover",
    displayOrder: 4,
    featured: false,
    createdAt: "2026-08-15",
    updatedAt: "2026-08-25",
  },
  {
    id: "panda-logo",
    title: "Panda Brand Architecture",
    subtitle: "Office",
    description: "Minimalist brand identity and visual language system with dual-tone vector geometry and design guidelines.",
    tags: ["Branding", "UI/UX", "Illustrator"],
    projectUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/panda-logo.png",
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "split_horizontal_2",
    imageFit: "cover",
    displayOrder: 5,
    featured: false,
    createdAt: "2026-08-18",
    updatedAt: "2026-08-25",
  },
  {
    id: "fusion-dynamics",
    title: "Fusion Dynamics Multi-Perspective",
    subtitle: "Wins & Achivements",
    description: "High-performance real-time data visualizer with 4 synchronized operational perspectives and analytical graphs.",
    tags: ["Analytics", "React", "TypeScript"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    images: [
      "/images/portfolio/humans.png",
      "/images/portfolio/mars.png",
      "/images/portfolio/roket-squred.png",
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "grid_4",
    imageFit: "cover",
    displayOrder: 6,
    featured: false,
    createdAt: "2026-08-20",
    updatedAt: "2026-08-25",
  },
];
