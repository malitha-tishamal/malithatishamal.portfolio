export type TestimonialStatus = "approved" | "pending" | "rejected";

export interface TestimonialItem {
  id: string;
  name: string;
  role: string; // e.g. Owner, Software Architect, Maths Teacher
  company?: string; // e.g. Dimu Tour & Travel, Apple Inc
  content: string; // Review / Testimonial text
  rating: number; // 1 to 5 stars
  avatarUrl?: string; // Cloudinary photo URL or local avatar
  status: TestimonialStatus; // approved | pending | rejected
  featured?: boolean;
  displayOrder: number;
  createdAt: any;
  updatedAt?: any;
}

export const defaultTestimonials: TestimonialItem[] = [
  {
    id: "dimuthu-weerasinghe",
    name: "Dimuthu Weerasinghe",
    role: "Owner – Dimu Tour & Travel | Maths Teacher | Private Classes",
    company: "Dimu Tour & Travel",
    content:
      "Hi Malitha, I just wanted to take a moment to sincerely thank you for the amazing work you did on my website for Dimu Tour & Travel. You understood exactly what I needed and delivered it in a very attractive and professional way, and that too in such a short time. I truly appreciate your creativity, effort, and dedication. The website looks exactly how I imagined it – even better! I'm really happy with your service and would highly recommend you to anyone looking for quality web design. Thank you again for your great work!",
    rating: 5,
    avatarUrl: "/images/hero/malitha-hero.png",
    status: "approved",
    featured: true,
    displayOrder: 1,
    createdAt: "2026-08-10",
    updatedAt: "2026-08-25",
  },
  {
    id: "kasun-perera",
    name: "Kasun Perera",
    role: "Tech Lead & Solutions Architect",
    company: "InnovateX Solutions",
    content:
      "Malitha's expertise in Full Stack Development and DevOps is outstanding. He orchestrated our entire CI/CD pipeline and cloud infrastructure with zero downtime. Exceptional communication and technical mastery throughout our collaboration.",
    rating: 5,
    avatarUrl: "",
    status: "approved",
    featured: true,
    displayOrder: 2,
    createdAt: "2026-08-15",
    updatedAt: "2026-08-25",
  },
  {
    id: "sanduni-fernando",
    name: "Sanduni Fernando",
    role: "Founder & Creative Director",
    company: "Aura Creative Studio",
    content:
      "Working with Malitha was a breeze. He translated our complex design specifications into pixel-perfect, hyper-responsive web applications. His attention to performance, UI details, and security is remarkable.",
    rating: 5,
    avatarUrl: "",
    status: "approved",
    featured: true,
    displayOrder: 3,
    createdAt: "2026-08-20",
    updatedAt: "2026-08-25",
  },
];
