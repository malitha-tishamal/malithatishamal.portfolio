import { Inter } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import Aoscompo from "@/utils/aos";
import NextTopLoader from "nextjs-toploader";
import SessionProviderComp from "@/components/nextauth/SessionProvider";
import { AuthDialogProvider } from "./context/AuthDialogContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Malitha Tishamal – Full Stack Developer & DevOps Engineer | AI & Cybersecurity Specialist",
  description: "Personal Portfolio & Professional Showcase of Malitha Tishamal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextTopLoader />
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
      </body>
    </html>
  );
}