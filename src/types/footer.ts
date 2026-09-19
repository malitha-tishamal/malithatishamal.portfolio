export interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

export interface FooterNavLink {
  label: string;
  href: string;
  enabled: boolean;
}

export interface FooterContent {
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  supportTitle: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  socialLinks: SocialLink[];
  newsletterTitle: string;
  newsletterSubtitle: string;
  navLinks: FooterNavLink[];
  copyright: string;

  // Dynamic Copyright Settings
  copyrightMode?: "auto" | "custom"; // "auto" uses current year dynamically, "custom" uses manual text
  copyrightOwnerName?: string; // e.g. "Malitha Tishamal"
  copyrightSuffix?: string; // e.g. "All rights reserved."
  customCopyrightText?: string; // e.g. "© 2024-2026 Malitha Tishamal. All rights reserved."

  // Color Theme & Customization
  colorPreset?: "default" | "pitch_black" | "midnight_slate" | "charcoal" | "custom";
  bgColor?: string; // Footer background (default: #0b1120 or darkmode)
  textColor?: string; // Main headings and text (default: #ffffff)
  subTextColor?: string; // Muted subtext & labels (default: #94a3b8)
  accentColor?: string; // Primary buttons & hover accents (default: #0a66c2)
  borderColor?: string; // Separator borders (default: #1e293b)

  // Visitor Counter
  showVisitorCount?: boolean;
  visitorCountLabel?: string;
  visitorCountBase?: number;

  // Newsletter Email Notification Settings
  newsletterNotificationEmail?: string; // Email to receive subscription notifications
  enableNewsletterNotifications?: boolean; // Enable/disable email notifications
  
  // Gmail SMTP Configuration for Email Notifications
  gmailSmtpEnabled?: boolean; // Enable Gmail SMTP for email sending
  gmailSmtpUser?: string; // Gmail address for SMTP (sender)
  gmailSmtpAppPassword?: string; // 16-character Google App Password
  gmailNotificationRecipient?: string; // Email to receive notifications
}

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: 'LinkedIn',  url: '#', enabled: true  },
  { platform: 'GitHub',    url: '#', enabled: true  },
  { platform: 'Instagram', url: '#', enabled: true  },
  { platform: 'Facebook',  url: '#', enabled: true  },
  { platform: 'X',         url: '#', enabled: false },
  { platform: 'WhatsApp',  url: '#', enabled: false },
  { platform: 'YouTube',   url: '#', enabled: false },
];

export const DEFAULT_NAV_LINKS: FooterNavLink[] = [
  { label: 'About',          href: '/#about',          enabled: true },
  { label: 'Services',       href: '/#services',       enabled: true },
  { label: 'Certifications', href: '/certifications',  enabled: true },
  { label: 'Portfolio',      href: '/portfolio',       enabled: true },
  { label: 'Projects',       href: '/projects',        enabled: true },
  { label: 'Testimonials',   href: '/testimonials',    enabled: true },
  { label: 'Blog & News',    href: '/blog',            enabled: true },
  { label: 'Contact',        href: '/contact',         enabled: true },
];

export const defaultFooterContent: FooterContent = {
  tagline: 'Ready to get started?',
  ctaLabel: 'Get Started',
  ctaHref: '/#contact',
  supportTitle: 'Support',
  phone: '+94 785530992',
  phoneHref: 'tel:+94785530992',
  email: 'malithatishamal@gmail.com',
  emailHref: 'mailto:malithatishamal@gmail.com',
  socialLinks: DEFAULT_SOCIAL_LINKS,
  newsletterTitle: 'Subscribe newsletter',
  newsletterSubtitle: 'Stay updated with all the latest trends and updates.',
  navLinks: DEFAULT_NAV_LINKS,
  copyright: `© ${new Date().getFullYear()} Malitha Tishamal. All rights reserved.`,

  // Dynamic Copyright
  copyrightMode: "auto",
  copyrightOwnerName: "Malitha Tishamal",
  copyrightSuffix: "All rights reserved.",
  customCopyrightText: "",

  // Colors
  colorPreset: "default",
  bgColor: "#0b1120",
  textColor: "#ffffff",
  subTextColor: "rgba(255, 255, 255, 0.5)",
  accentColor: "#0a66c2",
  borderColor: "rgba(255, 255, 255, 0.1)",

  // Visitor Counter
  showVisitorCount: true,
  visitorCountLabel: "Total Visitors",
  visitorCountBase: 1250,

  // Newsletter Email Notification
  newsletterNotificationEmail: 'malithatishamal@gmail.com',
  enableNewsletterNotifications: true,

  // Gmail SMTP Configuration
  gmailSmtpEnabled: false,
  gmailSmtpUser: 'malithatishamal@gmail.com',
  gmailSmtpAppPassword: '',
  gmailNotificationRecipient: 'malithatishamal@gmail.com',
};