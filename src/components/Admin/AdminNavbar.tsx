"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import Logo from "@/components/Layout/Header/Logo";
import { UserProfile } from "@/context/AuthContext";
import { AdminTab } from "./AdminSidebar";

interface AdminNavbarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  userProfile: UserProfile | null;
  pendingCount: number;
  onSignOut: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  userProfile,
  pendingCount,
  onSignOut,
}) => {
  const { theme, setTheme } = useTheme();

  const userName = userProfile?.name || userProfile?.email?.split("@")[0] || "Admin";
  const userPhoto = userProfile?.photoURL;
  const userRole = userProfile?.role || "Admin";

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-darklight/95 backdrop-blur-md border-b border-border dark:border-dark_border shadow-xs transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Hamburger + Logo & Badges */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
            aria-label="Toggle Navigation Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <Logo href="/admin" />
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Admin Panel
            </span>
          </div>

          {/* Breadcrumb / Active Tab Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 pl-2 border-l border-border dark:border-dark_border">
            <span>Section:</span>
            <span className="font-bold text-dark dark:text-white capitalize">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "accounts" && "Account Management"}
              {activeTab === "roles" && "Roles & Permissions"}
              {activeTab === "hero" && "Hero Section Manager"}
              {activeTab === "certifications" && "Certifications Manager"}
              {activeTab === "portfolio" && "Portfolio Manager"}
              {activeTab === "projects" && "Projects Manager"}
              {activeTab === "testimonials" && "Testimonials Manager"}
              {activeTab === "blogs" && "Blog & News Manager"}
              {activeTab === "footer" && "Footer Manager"}
              {activeTab === "visitors" && "Visitor Analytics"}
            </span>
          </div>
        </div>

        {/* Center / Quick Tab Pills */}
        <div className="hidden lg:flex items-center bg-gray-100 dark:bg-darkmode p-1 rounded-xl border border-border/40 dark:border-dark_border/40">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "accounts"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Accounts</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "roles"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setActiveTab("hero")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "hero"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Hero</span>
          </button>
          <button
            onClick={() => setActiveTab("certifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "certifications"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Certifications</span>
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "portfolio"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Portfolio</span>
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">✦</span>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "projects"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Projects</span>
          </button>
          <button
            onClick={() => setActiveTab("testimonials")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "testimonials"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Testimonials</span>
          </button>
          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "blogs"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Blog & News</span>
          </button>
          <button
            onClick={() => setActiveTab("footer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "footer"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Footer</span>
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "visitors"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Analytics</span>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">📊</span>
          </button>
          <button
            onClick={() => setActiveTab("advancedAnalytics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === "advancedAnalytics"
                ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>Advanced</span>
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">📈</span>
          </button>
        </div>

        {/* Right Side: Back to Website, Theme Toggle, User Chip, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition flex items-center gap-1"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back to Website</span>
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

          {/* User Avatar & Name */}
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
            <div className="hidden xl:block text-left text-xs">
              <p className="font-semibold text-dark dark:text-white truncate max-w-[130px]">
                {userName}
              </p>
              <p className="text-gray-400 capitalize">{userRole}</p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
