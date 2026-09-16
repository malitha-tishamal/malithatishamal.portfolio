export interface ServiceItem {
  id: string;
  title: string;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  icon: string; // Emoji (e.g. "🚀") or Iconify name or image URL
  iconType?: "emoji" | "iconify" | "image";
  category: "Software Engineering" | "DevOps & Cloud" | "Cybersecurity" | "Networking" | "Mobile & Apps" | "Database & Performance";
  deliverables: string[];
  technologies: string[];
  colorAccent: string; // Hex color e.g. #0a66c2
  displayOrder?: number;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface ServicesSectionContent {
  badgeText: string;
  heading: string;
  subheading: string;
  updatedAt?: any;
}

export const defaultServicesContent: ServicesSectionContent = {
  badgeText: "Core Engineering Capabilities",
  heading: "High-Impact Services Engineered for Scale & Reliability",
  subheading: "From robust full-stack software development to automated DevOps pipelines and cybersecurity hardening, delivering production-grade digital solutions.",
};

export const defaultServices: ServiceItem[] = [
  {
    id: "service-1",
    title: "Full-Stack Software Engineering",
    tagline: "High-Performance Web & Enterprise Apps",
    shortDescription: "Architecting end-to-end web applications, microservices, and robust REST/GraphQL APIs with modern frameworks and clean architecture.",
    fullDescription: "Delivering modern, scalable, and resilient software solutions tailored to complex business workflows. From responsive React/Next.js frontends to robust Node.js, Spring Boot, or Python backend services, every line of code is structured with enterprise standards, maintainability, and clean architecture.",
    icon: "🚀",
    iconType: "emoji",
    category: "Software Engineering",
    deliverables: [
      "Custom Web Applications & Portals",
      "RESTful & GraphQL API Architecture",
      "Microservices & Serverless Functions",
      "Authentication & Multi-tenant Systems",
      "Automated Unit & Integration Testing",
      "Code Review & Refactoring for Scalability"
    ],
    technologies: ["Next.js", "React", "TypeScript", "Node.js", "Java / Spring", "Tailwind CSS", "REST APIs"],
    colorAccent: "#0a66c2",
    displayOrder: 1,
    published: true,
  },
  {
    id: "service-2",
    title: "DevOps & Cloud Infrastructure",
    tagline: "Automated CI/CD & Container Orchestration",
    shortDescription: "Building automated delivery pipelines, containerized environments, and cloud infrastructure for zero-downtime continuous deployment.",
    fullDescription: "Bridging software development and operations through automated infrastructure as code, continuous integration, and scalable cloud deployments. Containerizing services with Docker, orchestrating with Kubernetes, and configuring self-healing, automated cloud infrastructure on AWS, Firebase, or VPS platforms.",
    icon: "☁️",
    iconType: "emoji",
    category: "DevOps & Cloud",
    deliverables: [
      "Automated CI/CD Pipeline Setup (GitHub Actions / GitLab)",
      "Docker Containerization & Multi-stage Builds",
      "Kubernetes Deployment & Ingress Management",
      "Cloud Hosting & Environment Provisioning",
      "Infrastructure Monitoring, Logs & Health Alerts",
      "Automated Backup & Disaster Recovery Solutions"
    ],
    technologies: ["Docker", "Kubernetes", "GitHub Actions", "AWS", "Firebase", "Linux / Bash", "Nginx"],
    colorAccent: "#0284c7",
    displayOrder: 2,
    published: true,
  },
  {
    id: "service-3",
    title: "Cybersecurity & Systems Hardening",
    tagline: "Proactive Defense & Vulnerability Mitigation",
    shortDescription: "Securing applications and server environments against vulnerabilities, implementing RBAC, and enforcing strict data security protocols.",
    fullDescription: "Ensuring your digital assets and user data remain protected from malicious attacks and exploitation. Implementing modern authentication strategies, zero-trust access controls, OWASP Top 10 mitigation, secure coding guidelines, automated security audits, and firewall hardening.",
    icon: "🛡️",
    iconType: "emoji",
    category: "Cybersecurity",
    deliverables: [
      "Security Audits & OWASP Vulnerability Scans",
      "Role-Based Access Control (RBAC) & OAuth2/JWT",
      "Server & Operating System Hardening",
      "API Security & Rate Limiting Enforcement",
      "SSL/TLS & End-to-End Data Encryption",
      "Secure Coding Guidelines & Compliance Audits"
    ],
    technologies: ["OWASP", "OAuth 2.0 / JWT", "Fail2ban", "SSL/TLS", "Pen-testing Tools", "Wireshark", "Linux Security"],
    colorAccent: "#7c3aed",
    displayOrder: 3,
    published: true,
  },
  {
    id: "service-4",
    title: "Network Engineering & Server Architecture",
    tagline: "Reliable Infrastructure & High-Availability Networking",
    shortDescription: "Designing resilient network topologies, Linux server environments, DNS routing, reverse proxies, and VPN integrations.",
    fullDescription: "Deploying and managing production-grade Linux servers and network topologies that guarantee high uptime and rapid data transmission. Expertise in configuring reverse proxies, load balancing, DNS management, VPN tunnels, and network troubleshooting to ensure seamless business connectivity.",
    icon: "🌐",
    iconType: "emoji",
    category: "Networking",
    deliverables: [
      "Linux Server Administration (Ubuntu, Debian, CentOS)",
      "Reverse Proxy & Load Balancing (Nginx, HAProxy)",
      "DNS Management, CDN & Domain Routing",
      "Site-to-Site VPN & Secure Remote Access",
      "Network Traffic Monitoring & Packet Analysis",
      "High-Availability Clustering & Failover"
    ],
    technologies: ["Linux", "Nginx", "Apache / WAMP", "DNS / Cloudflare", "WireGuard / OpenVPN", "TCP/IP", "Cisco CLI"],
    colorAccent: "#059669",
    displayOrder: 4,
    published: true,
  },
  {
    id: "service-5",
    title: "Mobile Application Engineering",
    tagline: "Cross-Platform iOS & Android Apps",
    shortDescription: "Developing performant, native-feel mobile applications with Flutter, featuring real-time offline sync and intuitive user experiences.",
    fullDescription: "Creating cross-platform mobile experiences that run smoothly on both Android and iOS devices from a single clean codebase. Integrating real-time Firebase syncing, push notifications, local SQLite/Hive caching for offline readiness, and fluid native animations.",
    icon: "📱",
    iconType: "emoji",
    category: "Mobile & Apps",
    deliverables: [
      "Cross-Platform Mobile Apps (iOS & Android)",
      "Clean Architecture (BLoC / Provider / Riverpod)",
      "Offline-First Data Storage & Caching",
      "Push Notifications & Cloud Messaging",
      "App Store & Google Play Release Preparation",
      "Third-Party SDK & Payment Gateway Integration"
    ],
    technologies: ["Flutter", "Dart", "Firebase", "REST APIs", "SQLite / Hive", "App Store Connect", "Play Console"],
    colorAccent: "#ea580c",
    displayOrder: 5,
    published: true,
  },
  {
    id: "service-6",
    title: "Database Engineering & Optimization",
    tagline: "Scalable Data Storage & High-Speed Queries",
    shortDescription: "Designing normalized relational schemas and document databases with indexed queries, automated backups, and low latency.",
    fullDescription: "Engineering dependable data storage layers that scale effortlessly with user growth. Crafting efficient relational schemas, NoSQL document hierarchies, tuning slow SQL queries, setting up caching layers with Redis, and guaranteeing data integrity across complex transactions.",
    icon: "⚡",
    iconType: "emoji",
    category: "Database & Performance",
    deliverables: [
      "Relational & NoSQL Schema Architecture",
      "Query Profiling & Index Optimization",
      "Database Migrations & Data Modeling",
      "In-Memory Caching (Redis / Memcached)",
      "Replication, Sharding & Backup Strategies",
      "Firestore Security Rules & Document Optimization"
    ],
    technologies: ["PostgreSQL", "MySQL", "MongoDB", "Firestore", "Redis", "Prisma", "SQL Optimization"],
    colorAccent: "#d97706",
    displayOrder: 6,
    published: true,
  },
];
