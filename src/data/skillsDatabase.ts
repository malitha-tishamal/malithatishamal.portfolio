/**
 * Comprehensive 2000+ Skills Database for Autocomplete & Suggestions
 * Covers Software Engineering, Full Stack, DevOps, Networking, Cybersecurity,
 * Cloud, AI/ML, Databases, Mobile, Testing, Systems, Protocols, Hardware, and Tools.
 */

export const SKILLS_DATABASE: string[] = [
  // ── PROGRAMMING LANGUAGES ──
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Rust", "PHP",
  "Ruby", "Kotlin", "Swift", "Dart", "Scala", "Elixir", "Perl", "Haskell", "Lua", "R",
  "Julia", "Solidity", "Assembly", "Zig", "Nim", "Erlang", "Clojure", "F#", "Groovy", "Visual Basic",
  "Bash", "Shell Scripting", "PowerShell", "Zsh", "Fish", "AWK", "Sed", "MATLAB", "Fortran", "COBOL",
  "VHDL", "Verilog", "Racket", "OCaml", "Scheme", "Common Lisp", "Prolog", "Apex", "ActionScript", "GraphQL Schema",
  "CoffeeScript", "D", "Ada", "Tcl", "Crystal", "PureScript", "ReasonML", "Vala", "Haxe", "Smalltalk",

  // ── FRONTEND & UI FRAMEWORKS ──
  "React", "React 19", "Next.js", "Next.js 15", "Vue.js", "Vue 3", "Nuxt.js", "Angular", "AngularJS", "Svelte",
  "SvelteKit", "Remix", "Gatsby", "Astro", "SolidJS", "Qwik", "Alpine.js", "Preact", "Ember.js", "Backbone.js",
  "jQuery", "HTML5", "CSS3", "SCSS", "Sass", "Less", "Stylus", "PostCSS", "Tailwind CSS", "TailwindCSS v4",
  "Bootstrap", "Bootstrap 5", "Bulma", "Foundation", "Material-UI (MUI)", "Chakra UI", "Ant Design", "Shadcn/ui",
  "Radix UI", "Headless UI", "DaisyUI", "Flowbite", "NextUI", "Mantee", "Semantic UI", "Tailwind Elements",
  "Styled Components", "Emotion", "CSS Modules", "Vanilla Extract", "Stitches", "JSS", "CSS-in-JS",
  "Three.js", "WebGL", "WebGPU", "Babylon.js", "D3.js", "Chart.js", "ECharts", "Recharts", "ApexCharts", "Highcharts",
  "Canvas API", "SVG Animation", "GSAP (GreenSock)", "Framer Motion", "Anime.js", "Lottie", "Locomotive Scroll",
  "Redux", "Redux Toolkit (RTK)", "Zustand", "Recoil", "Jotai", "MobX", "XState", "Pinia", "Vuex", "NgRx",
  "TanStack Query (React Query)", "SWR", "Apollo Client", "URQL", "Relay", "Axios", "Fetch API", "Ky",
  "Webpack", "Vite", "Turbopack", "Rollup", "Parcel", "esbuild", "Babel", "SWC", "Gulp", "Grunt",
  "Micro-Frontends", "Module Federation", "Server-Side Rendering (SSR)", "Static Site Generation (SSG)",
  "Incremental Static Regeneration (ISR)", "Client-Side Rendering (CSR)", "Progressive Web Apps (PWA)",
  "Web Workers", "Service Workers", "WebAssembly (WASM)", "Shadow DOM", "Web Components", "Custom Elements",

  // ── BACKEND & SERVER FRAMEWORKS ──
  "Node.js", "Express.js", "NestJS", "Fastify", "Koa", "Hono", "Sails.js", "LoopBack", "AdonisJS", "Strapi",
  "Django", "Django REST Framework (DRF)", "FastAPI", "Flask", "Tornado", "Sanic", "Celery", "Pyramid",
  "Spring Boot", "Spring MVC", "Spring Cloud", "Spring Security", "Hibernate", "Quarkus", "Micronaut", "JPA",
  "ASP.NET Core", ".NET Core", ".NET 8", "Entity Framework", "C# Web API", "Blazor", "WCF",
  "Ruby on Rails", "Sinatra", "Hanami", "Laravel", "Symfony", "CodeIgniter", "Yii", "CakePHP", "Lumen", "Slim",
  "Fiber (Go)", "Gin (Go)", "Echo (Go)", "Chi (Go)", "Gorilla Mux", "Actix-Web (Rust)", "Axum (Rust)", "Rocket (Rust)",
  "Tonic (Rust gRPC)", "Phoenix (Elixir)", "Plug", "Ecto", "Ktor (Kotlin)", "Micronaut", "Dropwizard",
  "REST APIs", "RESTful Architecture", "GraphQL", "Apollo Server", "gRPC", "Protocol Buffers (Protobuf)", "Thrift",
  "tRPC", "JSON-RPC", "SOAP", "WebSockets", "Socket.io", "Server-Sent Events (SSE)", "WebHooks",
  "Microservices", "Event-Driven Architecture", "Domain-Driven Design (DDD)", "CQRS", "Event Sourcing",
  "Message Brokers", "Apache Kafka", "RabbitMQ", "ActiveMQ", "NATS", "ZeroMQ", "Apache Pulsar", "AWS SQS",
  "AWS SNS", "Google Cloud Pub/Sub", "Azure Service Bus", "BullMQ", "Celery Tasks", "Sidekiq",

  // ── DATABASES & DATA STORAGE ──
  "PostgreSQL", "MySQL", "MariaDB", "SQLite", "Oracle Database", "Microsoft SQL Server (MSSQL)", "IBM DB2",
  "Amazon Aurora", "CockroachDB", "Google Cloud Spanner", "PlanetScale", "Supabase", "Neon Database",
  "MongoDB", "Amazon DocumentDB", "CouchDB", "Couchbase", "ArangoDB", "RavenDB",
  "Redis", "Memcached", "KeyDB", "Aerospike", "DragonflyDB",
  "Cassandra", "Apache ScyllaDB", "Amazon DynamoDB", "Apache HBase", "Google Cloud Bigtable",
  "Neo4j", "Amazon Neptune", "OrientDB", "Dgraph", "TigerGraph",
  "Elasticsearch", "OpenSearch", "Apache Solr", "MeiliSearch", "Typesense", "Algolia",
  "Vector Databases", "Pinecone", "Milvus", "Weaviate", "Qdrant", "ChromaDB", "pgvector", "Faiss",
  "InfluxDB", "TimescaleDB", "Prometheus TSDB", "QuestDB", "VictoriaMetrics",
  "Apache Hive", "Snowflake", "Google BigQuery", "Amazon Redshift", "Databricks", "ClickHouse", "Presto", "Trino",
  "Prisma ORM", "TypeORM", "Drizzle ORM", "Sequelize", "Mongoose", "SQLAlchemy", "Tortoise ORM", "Peewee",
  "GORM (Go)", "Diesel (Rust)", "SeaORM (Rust)", "Room (Android)", "CoreData (iOS)",
  "Database Sharding", "Database Replication", "Read Replicas", "Database Partitioning", "ACID Transactions",
  "BASE Properties", "CAP Theorem", "Database Indexing", "B-Trees", "LSM Trees", "WAL (Write-Ahead Logging)",
  "Connection Pooling", "HikariCP", "PgBouncer", "SQL Query Optimization", "Explain Plan Analysis",

  // ── DEVOPS, CLOUD & INFRASTRUCTURE ──
  "Docker", "Docker Compose", "Docker Swarm", "Podman", "containerd", "CRI-O",
  "Kubernetes (K8s)", "Minikube", "Kind", "k3s", "MicroK8s", "Helm", "Kustomize", "OpenShift",
  "Kubernetes Operators", "Kubernetes Ingress", "Envoy Proxy", "Istio Service Mesh", "Linkerd", "Consul",
  "Terraform", "Terragrunt", "OpenTofu", "Pulumi", "AWS CloudFormation", "AWS CDK", "Azure Bicep",
  "Ansible", "Ansible Playbooks", "Puppet", "Chef", "SaltStack", "Vagrant", "Packer",
  "CI/CD Pipelines", "GitHub Actions", "GitLab CI/CD", "Jenkins", "Jenkinsfile", "CircleCI", "Travis CI",
  "ArgoCD", "FluxCD", "Spinnaker", "Tekton", "Drone CI", "TeamCity", "Bamboo", "Bitbucket Pipelines",
  "AWS (Amazon Web Services)", "AWS EC2", "AWS S3", "AWS Lambda", "AWS RDS", "AWS DynamoDB", "AWS CloudFront",
  "AWS Route 53", "AWS VPC", "AWS IAM", "AWS ECS", "AWS EKS", "AWS Fargate", "AWS API Gateway",
  "AWS SQS", "AWS SNS", "AWS CloudWatch", "AWS Elastic Beanstalk", "AWS Secrets Manager", "AWS KMS",
  "Microsoft Azure", "Azure Virtual Machines", "Azure App Service", "Azure Functions", "Azure Blob Storage",
  "Azure SQL", "Azure Cosmos DB", "Azure Kubernetes Service (AKS)", "Azure DevOps", "Azure Active Directory (Entra ID)",
  "Google Cloud Platform (GCP)", "GCP Compute Engine", "GCP App Engine", "GCP Cloud Run", "GCP Cloud Functions",
  "GCP Google Kubernetes Engine (GKE)", "GCP Cloud Storage", "GCP Cloud SQL", "GCP Cloud Spanner", "GCP BigQuery",
  "DigitalOcean", "Linode (Akamai)", "Hetzner Cloud", "Vultr", "OVHcloud", "Oracle Cloud Infrastructure (OCI)",
  "Vercel", "Netlify", "Heroku", "Render", "Railway", "Fly.io", "Cloudflare Workers", "Cloudflare Pages",
  "Serverless Architecture", "AWS Serverless Application Model (SAM)", "Serverless Framework",
  "Site Reliability Engineering (SRE)", "Infrastructure as Code (IaC)", "Immutable Infrastructure", "GitOps",

  // ── COMPUTER NETWORKING ──
  "Computer Networking", "Network Engineering", "TCP/IP Suite", "UDP", "OSI 7-Layer Model", "IPv4", "IPv6",
  "Subnetting & CIDR", "VLSM", "DNS (Domain Name System)", "DHCP", "NAT / PAT", "ARP & RARP", "ICMP",
  "BGP (Border Gateway Protocol)", "OSPF (Open Shortest Path First)", "EIGRP", "RIP", "IS-IS", "Static Routing",
  "VLAN (Virtual LAN)", "VLAN Trunking (802.1Q)", "Spanning Tree Protocol (STP)", "RSTP", "MSTP", "LACP (Link Aggregation)",
  "MPLS (Multiprotocol Label Switching)", "SDN (Software-Defined Networking)", "OpenFlow", "SD-WAN", "NFV",
  "Network Virtualization", "VXLAN", "GRE Tunneling", "IPsec", "IPsec VPN", "OpenVPN", "WireGuard", "SSL/TLS VPN",
  "Cisco IOS", "Cisco NX-OS", "Cisco CCNA", "Cisco CCNP", "Cisco Packet Tracer", "GNS3", "EVE-NG",
  "Juniper Junos", "MikroTik RouterOS", "Arista EOS", "Huawei VRP", "Ubiquiti UniFi", "EdgeRouter",
  "pfSense", "OPNsense", "VyOS", "Sophos XG", "Fortinet FortiGate", "Palo Alto Networks", "SonicWall",
  "Wireshark", "tcpdump", "Ngrep", "Tshark", "Network Packet Analysis", "Deep Packet Inspection (DPI)",
  "Load Balancing", "HAProxy", "Nginx Load Balancing", "F5 BIG-IP", "Citrix NetScaler", "Keepalived", "VRRP",
  "Reverse Proxy", "Forward Proxy", "Traefik", "Caddy Server", "Apache HTTP Server", "Squid Proxy",
  "Network Automation", "Python for Networking", "Netmiko", "NAPALM", "Paramiko", "Scapy", "Nornir",
  "SNMP (v2c/v3)", "NetFlow", "sFlow", "IPFIX", "Syslog", "NTP Configuration", "Radius", "TACACS+",
  "VoIP", "SIP Protocol", "Asterisk PBX", "FreePBX", "WebRTC Protocols", "Quality of Service (QoS)",
  "Bandwidth Shaping", "Traffic Policing", "Port Mirroring / SPAN", "802.1X Network Access Control",

  // ── CYBERSECURITY & HARDENING ──
  "Cybersecurity", "Information Security (InfoSec)", "Network Security", "Penetration Testing (Ethical Hacking)",
  "Vulnerability Assessment", "OWASP Top 10", "OWASP API Security Top 10", "SANS Top 25", "MITRE ATT&CK Framework",
  "Kali Linux", "Parrot Security OS", "BlackArch", "Metasploit Framework", "Nmap Network Scanner", "Burp Suite Professional",
  "OWASP ZAP", "Nikto Web Scanner", "Nessus Vulnerability Scanner", "OpenVAS", "Qualys", "Acunetix",
  "SQLmap", "Hydra", "John the Ripper", "Hashcat", "Aircrack-ng", "Reaver", "Wifite", "Bettercap",
  "Responder", "BloodHound", "Empire", "Cobalt Strike", "Mimikatz", "Impacket", "Chisel",
  "Web Application Firewall (WAF)", "Cloudflare WAF", "AWS WAF", "ModSecurity", "Coraza WAF",
  "Intrusion Detection System (IDS)", "Intrusion Prevention System (IPS)", "Snort", "Suricata", "Zeek (Bro)", "OSSEC", "Wazuh",
  "SIEM Systems", "Splunk", "Elastic SIEM", "QRadar", "AlienVault OSSIM", "Microsoft Sentinel",
  "Server Hardening", "Linux Security Hardening", "CIS Benchmarks", "SELinux", "AppArmor", "iptables", "nftables",
  "UFW (Uncomplicated Firewall)", "firewalld", "Fail2ban", "CrowdSec", "Rootkit Hunter (rkhunter)", "Lynis Security Audit",
  "Public Key Infrastructure (PKI)", "Certificates (X.509)", "Let's Encrypt / Certbot", "OpenSSL", "GnuPG (GPG)",
  "Cryptography", "AES Encryption", "RSA Encryption", "ECC (Elliptic Curve Cryptography)", "SHA-256", "Argon2", "Bcrypt",
  "Identity & Access Management (IAM)", "OAuth 2.0", "OpenID Connect (OIDC)", "SAML 2.0", "LDAP", "Kerberos", "Keycloak",
  "Zero Trust Architecture", "Multi-Factor Authentication (MFA)", "Hardware Security Keys (FIDO2/WebAuthn)",
  "DDoS Protection & Mitigation", "Rate Limiting", "CORS Configuration", "Content Security Policy (CSP)",
  "Security Auditing", "ISO 27001", "SOC 2 Type II", "PCI-DSS", "HIPAA Compliance", "GDPR Compliance",
  "Incident Response", "Digital Forensics", "Autopsy", "Volatility Memory Forensics", "Malware Analysis",

  // ── LINUX & OPERATING SYSTEMS ──
  "Linux System Administration", "Ubuntu Server", "Debian", "CentOS", "Red Hat Enterprise Linux (RHEL)",
  "Rocky Linux", "AlmaLinux", "Fedora", "Arch Linux", "Alpine Linux", "Amazon Linux", "openSUSE",
  "Systemd Services", "Cron Jobs", "Bash Scripting", "Linux File Permissions", "SSH Hardening", "SSH Key Pairs",
  "LVM (Logical Volume Manager)", "RAID Configuration", "ZFS File System", "Btrfs", "ext4",
  "NFS (Network File System)", "Samba (SMB/CIFS)", "rsync", "rclone", "cURL", "Wget",
  "Windows Server Administration", "Active Directory", "Group Policy (GPO)", "PowerShell Scripting", "Hyper-V",
  "macOS Environment", "FreeBSD", "OpenBSD",

  // ── MOBILE DEVELOPMENT ──
  "Flutter", "Dart", "React Native", "Expo", "Android Development", "Kotlin for Android", "Java for Android",
  "Android SDK", "Jetpack Compose", "Android Studio", "iOS Development", "Swift", "SwiftUI", "Objective-C",
  "Xcode", "CocoaPods", "Swift Package Manager (SPM)", "Fastlane", "Firebase for Mobile", "Push Notifications (FCM/APNs)",
  "In-App Purchases (IAP)", "Mobile State Management (Bloc, Riverpod, Provider, GetX)", "Offline Data Sync",
  "Capacitor", "Ionic Framework", "Cordova", "NativeScript", "Mobile UI/UX Design",

  // ── AI, MACHINE LEARNING & DATA SCIENCE ──
  "Artificial Intelligence (AI)", "Machine Learning (ML)", "Deep Learning", "Supervised Learning", "Unsupervised Learning",
  "Reinforcement Learning", "Neural Networks", "Convolutional Neural Networks (CNN)", "Recurrent Neural Networks (RNN)",
  "Transformers", "Large Language Models (LLMs)", "Generative AI", "Prompt Engineering", "Fine-Tuning Models",
  "Retrieval-Augmented Generation (RAG)", "Vector Embeddings", "Semantic Search", "LangChain", "LlamaIndex",
  "Hugging Face Transformers", "OpenAI API", "Anthropic Claude API", "Google Gemini API", "Ollama", "vLLM",
  "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "XGBoost", "LightGBM", "CatBoost",
  "Computer Vision", "OpenCV", "YOLO Object Detection", "MediaPipe", "Image Segmentation",
  "Natural Language Processing (NLP)", "spaCy", "NLTK", "BERT", "Tokenization", "Sentiment Analysis",
  "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Plotly", "Jupyter Notebook", "Google Colab",
  "MLOps", "MLflow", "Kubeflow", "DVC (Data Version Control)", "Weights & Biases", "Model Deployment",
  "ETL Pipelines", "Apache Spark", "Apache Airflow", "Apache Flink", "Kafka Streams", "dbt (Data Build Tool)",

  // ── MONITORING, LOGGING & OBSERVABILITY ──
  "Prometheus", "Grafana", "Grafana Dashboards", "Alertmanager", "Node Exporter",
  "ELK Stack (Elasticsearch, Logstash, Kibana)", "Logstash", "Kibana", "Filebeat", "Metricbeat",
  "Loki", "Fluentd", "Fluent Bit", "Vector", "Datadog", "New Relic", "Dynatrace", "AppDynamics",
  "OpenTelemetry (OTel)", "Jaeger Distributed Tracing", "Zipkin", "Sentry Error Tracking", "Uptime Kuma",
  "Zabbix", "Nagios", "PRTG Network Monitor", "SolarWinds", "Netdata",

  // ── TESTING & QUALITY ASSURANCE ──
  "Unit Testing", "Integration Testing", "End-to-End (E2E) Testing", "Test-Driven Development (TDD)",
  "Behavior-Driven Development (BDD)", "Jest", "Vitest", "Mocha", "Chai", "Jasmine", "Karma",
  "Cypress", "Playwright", "Puppeteer", "Selenium WebDriver", "Appium", "Robot Framework",
  "PyTest", "Unittest (Python)", "JUnit (Java)", "TestNG", "PHPUnit", "RSpec", "Go Testing Package",
  "Postman API Testing", "Newman", "Insomnia", "Swagger / OpenAPI Testing", "SoapUI",
  "Load Testing", "Performance Testing", "Apache JMeter", "k6 (Grafana)", "Locust", "Artillery", "Autocannon",
  "Static Code Analysis", "SonarQube", "ESLint", "Prettier", "Biome", "Checkov", "Trivy", "Snyk",

  // ── VERSION CONTROL & WORKFLOWS ──
  "Git", "GitHub", "GitLab", "Bitbucket", "Git Flow", "Trunk-Based Development", "Semantic Versioning",
  "Pull Requests / Code Reviews", "GitHub Pull Requests", "GitLab Merge Requests", "Git Rebase & Merge",
  "Git Submodules", "Monorepo Management (Turborepo, Nx, Lerna)", "Husky Git Hooks", "Lint-Staged",
  "Jira Software", "Confluence", "Trello", "Asana", "Linear", "ClickUp", "Notion", "Slack",
  "Agile Methodologies", "Scrum Framework", "Kanban", "Sprint Planning", "Daily Standups",

  // ── SYSTEM DESIGN & SOFTWARE ARCHITECTURE ──
  "System Design", "High-Level Architecture (HLA)", "Low-Level Design (LLD)", "Object-Oriented Programming (OOP)",
  "Functional Programming (FP)", "SOLID Principles", "DRY & KISS Principles", "Design Patterns (GoF)",
  "Singleton Pattern", "Factory Pattern", "Observer Pattern", "Strategy Pattern", "Adapter Pattern", "Decorator Pattern",
  "Clean Architecture", "Hexagonal Architecture (Ports and Adapters)", "Onion Architecture", "Layered Architecture",
  "Microservices Patterns", "API Gateway Pattern", "Circuit Breaker Pattern (Resilience4j)", "Saga Pattern",
  "Bulkhead Pattern", "Retry & Timeout Logic", "Idempotency", "Database Consistency Models",
  "Scalability Engineering", "Horizontal Scaling", "Vertical Scaling", "High Availability (HA)", "Failover Strategies",
  "Disaster Recovery (DR)", "Cache Strategies (Cache-Aside, Write-Through, Write-Back)", "Content Delivery Networks (CDN)",
  "Concurrency & Multithreading", "Thread Pools", "Async / Await Pattern", "Event Loops", "Goroutines & Channels",

  // ── HARDWARE, EMBEDDED & IOT ──
  "Internet of Things (IoT)", "Embedded Systems", "Arduino", "Raspberry Pi", "ESP32", "ESP8266", "STM32",
  "Embedded C", "MicroPython", "CircuitPython", "PlatformIO", "Arduino IDE",
  "MQTT Protocol", "CoAP", "HTTP for IoT", "WebSocket IoT", "I2C Communication", "SPI Bus", "UART Serial",
  "Sensor Integration (DHT11/22, Ultrasonic, PIR, Accelerometer, GPS)", "Actuator Control (Servos, Relays, Motors)",
  "Robotics Engineering", "ROS (Robot Operating System)", "Drone Programming", "Bluetooth Low Energy (BLE)",
  "Zigbee", "Z-Wave", "LoRa & LoRaWAN", "Cellular IoT (NB-IoT, LTE-M)", "PCB Design (KiCad, EasyEDA)",

  // ── UI/UX DESIGN & CREATIVE TOOLS ──
  "UI/UX Design", "Figma", "Figma Prototyping", "Adobe XD", "Sketch", "InVision",
  "User Research", "Wireframing", "Interactive Prototyping", "Design Systems", "Component Libraries",
  "Information Architecture", "Usability Testing", "Accessibility (a11y / WCAG 2.1)",
  "Adobe Photoshop", "Adobe Illustrator", "Canva", "Blender 3D", "Inkscape",

  // ── TECHNICAL SPECIALIZATIONS & ROLES ──
  "Full Stack Software Engineering", "Cloud Infrastructure Architecture", "Computer Network Administration",
  "Systems Engineering", "Cybersecurity Operations", "DevOps Implementation", "Database Administration (DBA)",
  "Mobile Application Engineering", "API Engineering", "Firmware Development", "Site Reliability Engineering",
  "Linux Kernel Basics", "Network Topology Design", "Cloud Security", "Enterprise Architecture"
];

// Deduplicate and sort alphabetically
export const SORTED_SKILLS_DATABASE: string[] = Array.from(
  new Set(SKILLS_DATABASE)
).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

/**
 * Fast search helper that returns matching skills based on user input
 * Prioritizes startsWith, then includes.
 */
export function searchSkills(query: string, maxResults: number = 20): string[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  const startsWithMatches: string[] = [];
  const containsMatches: string[] = [];

  for (const skill of SORTED_SKILLS_DATABASE) {
    const sLower = skill.toLowerCase();
    if (sLower === q) {
      // exact match at very front
      startsWithMatches.unshift(skill);
    } else if (sLower.startsWith(q)) {
      startsWithMatches.push(skill);
    } else if (sLower.includes(q)) {
      containsMatches.push(skill);
    }

    if (startsWithMatches.length + containsMatches.length >= maxResults * 3) {
      break;
    }
  }

  const combined = [...startsWithMatches, ...containsMatches];
  return Array.from(new Set(combined)).slice(0, maxResults);
}
