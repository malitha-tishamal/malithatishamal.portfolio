export type PortfolioImageLayout = "single" | "split_horizontal_2" | "grid_4";

export interface PortfolioItem {
  id: string;
  title: string;
  subtitle: string; // Designation / Category
  description?: string;
  tags?: string[];
  projectUrl?: string;
  githubUrl?: string;
  images: string[]; // List of Cloudinary image URLs (1, 2, or 4 images)
  imageLayout?: PortfolioImageLayout;
  displayOrder: number;
  featured?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export const defaultPortfolioItems: PortfolioItem[] = [
  {
    id: "cozycasa",
    title: "Cozycasa",
    subtitle: "Designation",
    description: "An integrated smart home IoT management application built with Flutter, Firebase, and MQTT communication protocol.",
    tags: ["Flutter", "Firebase", "IoT"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "single",
    displayOrder: 1,
    featured: true,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-24",
  },
  {
    id: "mars",
    title: "Mars",
    subtitle: "Designation",
    description: "3D architectural web portal showcasing futuristic structures and interactive spatial components.",
    tags: ["Next.js", "Three.js", "TailwindCSS"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/mars.png",
    ],
    imageLayout: "single",
    displayOrder: 2,
    featured: false,
    createdAt: "2026-08-05",
    updatedAt: "2026-08-24",
  },
  {
    id: "everyday-humans",
    title: "Everyday Humans",
    subtitle: "Designation",
    description: "Social wellness platform connecting health practitioners with community members for tailored fitness programs.",
    tags: ["React", "Node.js", "MongoDB"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/humans.png",
    ],
    imageLayout: "single",
    displayOrder: 3,
    featured: true,
    createdAt: "2026-08-10",
    updatedAt: "2026-08-24",
  },
  {
    id: "rocket-squared",
    title: "Rocket Squared",
    subtitle: "Designation",
    description: "Automated CI/CD deployment orchestrator with Kubernetes cluster management and Prometheus real-time monitoring.",
    tags: ["DevOps", "Docker", "Kubernetes"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/roket-squred.png",
    ],
    imageLayout: "single",
    displayOrder: 4,
    featured: false,
    createdAt: "2026-08-15",
    updatedAt: "2026-08-24",
  },
  {
    id: "panda-logo",
    title: "Panda Logo",
    subtitle: "Designation",
    description: "Minimalist brand identity and visual language system with dual-tone vector geometry.",
    tags: ["Branding", "UI/UX", "Illustrator"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/panda-logo.png",
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "split_horizontal_2",
    displayOrder: 5,
    featured: false,
    createdAt: "2026-08-18",
    updatedAt: "2026-08-24",
  },
  {
    id: "fusion-dynamics",
    title: "Fusion Dynamics",
    subtitle: "Designation",
    description: "High-performance data visualizer and dashboard with 4 synchronized operational perspectives.",
    tags: ["Analytics", "React", "TypeScript"],
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    images: [
      "/images/portfolio/humans.png",
      "/images/portfolio/mars.png",
      "/images/portfolio/roket-squred.png",
      "/images/portfolio/cozycasa.png",
    ],
    imageLayout: "grid_4",
    displayOrder: 6,
    featured: false,
    createdAt: "2026-08-20",
    updatedAt: "2026-08-24",
  },
];
