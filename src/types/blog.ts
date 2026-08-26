export interface RelatedLink {
  title: string;
  url: string;
  type?: "github" | "live" | "docs" | "external" | "social";
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  coverImage: string;
  content: string; // Markdown or rich text paragraphs
  additionalImages?: string[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string; // YYYY-MM-DD or formatted string
  readingTime?: string; // e.g. "5 min read"
  tags: string[];
  relatedLinks?: RelatedLink[];
  featured?: boolean;
  published: boolean;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
}

export const BLOG_CATEGORIES = [
  "All",
  "Technology & AI",
  "Web Development",
  "Cloud & DevOps",
  "Cybersecurity",
  "Software Architecture",
  "Tutorials & Guides",
] as const;

export const defaultBlogPosts: BlogPost[] = [
  {
    id: "blog-1",
    slug: "building-scalable-healthcare-systems-mediq",
    title: "Building Scalable Healthcare Systems: Behind the Scenes of MediQ",
    subtitle: "How modern architecture patterns enable high-throughput antibiotic management in critical care hospital environments.",
    excerpt: "Exploring the distributed system architecture, real-time synchronization, and stringent data security protocols used in MediQ antibiotic tracking.",
    category: "Software Architecture",
    coverImage: "/images/blog/blog_1.png",
    content: `## The Critical Need for Real-Time Antibiotic Stewardship

In modern hospital intensive care units and clinical environments, timely and precise antimicrobial management directly impacts patient survival rates and helps combat multi-drug resistant pathogens.

When developing **MediQ**, our core architectural goal was to eliminate clinical latency while providing verifiable audit trails for every prescribed medication dosage.

---

### Architectural Highlights

1. **Microservices on Kubernetes**: Decoupling prescription issuance, pharmacy dispensary notifications, and automated interaction warnings into resilient, independently scalable services.
2. **Event-Driven Messaging**: Employing high-throughput message brokers to propagate critical allergy and interaction alerts within sub-50 milliseconds.
3. **Role-Based Access & HIPAA Compliance**: Strict end-to-end encryption for patient telemetry, biometric nurse verification, and immutable audit logs.

> "A well-architected healthcare application does not merely record clinical records—it actively safeguards patient lives through intelligent, low-latency validation."

---

### Key Takeaways for Engineers

- Always prioritize graceful degradation in offline hospital subnet scenarios.
- Enforce strict optimistic locking to prevent concurrent prescription edits.
- Implement comprehensive telemetry and distributed tracing across all microservice boundaries.`,
    additionalImages: [
      "/images/portfolio/portfolio_1.jpg",
      "/images/portfolio/portfolio_2.jpg"
    ],
    author: {
      name: "Malitha Tishamal",
      role: "Lead Full Stack & Cloud Architect",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-01-15",
    readingTime: "5 min read",
    tags: ["Healthcare", "Kubernetes", "Architecture", "Cloud", "NextJS"],
    relatedLinks: [
      { title: "MediQ Live Application", url: "https://github.com/malitha-tishamal", type: "live" },
      { title: "Architecture Whitepaper & GitHub", url: "https://github.com/malitha-tishamal", type: "github" }
    ],
    featured: true,
    published: true,
    order: 1,
  },
  {
    id: "blog-2",
    slug: "mastering-nextjs-app-router-cloud-firestore",
    title: "Mastering Next.js App Router with Real-Time Cloud Firestore",
    subtitle: "A deep dive into server actions, client cache synchronization, and robust security rules for production web applications.",
    excerpt: "Learn how to build blazing-fast full-stack web applications by combining Next.js App Router, Tailwind CSS, and Google Firebase Firestore.",
    category: "Web Development",
    coverImage: "/images/blog/blog_2.png",
    content: `## The Modern Full-Stack Frontier

The transition from traditional server-rendered applications to hybrid React Server Components (RSC) and Cloud Native backends has revolutionized how we build digital products.

In this deep dive, we explore practical patterns for pairing Next.js App Router with Google Firestore to achieve sub-second page loads and instantaneous UI updates.

---

### Core Principles for Scalable State

- **Server-Side Data Pre-fetching**: Hydrating initial static metadata and critical assets on edge runtime servers.
- **Client-Side Real-time Listeners**: Utilizing lightweight snapshot listeners only on views requiring collaborative live updates.
- **Granular Security Rules**: Writing unit-tested Firestore security rules to enforce tenant isolation and role permissions at the database layer.

\`\`\`typescript
// Example Firestore real-time listener hook pattern
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, "projects", projectId), (docSnap) => {
    if (docSnap.exists()) {
      setProjectData(docSnap.data());
    }
  });
  return () => unsubscribe();
}, [projectId]);
\`\`\`

---

### Performance Benchmarks

By eliminating bulky server side sessions and leveraging Cloudflare Edge caching with Cloudinary asset transforms, initial load speeds consistently clock under **300ms** globally.`,
    additionalImages: [
      "/images/portfolio/portfolio_3.jpg"
    ],
    author: {
      name: "Malitha Tishamal",
      role: "Full Stack Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-02-02",
    readingTime: "4 min read",
    tags: ["NextJS", "React", "Firebase", "TypeScript", "TailwindCSS"],
    relatedLinks: [
      { title: "Source Code Repository", url: "https://github.com/malitha-tishamal", type: "github" },
      { title: "Live Portfolio Demo", url: "https://malithatishamal.com", type: "live" }
    ],
    featured: true,
    published: true,
    order: 2,
  },
  {
    id: "blog-3",
    slug: "zero-trust-cloud-security-cicd-pipelines",
    title: "Zero-Trust Cloud Security: Hardening Modern CI/CD Pipelines",
    subtitle: "Practical strategies to defend automated build pipelines against supply chain vulnerabilities and unauthorized credential exposure.",
    excerpt: "Securing automated DevOps workflows using ephemeral secrets, container signing, and automated static vulnerability scanning.",
    category: "Cloud & DevOps",
    coverImage: "/images/blog/blog_3.png",
    content: `## The Shift-Left Security Paradigm

Modern continuous delivery pipelines are the backbone of rapid engineering teams—yet they frequently become prime targets for automated supply chain injection attacks.

Implementing a **Zero-Trust CI/CD pipeline** ensures that every artifact, container image, and configuration is authenticated before reaching production staging clusters.

---

### Four Pillars of Automated Pipeline Defense

1. **OIDC Ephemeral Authentication**: Eliminating long-lived API keys by adopting OpenID Connect tokens between GitHub Actions and Cloud Providers.
2. **Cosign & Image Signing**: Cryptographically verifying container digest signatures prior to Kubernetes pod scheduling.
3. **Automated Static Analysis (SAST)**: Blocking pull requests containing known CVEs in transitive dependencies.
4. **Least-Privilege RBAC**: Segmenting deployment credentials by environment tier with mandatory multi-party approvals for production releases.

---

### Conclusion

Automating security checks inside developer pull requests empowers engineers to move rapidly without compromising infrastructure resilience.`,
    additionalImages: [
      "/images/portfolio/portfolio_4.jpg"
    ],
    author: {
      name: "Malitha Tishamal",
      role: "DevOps & Cloud Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-02-18",
    readingTime: "6 min read",
    tags: ["DevOps", "Cybersecurity", "Docker", "Kubernetes", "CI/CD"],
    relatedLinks: [
      { title: "DevOps Pipeline Templates", url: "https://github.com/malitha-tishamal", type: "github" }
    ],
    featured: true,
    published: true,
    order: 3,
  }
];