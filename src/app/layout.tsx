import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import Aoscompo from "@/utils/aos";
import NextTopLoader from "nextjs-toploader";
import { AuthDialogProvider } from "./context/AuthDialogContext";
import { AuthProvider } from "@/context/AuthContext";
import { StructuredData } from "@/components/SEO/StructuredData";
import VisitorTracker from "@/components/VisitorTracker";
import { AdvancedAnalyticsTracker } from "@/components/AdvancedAnalyticsTracker";
import { SectionTracker } from "@/components/SectionTracker";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.vercel.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Malitha Tishamal – Expert Software Developer, DevOps Engineer & Network Specialist",
    template: "%s | Malitha Tishamal",
  },
  description:
    "Industry-leading software development and network engineering by Malitha Tishamal. Expert in full-stack development, DevOps, AI, cybersecurity, cloud infrastructure, and enterprise software solutions. Transform your business with cutting-edge technology.",
  keywords: [
    "Malitha Tishamal",
    "Malitha",
    "Tishamal",
    "Software Developer",
    "Software Engineer",
    "Software Engineering",
    "Full Stack Developer",
    "Full Stack Developer Sri Lanka",
    "Web Developer",
    "Web Development",
    "Software Development Company",
    "Software Development Services",
    "Computer Networking",
    "Network Engineer",
    "Network Specialist",
    "Networking Solutions",
    "Network Architecture",
    "DevOps Engineer",
    "DevOps Services",
    "CI/CD Pipeline",
    "Cloud Infrastructure",
    "Cloud Computing",
    "AWS Developer",
    "Azure Developer",
    "Google Cloud Developer",
    "Docker Kubernetes",
    "Container Orchestration",
    "AI Developer",
    "Artificial Intelligence",
    "Machine Learning",
    "AI Solutions",
    "Cybersecurity Specialist",
    "Network Security",
    "Penetration Testing",
    "Security Audits",
    "Linux Systems Administrator",
    "Server Administration",
    "System Architecture",
    "Enterprise Software",
    "Custom Software Development",
    "Python Developer",
    "React Developer",
    "Next.js Developer",
    "TypeScript Developer",
    "JavaScript Developer",
    "Node.js Developer",
    "Database Engineer",
    "PostgreSQL Developer",
    "MongoDB Developer",
    "API Development",
    "RESTful APIs",
    "GraphQL",
    "Microservices Architecture",
    "Software Consultant",
    "Technology Consultant",
    "IT Solutions",
    "Digital Transformation",
    "Software Project Management",
    "Agile Development",
    "Scrum Master",
    "Technical Lead",
    "Solutions Architect"
  ],
  authors: [{ name: "Malitha Tishamal", url: siteUrl }],
  creator: "Malitha Tishamal",
  publisher: "Malitha Tishamal",
  applicationName: "Malitha Tishamal Portfolio",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Malitha Tishamal – Expert Software Developer, DevOps Engineer & Network Specialist",
    description:
      "Industry-leading software development and network engineering services. Expert in full-stack development, DevOps, AI, cybersecurity, and cloud infrastructure solutions for businesses.",
    siteName: "Malitha Tishamal Portfolio",
    images: [
      {
        url: "/images/hero/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Malitha Tishamal – Expert Software Developer & Network Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malitha Tishamal – Expert Software Developer, DevOps Engineer & Network Specialist",
    description:
      "Industry-leading software development and network engineering. Expert in full-stack development, DevOps, AI, cybersecurity, and cloud infrastructure.",
    creator: "@malithatishamal",
    images: ["/images/hero/hero-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  category: "technology",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
        <StructuredData siteUrl={siteUrl} />
      </head>
      <body className={inter.className}>
        <NextTopLoader color="#0a66c2" showSpinner={false} />
        <AuthProvider>
          <AuthDialogProvider>
            <ThemeProvider
              attribute="class"
              enableSystem={true}
              defaultTheme="system"
            >
              <Aoscompo>
                <VisitorTracker />
                <AdvancedAnalyticsTracker />
                <SectionTracker />
                <Header />
                {children}
                <Footer />
              </Aoscompo>
              <ScrollToTop />
              <Toaster position="top-center" reverseOrder={false} />
            </ThemeProvider>
          </AuthDialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
