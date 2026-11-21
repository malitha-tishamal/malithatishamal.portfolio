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
  /** Screen-reader description of the cover; falls back to the title. */
  coverImageAlt?: string;
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
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
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
  "Networking",
  "Tutorials & Guides",
] as const;

export const defaultBlogPosts: BlogPost[] = [
  // ── Original posts ────────────────────────────────────────────────
  {
    id: "blog-1",
    slug: "building-scalable-healthcare-systems-mediq",
    title: "Building Scalable Healthcare Systems: Behind the Scenes of MediQ",
    subtitle: "How modern architecture patterns enable high-throughput antibiotic management in critical care hospital environments.",
    excerpt: "Exploring the distributed system architecture, real-time synchronization, and stringent data security protocols used in MediQ antibiotic tracking.",
    category: "Software Architecture",
    coverImage: "/images/blog/blog_1.png",
    coverImageAlt: "Illustration of a scalable hospital software architecture",
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
      "/images/portfolio/portfolio_2.jpg",
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
      { title: "Architecture Whitepaper & GitHub", url: "https://github.com/malitha-tishamal", type: "github" },
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
    coverImage: "/images/blog/blog_2.jpg",
    coverImageAlt: "Next.js App Router and Firestore real-time data flow",
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
    additionalImages: ["/images/portfolio/portfolio_3.jpg"],
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
      { title: "Live Portfolio Demo", url: "https://malithatishamal.com", type: "live" },
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
    coverImageAlt: "Zero-trust CI/CD pipeline security layers",
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
    additionalImages: ["/images/portfolio/portfolio_4.jpg"],
    author: {
      name: "Malitha Tishamal",
      role: "DevOps & Cloud Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-02-18",
    readingTime: "6 min read",
    tags: ["DevOps", "Cybersecurity", "Docker", "Kubernetes", "CI/CD"],
    relatedLinks: [
      { title: "DevOps Pipeline Templates", url: "https://github.com/malitha-tishamal", type: "github" },
    ],
    featured: true,
    published: true,
    order: 3,
  },

  // ── NEW posts: Networking / DevOps / Software Engineering ─────────
  {
    id: "blog-4",
    slug: "networking-fundamentals-explained",
    title: "Networking Fundamentals Explained: From TCP/IP to Modern Cloud Networks",
    subtitle: "A practical guide covering the core concepts of networking and how they translate to cloud-native environments.",
    excerpt: "Dive into the OSI model, IP addressing, routing, and the transition to software-defined networking in the cloud.",
    category: "Networking",
    coverImage: "/images/blog/blog_4.jpg",
    coverImageAlt: "Diagram of layered network architecture with OSI model layers",
    content: `## Introduction

Networking is the backbone of every digital service. Understanding the fundamentals empowers engineers to design resilient, secure, and scalable systems.

---

### Core Concepts

1. **OSI Model** – The seven-layer reference model that standardizes communication functions from the physical layer to application protocols.
2. **IP Addressing & Subnetting** – How devices locate each other using IPv4/IPv6 addresses and CIDR notation for efficient subnet allocation.
3. **Routing & Switching** – The role of routers (Layer 3) and switches (Layer 2) in directing traffic across networks.
4. **DNS Resolution** – Translating human-readable domain names into IP addresses through recursive and authoritative resolvers.

### Cloud-Native Evolution

Modern applications rely on **software-defined networking (SDN)**, virtual private clouds (VPCs), and programmable load-balancers. This shift abstracts physical hardware, enabling dynamic scaling and security policies as code.

#### Key Cloud Networking Services
- **AWS VPC / Azure VNet / GCP VPC** – Isolated virtual networks for workloads.
- **Load Balancers (ALB, NLB)** – Distribute traffic across healthy instances.
- **Private Link / Service Connect** – Secure private connectivity between services.

---

### Quick Tips

- Use CIDR notation for compact subnet definitions.
- Leverage VPC flow logs for network observability and troubleshooting.
- Adopt zero-trust network access (ZTNA) for internal services.
- Implement network segmentation to limit blast radius of breaches.`,
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "Network & Cloud Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-03-10",
    readingTime: "6 min read",
    tags: ["Networking", "TCP/IP", "Cloud", "SDN", "VPC", "DNS"],
    relatedLinks: [],
    featured: true,
    published: true,
    order: 4,
  },
  {
    id: "blog-5",
    slug: "devops-ci-cd-pipeline-best-practices",
    title: "DevOps CI/CD Pipeline Best Practices for Reliable Deployments",
    subtitle: "How to build, secure, and scale continuous integration and delivery pipelines.",
    excerpt: "Explore pipeline automation, secret management, testing strategies, and rollback mechanisms for modern DevOps.",
    category: "Cloud & DevOps",
    coverImage: "/images/blog/blog_5.jpg",
    coverImageAlt: "CI/CD pipeline workflow diagram showing build, test, and deploy stages",
    content: `## Why CI/CD Matters

Continuous Integration and Continuous Delivery (CI/CD) reduce manual errors, accelerate feedback, and enable rapid iteration. A well-designed pipeline is the cornerstone of DevOps maturity.

---

### Key Practices

- **Infrastructure as Code (IaC)** – Store environment definitions in version control (Terraform, Pulumi, CloudFormation).
- **Ephemeral Secrets** – Use OIDC tokens or secret-management services (Vault, AWS Secrets Manager) instead of long-lived API keys.
- **Automated Testing Pyramid** – Unit → Integration → End-to-End tests executed automatically in the pipeline.
- **Canary Deployments & Blue/Green** – Deploy to a subset of users before full rollout to catch issues early.
- **GitOps** – Use Git as the single source of truth for infrastructure and application state.

#### Sample GitHub Actions Snippet

\`\`\`yaml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Run tests
        run: npm test -- --coverage
      - name: Build
        run: npm run build

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: npx vercel --prod --token \${{ secrets.VERCEL_TOKEN }}
\`\`\`

---

### Monitoring & Rollback

Integrate observability tools (Prometheus, Grafana, Datadog) to detect failures early. Store previous releases for instant rollback when issues are detected in production.`,
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "DevOps & Cloud Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-03-20",
    readingTime: "5 min read",
    tags: ["DevOps", "CI/CD", "GitHub Actions", "Terraform", "Observability"],
    relatedLinks: [],
    featured: true,
    published: true,
    order: 5,
  },
  {
    id: "blog-6",
    slug: "software-engineering-design-patterns-2025",
    title: "Software Engineering Design Patterns Every Engineer Should Know in 2025",
    subtitle: "Classic and modern patterns with TypeScript examples for clean, maintainable code.",
    excerpt: "From Singleton to CQRS, explore patterns that solve real-world architectural challenges in modern applications.",
    category: "Software Architecture",
    coverImage: "/images/blog/blog_6.jpg",
    coverImageAlt: "Illustration of software design pattern building blocks",
    content: `## The Power of Patterns

Design patterns capture proven solutions to recurring problems. Using them appropriately improves readability, testability, and scalability.

---

### Selected Patterns

1. **Strategy** – Swap algorithms at runtime (e.g., payment processors, compression engines).
2. **Observer** – Event-driven communication between decoupled components.
3. **Command** – Encapsulate requests as objects for undo/redo and queuing.
4. **CQRS** – Separate read/write models for high-throughput systems.
5. **Repository** – Decouple data access from business logic.

#### TypeScript Example – Strategy Pattern

\`\`\`typescript
interface CompressStrategy {
  compress(input: string): string;
}

class ZipStrategy implements CompressStrategy {
  compress(input: string) { return \`zip(\${input})\`; }
}

class GzipStrategy implements CompressStrategy {
  compress(input: string) { return \`gzip(\${input})\`; }
}

class Compressor {
  constructor(private strategy: CompressStrategy) {}
  compress(data: string) { return this.strategy.compress(data); }
}

const zip = new Compressor(new ZipStrategy());
console.log(zip.compress('data')); // zip(data)
\`\`\`

---

### When to Use a Pattern

- **Complexity vs Simplicity** – Avoid over-engineering; apply patterns when they solve a clear problem.
- **Team Familiarity** – Ensure the team understands the pattern to avoid misuse and unnecessary abstraction.`,
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "Software Architect",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-04-01",
    readingTime: "7 min read",
    tags: ["Design Patterns", "TypeScript", "Architecture", "Software Engineering", "CQRS"],
    relatedLinks: [],
    featured: false,
    published: true,
    order: 6,
  },
  {
    id: "blog-7",
    slug: "cloud-networking-with-kubernetes-service-mesh",
    title: "Cloud Networking with Kubernetes Service Mesh: A Practical Overview",
    subtitle: "Understanding traffic management, security, and observability with Istio and Linkerd.",
    excerpt: "Learn how service mesh adds transparent networking, mutual TLS, and telemetry to Kubernetes workloads.",
    category: "Cloud & DevOps",
    coverImage: "/images/blog/blog_7.jpg",
    coverImageAlt: "Kubernetes service mesh architecture showing sidecar proxies and control plane",
    content: `## Service Mesh Basics

A service mesh is an infrastructure layer that handles service-to-service communication, providing routing, security, and observability without code changes.

---

### Core Features

- **Traffic Splitting** – Canary releases, A/B testing, and blue/green deployments through weighted routing rules.
- **mTLS Encryption** – Automatic mutual TLS for all pod-to-pod traffic without application changes.
- **Telemetry** – Distributed tracing (Jaeger), metrics (Prometheus), and structured logs.
- **Retry & Circuit Breaking** – Automatic retries with exponential backoff and circuit breakers to prevent cascading failures.

### Getting Started with Istio

1. Install the Istio control plane with \`istioctl install\`.
2. Enable automatic sidecar injection in your namespace.
3. Define VirtualService and DestinationRule resources to control traffic routing.

#### Sample VirtualService for Canary Deployment

\`\`\`yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: frontend
spec:
  hosts:
  - frontend
  http:
  - route:
    - destination:
        host: frontend
        subset: v1
      weight: 90
    - destination:
        host: frontend
        subset: v2
      weight: 10
\`\`\`

---

### Observability Stack

Deploy **Kiali** for real-time mesh visualization, **Jaeger** for distributed tracing, and **Grafana** for metrics dashboards.`,
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "Cloud & Platform Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-04-15",
    readingTime: "5 min read",
    tags: ["Kubernetes", "Service Mesh", "Istio", "Linkerd", "Observability"],
    relatedLinks: [],
    featured: false,
    published: true,
    order: 7,
  },
  {
    id: "blog-8",
    slug: "microservices-testing-strategies-2025",
    title: "Microservices Testing Strategies for 2025: From Unit to Contract Tests",
    subtitle: "A comprehensive guide to ensuring reliability in distributed systems.",
    excerpt: "Explore unit, integration, contract, and chaos testing techniques for microservices architectures.",
    category: "Software Architecture",
    coverImage: "/images/blog/blog_8.jpg",
    coverImageAlt: "Testing pyramid showing unit, integration, contract, and E2E test layers",
    content: `## Testing Pyramid for Microservices

A solid testing strategy is essential for maintaining confidence in distributed systems. The testing pyramid helps balance speed, cost, and coverage.

- **Unit Tests** – Fast, isolated tests covering individual functions and classes.
- **Integration Tests** – Verify interactions between services using test containers and in-memory databases.
- **Contract Tests** – Ensure API contracts remain stable between producer and consumer services (Pact, Spring Cloud Contract).
- **End-to-End Tests** – Full-stack scenarios with realistic data, run sparingly due to cost.
- **Chaos Engineering** – Introduce controlled failures to validate system resilience (Gremlin, Chaos Mesh, Litmus).

---

### Contract Testing with Pact

\`\`\`typescript
// Consumer test example
const interaction = {
  state: 'order exists',
  uponReceiving: 'a request for order details',
  withRequest: {
    method: 'GET',
    path: '/api/orders/123',
  },
  willRespondWith: {
    status: 200,
    body: { id: '123', status: 'confirmed', total: 99.99 },
  },
};
\`\`\`

---

### Best Practices

- Automate contract verification in your CI pipeline.
- Use **Testcontainers** to spin up dependent services (databases, message brokers) locally.
- Keep test data deterministic, versioned, and isolated per test suite.
- Run chaos experiments in staging before production to build confidence.`,
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "Software Quality Engineer",
      avatar: "/images/hero/hero-image.png",
    },
    date: "2025-04-25",
    readingTime: "6 min read",
    tags: ["Testing", "Microservices", "Pact", "Chaos Engineering", "Testcontainers"],
    relatedLinks: [],
    featured: false,
    published: true,
    order: 8,
  },
];
