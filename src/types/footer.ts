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
  { label: 'About',        href: '/#about',       enabled: true },
  { label: 'Services',     href: '/#services',    enabled: true },
  { label: 'Portfolio',    href: '/portfolio',    enabled: true },
  { label: 'Projects',     href: '/projects',     enabled: true },
  { label: 'Testimonials', href: '/testimonials', enabled: true },
  { label: 'Blog',         href: '/blog',         enabled: true },
  { label: 'Contact',      href: '/contact',      enabled: true },
];

export const defaultFooterContent: FooterContent = {
  tagline: 'Ready to get started?',
  ctaLabel: 'Get Started',
  ctaHref: '/#contact',
  supportTitle: 'Support',
  phone: '+94 XX XXX XXXX',
  phoneHref: 'tel:+94XXXXXXXXX',
  email: 'hello@malithatishamal.com',
  emailHref: 'mailto:hello@malithatishamal.com',
  socialLinks: DEFAULT_SOCIAL_LINKS,
  newsletterTitle: 'Subscribe newsletter',
  newsletterSubtitle: 'Stay updated with all the latest trends and updates.',
  navLinks: DEFAULT_NAV_LINKS,
  copyright: '(c) 2025 Malitha Tishamal. All rights reserved.',
};
