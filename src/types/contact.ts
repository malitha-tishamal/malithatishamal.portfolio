export interface ContactPartner {
  name: string;
  logoUrl: string;
  enabled: boolean;
}

export interface ContactSectionContent {
  badgeText: string;
  heading: string;
  phone: string;
  email: string;
  location: string;
  trustedByTitle: string;
  partners: ContactPartner[];
  formHeading: string;
  submitButtonText: string;
  notificationEmail: string;
  termsText: string;
  termsUrl: string;
  updatedAt?: any;
}

export interface ContactInquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  isStarred?: boolean;
  createdAt: any;
  notes?: string;
  replySentAt?: any;
}

export const defaultContactPartners: ContactPartner[] = [
  { name: "Google Pay", logoUrl: "/images/contact/google-pay.png", enabled: true },
  { name: "PayJunction", logoUrl: "/images/contact/play-juction.png", enabled: true },
  { name: "Stripe", logoUrl: "/images/contact/stripe.png", enabled: true },
  { name: "Wise", logoUrl: "/images/contact/wise.png", enabled: true },
];

export const defaultContactContent: ContactSectionContent = {
  badgeText: "build everything",
  heading: "Let’s discuss about your project and take it the next level.",
  phone: "+323-25-8964",
  email: "malithatishamal@gmail.com",
  location: "Mark Avenue, Dalls Road, New York",
  trustedByTitle: "Trusted by",
  partners: defaultContactPartners,
  formHeading: "Start the project",
  submitButtonText: "Submit Inquiry",
  notificationEmail: "malithatishamal@gmail.com",
  termsText: "I have read and acknowledge the Terms and Conditions",
  termsUrl: "#",
};
