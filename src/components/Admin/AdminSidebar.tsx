"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Layout/Header/Logo";
import { UserProfile } from "@/context/AuthContext";

export type AdminTab = "overview" | "accounts" | "roles" | "hero" | "experience" | "certifications" | "portfolio" | "projects" | "testimonials" | "blogs" | "footer";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  pendingCount: number;
  totalUsersCount: number;
  userProfile: UserProfile | null;
  onSignOut: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  pendingCount,
  totalUsersCount,
  userProfile,
  onSignOut,
}) => {
  const navItems = [
    {
      id: "overview" as AdminTab,
      label: "Dashboard Overview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      badge: null,
    },
    {
      id: "accounts" as AdminTab,
      label: "Account Management",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: pendingCount > 0 ? (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
          {pendingCount}
        </span>
      ) : (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-darkmode text-gray-600 dark:text-gray-400">
          {totalUsersCount}
        </span>
      ),
    },
    {
      id: "roles" as AdminTab,
      label: "Roles & Permissions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      badge: null,
    },
    {
      id: "hero" as AdminTab,
      label: "Hero Section Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20">
          HERO
        </span>
      ),
    },
    {
      id: "experience" as AdminTab,
      label: "Experience & Education",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          EXP
        </span>
      ),
    },
    {
      id: "certifications" as AdminTab,
      label: "Certifications Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          CERTS
        </span>
      ),
    },
    {
      id: "portfolio" as AdminTab,
      label: "Portfolio Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          PRO
        </span>
      ),
    },
    {
      id: "projects" as AdminTab,
      label: "Projects Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          CODE
        </span>
      ),
    },
    {
      id: "testimonials" as AdminTab,
      label: "Testimonials Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          REVIEWS
        </span>
      ),
    },
    {
      id: "blogs" as AdminTab,
      label: "Blog & News Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          NEWS
        </span>
      ),
    },
    {
      id: "footer" as AdminTab,
      label: "Footer Manager",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      badge: (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          FOOTER
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-darklight border-r border-border dark:border-dark_border shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border dark:border-dark_border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo href="/admin" />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Admin
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-darkmode dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer text-left ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode/70 hover:text-dark dark:hover:text-white"
                }`}
              >
                <span className={isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.badge}
              </button>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Quick Actions
          </div>

          <Link
            href="/"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode/70 transition"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Website</span>
          </Link>
        </div>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-border dark:border-dark_border bg-gray-50/50 dark:bg-darkmode/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {(userProfile?.name || userProfile?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-dark dark:text-white truncate">
                {userProfile?.name || userProfile?.email?.split("@")[0] || "Administrator"}
              </p>
              <p className="text-[11px] text-gray-400 truncate capitalize">
                {userProfile?.role || "Super Admin"}
              </p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white border border-red-500/30 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
