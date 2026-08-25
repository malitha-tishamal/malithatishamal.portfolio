export type ProjectImageFit = "cover" | "contain" | "portrait_tall";

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string; // Category (e.g. Mobile App, Full Stack Web, DevOps & Cloud, AI & Machine Learning, IoT Systems, Cybersecurity)
  summary?: string; // Short summary displayed on card
  description?: string; // Full detailed paragraph / architecture description
  tags: string[]; // Tech stack tags (Flutter, React, Node.js, Kubernetes, etc.)
  coverImage: string; // Main card cover image
  images: string[]; // Gallery of up to 15+ screenshots/images
  imageFit?: ProjectImageFit; // cover | contain | portrait_tall
  projectUrl?: string; // Live Project / Demo URL
  githubUrl?: string; // GitHub Repository URL
  linkedinUrl?: string; // LinkedIn URL
  facebookUrl?: string; // Facebook URL
  instagramUrl?: string; // Instagram URL
  youtubeUrl?: string; // YouTube URL
  featured?: boolean;
  displayOrder: number;
  createdAt: any;
  updatedAt?: any;
}

export const PROJECT_CATEGORIES = [
  "All Projects",
  "Mobile App",
  "Full Stack Web",
  "DevOps & Cloud",
  "AI & Machine Learning",
  "IoT Systems",
  "Cybersecurity",
];

export const defaultProjects: ProjectItem[] = [
  {
    id: "project_mediq",
    title: "MediQ – Antibiotic & Clinical Prescription Management",
    subtitle: "Mobile App",
    summary: "Cross-platform clinical antimicrobial stewardship and dose calculation system.",
    description:
      "MediQ is a specialized medical prescription and antibiotic dosing assistant built for healthcare professionals and clinical pharmacologists. It incorporates real-time creatinine clearance calculation, renal dose adjustments, pediatric weight-based dosing algorithms, and hospital pathogen antibiogram surveillance to curb antimicrobial resistance (AMR).\n\nBuilt with Flutter and Firebase cloud infrastructure, it supports instant offline caching, encrypted patient records, and multi-hospital guideline synchronization.",
    tags: ["Flutter", "Dart", "Firebase", "HealthTech", "State Management"],
    coverImage: "/images/portfolio/cozycasa.png",
    images: [
      "/images/portfolio/cozycasa.png",
      "/images/portfolio/mars.png",
      "/images/portfolio/humans.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal/MediQ-Antibiotic-Management-App",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    displayOrder: 1,
    featured: true,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-25",
  },
  {
    id: "project_cloud_devops",
    title: "Enterprise Multi-Cluster Kubernetes CI/CD Pipeline",
    subtitle: "DevOps & Cloud",
    summary: "Zero-downtime microservices deployment engine with ArgoCD & Terraform.",
    description:
      "Engineered automated GitOps deployment pipelines across AWS EKS and hybrid-cloud Kubernetes clusters using Terraform, Docker, ArgoCD, and GitHub Actions. Integrated Prometheus and Grafana for real-time latency monitoring, dynamic horizontal pod autoscaling (HPA), and automated canary deployments.",
    tags: ["Kubernetes", "AWS EKS", "Terraform", "Docker", "ArgoCD", "Prometheus"],
    coverImage: "/images/portfolio/mars.png",
    images: [
      "/images/portfolio/mars.png",
      "/images/portfolio/roket-squred.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    displayOrder: 2,
    featured: true,
    createdAt: "2026-08-05",
    updatedAt: "2026-08-25",
  },
  {
    id: "project_iot_smart",
    title: "Cozycasa Intelligent IoT Automation & Energy Hub",
    subtitle: "IoT Systems",
    summary: "Real-time MQTT telemetry dashboard and intelligent environmental controller.",
    description:
      "A distributed Internet of Things (IoT) ecosystem combining ESP32 microcontrollers, MQTT brokers, and a responsive web/mobile dashboard. Features power consumption analytics, automated climate control loops, and low-latency websocket bi-directional telemetry.",
    tags: ["IoT", "MQTT", "ESP32", "Flutter", "Node.js", "WebSockets"],
    coverImage: "/images/portfolio/humans.png",
    images: [
      "/images/portfolio/humans.png",
      "/images/portfolio/cozycasa.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    displayOrder: 3,
    featured: true,
    createdAt: "2026-08-10",
    updatedAt: "2026-08-25",
  },
  {
    id: "project_ai_analytics",
    title: "AI Cyber Threat Intelligence & Anomaly Detection",
    subtitle: "AI & Machine Learning",
    summary: "Real-time network anomaly detector powered by LSTM and XGBoost models.",
    description:
      "Developed an AI-driven security information and event management (SIEM) classifier capable of inspecting gigabits of streaming network logs per minute. Detects zero-day exploits, port scanning attacks, and data exfiltration patterns with 99.2% recall.",
    tags: ["Python", "PyTorch", "XGBoost", "FastAPI", "Cybersecurity", "Docker"],
    coverImage: "/images/portfolio/roket-squred.png",
    images: [
      "/images/portfolio/roket-squred.png",
      "/images/portfolio/mars.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    displayOrder: 4,
    featured: true,
    createdAt: "2026-08-15",
    updatedAt: "2026-08-25",
  },
  {
    id: "project_dimu_travel",
    title: "Dimu Tour & Travel Global Booking Platform",
    subtitle: "Full Stack Web",
    summary: "High-conversion luxury tour reservations portal with real-time currency conversion.",
    description:
      "A bespoke travel bookings and itinerary management web application built for Dimu Tour & Travel. Incorporates customized package builders, interactive maps, multi-currency payment gateway integrations, and an administrative booking dispatch system.",
    tags: ["Next.js", "TypeScript", "TailwindCSS", "Node.js", "MongoDB", "Stripe"],
    coverImage: "/images/portfolio/panda-logo.png",
    images: [
      "/images/portfolio/panda-logo.png",
      "/images/portfolio/humans.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    facebookUrl: "https://facebook.com/malithatishamal",
    displayOrder: 5,
    featured: true,
    createdAt: "2026-08-18",
    updatedAt: "2026-08-25",
  },
  {
    id: "project_auth_guard",
    title: "NextGuard Identity & Role-Based Access Framework",
    subtitle: "Cybersecurity",
    summary: "Zero-trust session manager with OAuth2, MFA tokens, and biometric biometric guards.",
    description:
      "A hardened authentication microservice featuring multi-factor authentication (TOTP/WebAuthn), strict cryptographic session revocation, and fine-grained role-based access control (RBAC) designed for high-compliance enterprise platforms.",
    tags: ["Security", "OAuth2", "JWT", "Redis", "TypeScript", "Next.js"],
    coverImage: "/images/portfolio/cozycasa.png",
    images: [
      "/images/portfolio/cozycasa.png",
      "/images/portfolio/mars.png",
    ],
    imageFit: "cover",
    projectUrl: "https://github.com/malitha-tishamal",
    githubUrl: "https://github.com/malitha-tishamal",
    linkedinUrl: "https://linkedin.com/in/malitha-tishamal",
    displayOrder: 6,
    featured: true,
    createdAt: "2026-08-20",
    updatedAt: "2026-08-25",
  },
];
