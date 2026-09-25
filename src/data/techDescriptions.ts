export interface TechInfo {
  shortDescription: string;
  description: string;
  officialUrl?: string;
  experienceYears?: string;
  projectsUsed?: string[];
}

export const TECH_DESCRIPTIONS: Record<string, TechInfo> = {
  python: {
    shortDescription: "High-level programming language used for backend web APIs, AI/machine learning, data processing, and security automation scripts.",
    description: "Python is my primary language for backend systems, automated cybersecurity tooling, AI integration, and scripting. Extensively utilized with frameworks like FastAPI, Flask, and Django, as well as libraries for network manipulation and data engineering.",
    officialUrl: "https://www.python.org",
    experienceYears: "4+ Years",
    projectsUsed: ["AI Automation Tools", "REST APIs", "Network Scanners", "Web Scraping Pipelines"],
  },
  typescript: {
    shortDescription: "Typed superset of JavaScript that adds static type definitions, ensuring robust code quality, type safety, and maintainability in large applications.",
    description: "TypeScript is my go-to language for building enterprise-grade frontends and Node.js backends. Enables strict type contracts, enhanced developer ergonomics, refactoring safety, and seamless React/Next.js architecture.",
    officialUrl: "https://www.typescriptlang.org",
    experienceYears: "3+ Years",
    projectsUsed: ["Portfolio Platform", "Full-Stack Web Apps", "Admin Dashboards", "E-Commerce Systems"],
  },
  javascript: {
    shortDescription: "Core dynamic scripting language powering interactive web user interfaces, asynchronous event-driven backends, and full-stack web applications.",
    description: "Deep foundation in modern ES6+ JavaScript, asynchronous programming (Promises, async/await), DOM manipulation, closures, prototype inheritance, and browser APIs across both client and server runtimes.",
    officialUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    experienceYears: "5+ Years",
    projectsUsed: ["Dynamic Web UIs", "Browser Extensions", "Node.js Microservices", "Interactive Dashboards"],
  },
  go: {
    shortDescription: "Statically typed, compiled systems language engineered by Google for concurrent backend microservices, high-performance networking, and cloud tooling.",
    description: "Used Go for building lightning-fast microservices, high-concurrency network utilities, and command-line tools. Leverages goroutines and channels for efficient multi-threaded operations and minimal memory footprints.",
    officialUrl: "https://go.dev",
    experienceYears: "2+ Years",
    projectsUsed: ["Microservices", "High-Throughput Network Utilities", "CLI Automation"],
  },
  bash: {
    shortDescription: "Unix shell command and scripting language used for Linux systems administration, DevOps automation, CI/CD pipelines, and task scripting.",
    description: "Proficient in writing robust Shell/Bash scripts for automated server provisioning, log parsing, backup routines, security audits, and Docker orchestration pipelines.",
    officialUrl: "https://www.gnu.org/software/bash",
    experienceYears: "4+ Years",
    projectsUsed: ["Linux Server Automation", "CI/CD Deployment Pipelines", "Backup & Monitoring Scripts"],
  },
  c: {
    shortDescription: "Low-level procedural language providing direct memory manipulation, high hardware efficiency, and foundation for systems programming and embedded devices.",
    description: "Applied in systems-level programming, data structures, pointer arithmetic, memory management, and microcontroller programming (Arduino, embedded sensors, socket programming).",
    officialUrl: "https://en.cppreference.com/w/c",
    experienceYears: "3+ Years",
    projectsUsed: ["Embedded IoT Projects", "Socket Programming", "Data Structure Implementations"],
  },
  react: {
    shortDescription: "Component-based front-end JavaScript library used for building highly interactive, scalable, and responsive user interfaces.",
    description: "Extensive experience constructing modern web applications using React hooks, functional components, state management (Redux, Context API, Zustand), Tailwind CSS styling, and component lifecycles.",
    officialUrl: "https://react.dev",
    experienceYears: "4+ Years",
    projectsUsed: ["Full-Stack Portfolios", "Interactive Dashboards", "E-Commerce UIs", "Client Portals"],
  },
  "next.js": {
    shortDescription: "React production framework providing Server-Side Rendering (SSR), App Router architecture, Static Site Generation (SSG), and edge API routes.",
    description: "Specialized in Next.js 14 & 15 App Router architecture, server actions, dynamic routing, SEO optimization, incremental static regeneration (ISR), and performant web deployment on Vercel/Node servers.",
    officialUrl: "https://nextjs.org",
    experienceYears: "3+ Years",
    projectsUsed: ["Next.js 15 Portfolio", "Dynamic CMS Platforms", "Enterprise Web Apps", "SEO Portals"],
  },
  "node.js": {
    shortDescription: "Asynchronous, event-driven JavaScript runtime engine built on Chrome's V8, used for scalable REST APIs, microservices, and web servers.",
    description: "Developed modular RESTful APIs, WebSocket servers, middleware layers, authentication systems (JWT, OAuth), and background worker jobs using Node.js, Express, and modern npm ecosystems.",
    officialUrl: "https://nodejs.org",
    experienceYears: "4+ Years",
    projectsUsed: ["REST API Backends", "Real-Time WebSocket Servers", "Auth Systems", "Microservices"],
  },
  fastapi: {
    shortDescription: "Modern, ultra-fast Python web framework built on Starlette and Pydantic for developing high-performance REST APIs with auto-generated OpenAPI docs.",
    description: "Built performant asynchronous Python APIs with FastAPI, leveraging automatic schema validation, OpenAPI/Swagger documentation, dependency injection, and asynchronous database queries.",
    officialUrl: "https://fastapi.tiangolo.com",
    experienceYears: "2+ Years",
    projectsUsed: ["AI Model Serving APIs", "Microservice Backends", "Cloud Telemetry APIs"],
  },
  flutter: {
    shortDescription: "Google's UI toolkit for building natively compiled cross-platform mobile (Android & iOS), web, and desktop apps from a single Dart codebase.",
    description: "Constructed cross-platform mobile apps with Flutter and Dart, integrating state management (Bloc, Provider), REST APIs, native device hardware features, and custom UI animations.",
    officialUrl: "https://flutter.dev",
    experienceYears: "2+ Years",
    projectsUsed: ["Cross-Platform Mobile Apps", "Customer Service Mobile App", "IoT Mobile Controller"],
  },
  tailwindcss: {
    shortDescription: "Utility-first CSS framework for rapidly building custom, responsive, accessible, and themeable modern web designs directly in markup.",
    description: "Deep expertise with Tailwind CSS v3 and v4, configuring responsive layouts, dark mode switching, custom typography plugins, CSS animations, and polished UI component systems.",
    officialUrl: "https://tailwindcss.com",
    experienceYears: "4+ Years",
    projectsUsed: ["Modern Web Portfolio", "Tailwind UI Components", "Dark/Light Themed Dashboards"],
  },
  docker: {
    shortDescription: "Containerization platform that packages applications and dependencies into isolated, lightweight, and portable containers for consistent deployment.",
    description: "Configured multi-stage Dockerfiles, Docker Compose orchestrations, volume persistence, and isolated networking environments for full-stack applications, databases, and microservices.",
    officialUrl: "https://www.docker.com",
    experienceYears: "3+ Years",
    projectsUsed: ["Containerized Web Stacks", "Local Dev Environments", "Production Server Containers"],
  },
  linux: {
    shortDescription: "Open-source Unix-like operating system kernel powering cloud servers, containers, embedded systems, and security testing environments.",
    description: "Extensive hands-on administration of Ubuntu, Debian, Kali Linux, and Arch. Experienced in systemd services, permissions, firewall management (UFW, iptables), SSH hardening, and kernel monitoring.",
    officialUrl: "https://www.kernel.org",
    experienceYears: "5+ Years",
    projectsUsed: ["Cloud VPS Hosting", "Kali Linux Penetration Labs", "Production Web Servers"],
  },
  aws: {
    shortDescription: "Amazon Web Services cloud platform offering scalable on-demand compute, storage, databases, networking, and serverless infrastructure.",
    description: "Configured AWS EC2 virtual machines, S3 object storage buckets, IAM roles/policies, Route 53 DNS records, and CloudFront CDN distributions for secure web hosting.",
    officialUrl: "https://aws.amazon.com",
    experienceYears: "2+ Years",
    projectsUsed: ["EC2 Web Deployments", "S3 Media Storage", "Cloud Architecture Setups"],
  },
  nginx: {
    shortDescription: "High-performance web server, reverse proxy, load balancer, and HTTP cache engineered for maximum concurrency and low memory usage.",
    description: "Configured Nginx reverse proxies, SSL/TLS certificate automation (Certbot/Let's Encrypt), load balancing upstream servers, rate limiting, and static file caching.",
    officialUrl: "https://nginx.org",
    experienceYears: "3+ Years",
    projectsUsed: ["Production Reverse Proxies", "SSL/TLS Security Hardening", "Domain Virtual Hosts"],
  },
  github: {
    shortDescription: "Web-based hosting service for Git version control, collaboration, code reviews, issue tracking, and GitHub Actions CI/CD workflows.",
    description: "Active user of GitHub for team collaboration, code reviews, branch protection rules, automated CI/CD deployment pipelines with GitHub Actions, and open-source contributions.",
    officialUrl: "https://github.com",
    experienceYears: "5+ Years",
    projectsUsed: ["Open-Source Repositories", "CI/CD Deployment Actions", "Collaborative Codebases"],
  },
  ansible: {
    shortDescription: "Open-source IT automation engine that automates cloud provisioning, configuration management, application deployment, and intraservice orchestration.",
    description: "Authored Ansible Playbooks to automate server configuration, user provisioning, security patch rollouts, and infrastructure consistency across multiple remote Linux nodes.",
    officialUrl: "https://www.ansible.com",
    experienceYears: "2+ Years",
    projectsUsed: ["Server Configuration Playbooks", "Automated Security Patching"],
  },
  postgresql: {
    shortDescription: "Advanced open-source relational database supporting complex SQL queries, JSONB document types, transactions (ACID), and robust scalability.",
    description: "Designed normalized relational schemas, complex joins, indexed queries, foreign keys, triggers, and full-text search with PostgreSQL. Managed via Prisma, Drizzle, and direct SQL.",
    officialUrl: "https://www.postgresql.org",
    experienceYears: "4+ Years",
    projectsUsed: ["Enterprise Databases", "Relational Data Schemas", "Analytics Data Stores"],
  },
  mysql: {
    shortDescription: "Widely used open-source relational database management system (RDBMS) optimized for high read performance, reliability, and web applications.",
    description: "Designed database tables, stored procedures, indexed lookups, and transaction pipelines for high-traffic LAMP/WAMP web platforms and relational applications.",
    officialUrl: "https://www.mysql.com",
    experienceYears: "4+ Years",
    projectsUsed: ["WAMP/LAMP Web Apps", "E-Commerce Database", "User Accounts Databases"],
  },
  mongodb: {
    shortDescription: "NoSQL document database that stores data in flexible, JSON-like BSON documents, ideal for rapid iteration and unstructured schemas.",
    description: "Utilized MongoDB for document storage, aggregation pipelines, dynamic schemas, and high-velocity logging with Mongoose ORM in full-stack Node.js applications.",
    officialUrl: "https://www.mongodb.com",
    experienceYears: "3+ Years",
    projectsUsed: ["MERN Stack Applications", "Activity Log Stores", "Unstructured Data Stores"],
  },
  redis: {
    shortDescription: "In-memory data structure store used as a distributed cache, message broker, session store, and high-speed key-value database.",
    description: "Implemented Redis for lightning-fast API response caching, user session stores, pub/sub messaging channels, and rate-limiting counters in high-throughput applications.",
    officialUrl: "https://redis.io",
    experienceYears: "2+ Years",
    projectsUsed: ["API Response Caching", "Session Management", "Rate Limiting Middleware"],
  },
  firebase: {
    shortDescription: "Google's cloud backend platform offering real-time Firestore database, authentication, cloud storage, security rules, and serverless hosting.",
    description: "Built dynamic web applications using Firebase Cloud Firestore real-time snapshots, Firebase Authentication, Cloud Storage, and robust Firestore security rules.",
    officialUrl: "https://firebase.google.com",
    experienceYears: "4+ Years",
    projectsUsed: ["Portfolio CMS Backend", "Real-Time Chat Applications", "Visitor Tracking Store"],
  },
  "vs code": {
    shortDescription: "Lightweight and powerful source code editor with rich ecosystem of extensions, integrated debugger, terminal, and Git integration.",
    description: "Primary development IDE customized with Vim bindings, TypeScript linters, Docker/Dev Containers, GitLens, and tailored productivity tooling.",
    officialUrl: "https://code.visualstudio.com",
    experienceYears: "5+ Years",
    projectsUsed: ["Primary Coding Workspace", "Full-Stack Development", "Remote SSH Coding"],
  },
  git: {
    shortDescription: "Distributed version control system designed to track changes in source code, enable branching workflows, and support team collaboration.",
    description: "Command-line mastery in Git branching, merge conflicts resolution, rebasing, stash management, cherry-picking, Git hooks, and multi-remote repositories.",
    officialUrl: "https://git-scm.com",
    experienceYears: "5+ Years",
    projectsUsed: ["Version Control for all projects", "Git Flow Collaboration", "Release Tagging"],
  },
  postman: {
    shortDescription: "API platform for building, testing, documenting, and mocking HTTP REST and WebSocket APIs with automated test suites.",
    description: "Used Postman to design, test, and document REST endpoints, configure environment variables, create automated test scripts, and validate API contract payloads.",
    officialUrl: "https://www.postman.com",
    experienceYears: "4+ Years",
    projectsUsed: ["API Testing & Validation", "Mock Server Setups", "API Documentation"],
  },
  figma: {
    shortDescription: "Collaborative browser-based interface design and prototyping tool used for wireframing, UI/UX systems, and design handoffs.",
    description: "Designed responsive UI mockups, design tokens, color systems, component libraries, and interactive prototypes for web and mobile interfaces before frontend coding.",
    officialUrl: "https://www.figma.com",
    experienceYears: "3+ Years",
    projectsUsed: ["Website Mockups", "Component Design Systems", "Wireframing User Flows"],
  },
  wireshark: {
    shortDescription: "World's foremost network protocol analyzer used for deep packet inspection, real-time traffic monitoring, and network troubleshooting.",
    description: "Utilized Wireshark for deep network protocol inspection, packet capture analysis (.pcap), identifying security anomalies, analyzing TCP/UDP handshakes, and diagnosing network bottlenecks.",
    officialUrl: "https://www.wireshark.org",
    experienceYears: "3+ Years",
    projectsUsed: ["Packet Capture Analysis", "Network Security Audits", "Protocol Troubleshooting"],
  },
  nmap: {
    shortDescription: "Network discovery and vulnerability scanning tool used by cybersecurity professionals to map network hosts, open ports, and services.",
    description: "Hands-on experience conducting network reconnaissance, port scanning (SYN/TCP/UDP), OS fingerprinting, version detection, and vulnerability assessments using Nmap Scripting Engine (NSE).",
    officialUrl: "https://nmap.org",
    experienceYears: "3+ Years",
    projectsUsed: ["Network Reconnaissance", "Port & Service Audits", "NSE Vulnerability Scripts"],
  },
  metasploit: {
    shortDescription: "Penetration testing framework used by security researchers to probe vulnerabilities, execute exploit modules, and test defensive security postures.",
    description: "Used in controlled cybersecurity lab environments for vulnerability validation, payload generation (msfvenom), exploit execution, and penetration testing simulations.",
    officialUrl: "https://www.metasploit.com",
    experienceYears: "2+ Years",
    projectsUsed: ["Penetration Testing Labs", "Exploit Verification", "Security Posture Testing"],
  },
  openvpn: {
    shortDescription: "Open-source virtual private network (VPN) system implementing secure point-to-point and site-to-site encrypted connections.",
    description: "Configured secure OpenVPN server/client profiles, SSL/TLS certificates, tunnel routing, and encrypted remote access connections for lab environments and private networks.",
    officialUrl: "https://openvpn.net",
    experienceYears: "3+ Years",
    projectsUsed: ["Secure Remote Access", "Encrypted Network Tunnels", "Cyber Lab Access"],
  },
};

/**
 * Returns tech info from custom database entry, or falls back to built-in knowledge base
 */
export function getTechInfo(name: string): TechInfo {
  const key = name.toLowerCase().trim();
  if (TECH_DESCRIPTIONS[key]) {
    return TECH_DESCRIPTIONS[key];
  }
  // Partial match
  for (const [k, val] of Object.entries(TECH_DESCRIPTIONS)) {
    if (key.includes(k) || k.includes(key)) {
      return val;
    }
  }
  return {
    shortDescription: `${name} is a key technology used in modern development and engineering workflows.`,
    description: `Extensive hands-on experience utilizing ${name} in architecture design, project workflows, and production systems.`,
    experienceYears: "2+ Years",
  };
}
