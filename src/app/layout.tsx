import { Inter } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from '@/components/ScrollToTop';
import Aoscompo from "@/utils/aos";
import NextTopLoader from 'nextjs-toploader';
import SessionProviderComp from "@/components/nextauth/SessionProvider";
import { AuthDialogProvider } from "./context/AuthDialogContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Malitha Tishamal – Full Stack Developer & DevOps Engineer | AI & Cybersecurity Specialist",
  description: "Portfolio of Malitha Tishamal - Full Stack Developer, DevOps Engineer, AI & Cybersecurity Specialist",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
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
      </head>
      <body className={inter.className}>
        <NextTopLoader />
        <AuthProvider>
          <AuthDialogProvider>
            <SessionProviderComp>
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
            </SessionProviderComp>
          </AuthDialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
