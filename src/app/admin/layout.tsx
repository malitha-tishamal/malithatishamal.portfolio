"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, isAdmin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Admin";
  const userPhoto = userProfile?.photoURL || user?.photoURL;
  const userRole = userProfile?.role || (isAdmin ? "admin" : "user");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode text-dark dark:text-white transition-colors">
      <Toaster position="top-right" />
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-darklight/95 backdrop-blur-md border-b border-border dark:border-dark_border shadow-xs">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition flex items-center gap-1"
            >
              <span>←</span>
              <span className="hidden xs:inline">Back to Website</span>
              <span className="xs:hidden">Website</span>
            </Link>

            {/* Theme toggler */}
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition cursor-pointer"
            >
              <svg
                viewBox="0 0 16 16"
                className="hidden h-5 w-5 dark:block text-white"
              >
                <path
                  d="M4.50663 3.2267L3.30663 2.03337L2.36663 2.97337L3.55996 4.1667L4.50663 3.2267ZM2.66663 7.00003H0.666626V8.33337H2.66663V7.00003ZM8.66663 0.366699H7.33329V2.33337H8.66663V0.366699V0.366699ZM13.6333 2.97337L12.6933 2.03337L11.5 3.2267L12.44 4.1667L13.6333 2.97337ZM11.4933 12.1067L12.6866 13.3067L13.6266 12.3667L12.4266 11.1734L11.4933 12.1067ZM13.3333 7.00003V8.33337H15.3333V7.00003H13.3333ZM7.99996 3.6667C5.79329 3.6667 3.99996 5.46003 3.99996 7.6667C3.99996 9.87337 5.79329 11.6667 7.99996 11.6667C10.2066 11.6667 12 9.87337 12 7.6667C12 5.46003 10.2066 3.6667 7.99996 3.6667ZM7.33329 14.9667H8.66663V13H7.33329V14.9667ZM2.36663 12.36L3.30663 13.3L4.49996 12.1L3.55996 11.16L2.36663 12.36Z"
                  fill="currentColor"
                />
              </svg>
              <svg
                viewBox="0 0 23 23"
                className="h-6 w-6 text-dark dark:hidden"
              >
                <path
                  d="M16.6111 15.855C17.591 15.1394 18.3151 14.1979 18.7723 13.1623C16.4824 13.4065 14.1342 12.4631 12.6795 10.4711C11.2248 8.47905 11.0409 5.95516 11.9705 3.84818C10.8449 3.9685 9.72768 4.37162 8.74781 5.08719C5.7759 7.25747 5.12529 11.4308 7.29558 14.4028C9.46586 17.3747 13.6392 18.0253 16.6111 15.855Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <div className="h-6 w-px bg-border dark:bg-dark_border hidden sm:block"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-dark dark:text-white truncate max-w-[140px]">
                  {userName}
                </p>
                <p className="text-gray-400 capitalize">{userRole}</p>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
