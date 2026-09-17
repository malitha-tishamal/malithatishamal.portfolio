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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.com";

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
    default: "Malitha Tishamal – Full Stack Software Developer, DevOps & Network Engineer",
    template: "%s | Malitha Tishamal",
  },
  description:
    "Official portfolio of Malitha Tishamal. Full Stack Software Developer, DevOps Engineer, Computer Network Specialist, and Cybersecurity Practitioner. Explore software architecture, cloud platforms, and engineering achievements.",
  keywords: [
    "Malitha Tishamal",
    "Malitha",
    "Tishamal",
    "Malitha Tishamal Portfolio",
    "Software Developer",
    "Software Engineer",
    "Software Engineering",
    "Computer Networking",
    "Network Engineer",
    "Network Specialist",
    "Networking",
    "DevOps Engineer",
    "Cybersecurity Specialist",
    "Full Stack Developer",
    "Full Stack Developer Sri Lanka",
    "Linux Systems Administrator",
    "Cloud Architecture",
    "Docker Kubernetes DevOps",
    "Python Developer",
    "React Next.js Developer",
    "TypeScript Developer",
    "Database Engineer",
    "Penetration Testing Cybersecurity"
  ],
  authors: [{ name: "Malitha Tishamal", url: siteUrl }],
  creator: "Malitha Tishamal",
  publisher: "Malitha Tishamal",
  applicationName: "Malitha Tishamal Portfolio",
  alternates: {
    canonical: "/",
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
    title: "Malitha Tishamal – Full Stack Developer, DevOps & Network Engineer",
    description:
      "Explore software systems, computer networking topologies, cloud infrastructure, and technical writing by Malitha Tishamal.",
    siteName: "Malitha Tishamal Portfolio",
    images: [
      {
        url: "/images/hero/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Malitha Tishamal – Full Stack Developer & Network Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malitha Tishamal – Full Stack Developer, DevOps & Network Engineer",
    description:
      "Explore software systems, computer networking topologies, and cloud infrastructure by Malitha Tishamal.",
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
                <Header />
                {children}
                <Footer />
              </Aoscompo>
              <ScrollToTop />
            </ThemeProvider>
          </AuthDialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
