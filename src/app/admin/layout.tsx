"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode text-dark dark:text-white transition-colors">
      <Toaster position="top-right" />
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white dark:bg-darklight border-b border-border dark:border-dark_border shadow-xs">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo />
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Admin Panel
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition"
            >
              ← Back to Website
            </Link>

            <div className="h-6 w-px bg-border dark:bg-dark_border hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {(userProfile?.name || user.email || "A").charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-dark dark:text-white truncate max-w-[140px]">
                  {userProfile?.name || user.displayName || user.email?.split("@")[0]}
                </p>
                <p className="text-gray-400 capitalize">{userProfile?.role || "Admin"}</p>
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
