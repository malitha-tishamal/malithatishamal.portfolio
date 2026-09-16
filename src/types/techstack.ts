export interface TechItem {
  id: string;
  name: string;
  /** "devicon" | "url" | "emoji" */
  iconType: "devicon" | "url" | "emoji";
  /** devicon class string, image URL, or emoji character */
  iconValue: string;
  categoryId: string;
  /** 1-5 proficiency, optional */
  proficiency?: number;
  published: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TechCategory {
  id: string;
  name: string;
  /** hex color accent e.g. "#0a66c2" */
  color: string;
  order: number;
  published: boolean;
}

export interface TechStackSection {
  badge: string;
  heading: string;
  subheading: string;
}

export const defaultTechStackSection: TechStackSection = {
  badge: "Tech Stack",
  heading: "Languages, Frameworks & Tools",
  subheading:
    "Technologies I work with daily — from systems programming and cloud infrastructure to full-stack development and cybersecurity.",
};

export const defaultCategories: Omit<TechCategory, "id">[] = [
  { name: "Languages",             color: "#3b82f6", order: 1, published: true },
  { name: "Frameworks & Libraries", color: "#8b5cf6", order: 2, published: true },
  { name: "DevOps & Cloud",        color: "#f59e0b", order: 3, published: true },
  { name: "Databases",             color: "#10b981", order: 4, published: true },
  { name: "Tools & Platforms",     color: "#6366f1", order: 5, published: true },
  { name: "Security & Networking", color: "#ef4444", order: 6, published: true },
];

export const defaultTechItems: Omit<TechItem, "id">[] = [
  // Languages
  { name: "Python",      iconType: "devicon", iconValue: "devicon-python-plain colored",     categoryId: "languages", proficiency: 5, published: true, order: 1 },
  { name: "TypeScript",  iconType: "devicon", iconValue: "devicon-typescript-plain colored", categoryId: "languages", proficiency: 4, published: true, order: 2 },
  { name: "JavaScript",  iconType: "devicon", iconValue: "devicon-javascript-plain colored", categoryId: "languages", proficiency: 5, published: true, order: 3 },
  { name: "Go",          iconType: "devicon", iconValue: "devicon-go-plain colored",          categoryId: "languages", proficiency: 3, published: true, order: 4 },
  { name: "Bash",        iconType: "devicon", iconValue: "devicon-bash-plain",               categoryId: "languages", proficiency: 4, published: true, order: 5 },
  { name: "C",           iconType: "devicon", iconValue: "devicon-c-plain colored",           categoryId: "languages", proficiency: 3, published: true, order: 6 },
  // Frameworks
  { name: "React",       iconType: "devicon", iconValue: "devicon-react-original colored",   categoryId: "frameworks", proficiency: 5, published: true, order: 1 },
  { name: "Next.js",     iconType: "devicon", iconValue: "devicon-nextjs-plain",              categoryId: "frameworks", proficiency: 5, published: true, order: 2 },
  { name: "Node.js",     iconType: "devicon", iconValue: "devicon-nodejs-plain colored",     categoryId: "frameworks", proficiency: 4, published: true, order: 3 },
  { name: "FastAPI",     iconType: "devicon", iconValue: "devicon-fastapi-plain colored",    categoryId: "frameworks", proficiency: 4, published: true, order: 4 },
  { name: "Flutter",     iconType: "devicon", iconValue: "devicon-flutter-plain colored",    categoryId: "frameworks", proficiency: 3, published: true, order: 5 },
  { name: "TailwindCSS", iconType: "devicon", iconValue: "devicon-tailwindcss-plain colored",categoryId: "frameworks", proficiency: 5, published: true, order: 6 },
  // DevOps & Cloud
  { name: "Docker",      iconType: "devicon", iconValue: "devicon-docker-plain colored",     categoryId: "devops", proficiency: 5, published: true, order: 1 },
  { name: "Linux",       iconType: "devicon", iconValue: "devicon-linux-plain",              categoryId: "devops", proficiency: 5, published: true, order: 2 },
  { name: "AWS",         iconType: "devicon", iconValue: "devicon-amazonwebservices-plain-wordmark colored", categoryId: "devops", proficiency: 3, published: true, order: 3 },
  { name: "Nginx",       iconType: "devicon", iconValue: "devicon-nginx-original colored",   categoryId: "devops", proficiency: 4, published: true, order: 4 },
  { name: "GitHub",      iconType: "devicon", iconValue: "devicon-github-original",          categoryId: "devops", proficiency: 5, published: true, order: 5 },
  { name: "Ansible",     iconType: "devicon", iconValue: "devicon-ansible-plain colored",   categoryId: "devops", proficiency: 3, published: true, order: 6 },
  // Databases
  { name: "PostgreSQL",  iconType: "devicon", iconValue: "devicon-postgresql-plain colored", categoryId: "databases", proficiency: 4, published: true, order: 1 },
  { name: "MySQL",       iconType: "devicon", iconValue: "devicon-mysql-plain colored",      categoryId: "databases", proficiency: 4, published: true, order: 2 },
  { name: "MongoDB",     iconType: "devicon", iconValue: "devicon-mongodb-plain colored",    categoryId: "databases", proficiency: 4, published: true, order: 3 },
  { name: "Redis",       iconType: "devicon", iconValue: "devicon-redis-plain colored",      categoryId: "databases", proficiency: 3, published: true, order: 4 },
  { name: "Firebase",    iconType: "devicon", iconValue: "devicon-firebase-plain colored",   categoryId: "databases", proficiency: 4, published: true, order: 5 },
  // Tools
  { name: "VS Code",     iconType: "devicon", iconValue: "devicon-vscode-plain colored",     categoryId: "tools", proficiency: 5, published: true, order: 1 },
  { name: "Git",         iconType: "devicon", iconValue: "devicon-git-plain colored",        categoryId: "tools", proficiency: 5, published: true, order: 2 },
  { name: "Postman",     iconType: "devicon", iconValue: "devicon-postman-plain colored",    categoryId: "tools", proficiency: 4, published: true, order: 3 },
  { name: "Figma",       iconType: "devicon", iconValue: "devicon-figma-plain colored",      categoryId: "tools", proficiency: 3, published: true, order: 4 },
  // Security
  { name: "Wireshark",   iconType: "emoji",   iconValue: "🦈",                              categoryId: "security", proficiency: 4, published: true, order: 1 },
  { name: "Nmap",        iconType: "emoji",   iconValue: "🔍",                              categoryId: "security", proficiency: 4, published: true, order: 2 },
  { name: "Metasploit",  iconType: "emoji",   iconValue: "💀",                              categoryId: "security", proficiency: 3, published: true, order: 3 },
  { name: "OpenVPN",     iconType: "emoji",   iconValue: "🔐",                              categoryId: "security", proficiency: 4, published: true, order: 4 },
];
