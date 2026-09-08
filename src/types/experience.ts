export type ExperienceCategory = "work" | "education" | "volunteer";
export type LogoShape = "rounded" | "circle" | "square";
export type LocationType = "On-site" | "Hybrid" | "Remote";
export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Self-employed"
  | "Freelance"
  | "Contract"
  | "Internship"
  | "Apprenticeship"
  | "Seasonal"
  | "Volunteer"
  | "Higher National Diploma"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Certificate"
  | "Diploma";

export interface ExperienceMedia {
  title: string;
  url: string;
  type?: "image" | "link" | "document";
}

export interface ExperienceItem {
  id: string;
  category: ExperienceCategory;
  title: string; // Job Title or Degree (e.g., "Higher National Diploma, Information Technology")
  organization: string; // Company or School (e.g., "Sri Lanka Institute of Advanced Technological Education (SLIATE)")
  employmentType?: string; // Full-time, Freelance, Diploma, etc.
  fieldOfStudy?: string; // e.g. "Information Technology"
  location?: string; // e.g. "Colombo, Sri Lanka"
  locationType?: LocationType;
  startDate: string; // e.g. "Jul 2024"
  endDate?: string; // e.g. "Jul 2027" or "Present"
  isCurrent?: boolean;
  grade?: string; // e.g. "Merit", "3.8 GPA"
  activities?: string; // Activities & societies
  description?: string;
  skills: string[]; // e.g. ["Flutter", "Firebase", "PHP"]
  logoUrl?: string;
  logoShape?: LogoShape;
  media?: ExperienceMedia[];
  displayOrder?: number;
  published?: boolean;
  updatedAt?: any;
}

export const defaultExperiences: ExperienceItem[] = [
  // ── EDUCATION ─────────────────────────────────────────────────────────────
  {
    id: "edu-1",
    category: "education",
    title: "Higher National Diploma, Information Technology",
    organization: "Sri Lanka Institute of Advanced Technological Education (SLIATE)",
    employmentType: "Higher National Diploma",
    fieldOfStudy: "Information Technology",
    location: "Galle / Colombo, Sri Lanka",
    locationType: "On-site",
    startDate: "Jul 2024",
    endDate: "Jul 2027",
    isCurrent: true,
    grade: "Merit Standing",
    activities: "IT Society, Cybersecurity & Robotics Enthusiasts Club",
    description:
      "Comprehensive higher national diploma specializing in enterprise software development, database architecture, mobile application engineering, computer networking, and cloud computing frameworks.",
    skills: [
      "Flutter",
      "Firebase",
      "Java",
      "Next.js",
      "Full Stack Development",
      "Docker",
      "Database Systems",
    ],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Emblem_of_Sri_Lanka.svg/1200px-Emblem_of_Sri_Lanka.svg.png",
    logoShape: "circle",
    displayOrder: 1,
    published: true,
  },
  {
    id: "edu-2",
    category: "education",
    title: "Certificate, Web Design",
    organization: "Southern IT Education Center - SITEC",
    employmentType: "Certificate",
    fieldOfStudy: "Web Design & Development",
    location: "Southern Province, Sri Lanka",
    locationType: "On-site",
    startDate: "Feb 2023",
    endDate: "Sep 2023",
    isCurrent: false,
    grade: "Distinction",
    activities: "Web Development Workshops, Frontend UI Challenges",
    description:
      "Intensive practical training in responsive web design, standards-compliant HTML5/CSS3, client-server interactions with PHP, MySQL relational databases, and commercial web hosting server deployment.",
    skills: [
      "Web Hosting",
      "PHP",
      "MySQL",
      "JavaScript",
      "HTML5",
      "CSS3",
      "UI/UX Design",
    ],
    logoUrl: "https://api.iconify.design/heroicons:academic-cap.svg",
    logoShape: "circle",
    displayOrder: 2,
    published: true,
  },

  // ── WORK EXPERIENCE ───────────────────────────────────────────────────────
  {
    id: "work-1",
    category: "work",
    title: "Full Stack Developer & DevOps Engineer",
    organization: "Freelance & Independent Client Projects",
    employmentType: "Freelance",
    location: "Remote",
    locationType: "Remote",
    startDate: "Jan 2024",
    endDate: "Present",
    isCurrent: true,
    description:
      "Architecting and shipping production-grade web applications and REST APIs using Next.js 15, React 19, TypeScript, and Tailwind CSS. Implementing automated CI/CD deployment pipelines, containerized Docker microservices, and secure Firebase/Supabase cloud backends.",
    skills: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "Firebase",
      "Docker",
      "Git",
    ],
    logoUrl: "https://api.iconify.design/heroicons:code-bracket-square.svg",
    logoShape: "rounded",
    displayOrder: 1,
    published: true,
  },
  {
    id: "work-2",
    category: "work",
    title: "Mobile App & Frontend Developer",
    organization: "InnovateTech Solutions",
    employmentType: "Contract",
    location: "Colombo, Sri Lanka",
    locationType: "Hybrid",
    startDate: "May 2023",
    endDate: "Dec 2023",
    isCurrent: false,
    description:
      "Engineered cross-platform mobile apps using Flutter and integrated real-time state management and Firestore cloud sync. Optimized client-facing UI flows resulting in a 35% improvement in user retention.",
    skills: [
      "Flutter",
      "Dart",
      "Firebase",
      "REST APIs",
      "State Management",
      "UI/UX",
    ],
    logoUrl: "https://api.iconify.design/heroicons:device-phone-mobile.svg",
    logoShape: "rounded",
    displayOrder: 2,
    published: true,
  },

  // ── VOLUNTEER EXPERIENCE ──────────────────────────────────────────────────
  {
    id: "vol-1",
    category: "volunteer",
    title: "Community Tech Mentor & Open Source Contributor",
    organization: "Sri Lanka Tech Community",
    employmentType: "Volunteer",
    location: "Sri Lanka",
    locationType: "Hybrid",
    startDate: "Jun 2023",
    endDate: "Present",
    isCurrent: true,
    description:
      "Mentoring aspiring software developers in modern JavaScript, Flutter mobile development, and open-source contribution practices. Conducting technical workshops on cybersecurity hygiene and web best practices.",
    skills: [
      "Mentoring",
      "Cybersecurity Awareness",
      "Open Source",
      "Public Speaking",
      "Community Leadership",
    ],
    logoUrl: "https://api.iconify.design/heroicons:heart.svg",
    logoShape: "circle",
    displayOrder: 1,
    published: true,
  },
];
