"use client";

import React from "react";
import { UserProfile } from "@/context/AuthContext";
import { AdminTab } from "./AdminSidebar";

interface DashboardOverviewProps {
  users: UserProfile[];
  loading: boolean;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  adminCount: number;
  actionLoadingId: string | null;
  onApprove: (uid: string, name: string) => void;
  onReject: (uid: string, name: string) => void;
  onNavigateTab: (tab: AdminTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  users,
  loading,
  totalCount,
  pendingCount,
  approvedCount,
  adminCount,
  actionLoadingId,
  onApprove,
  onReject,
  onNavigateTab,
}) => {
  const pendingUsers = users.filter((u) => u.status === "pending" || (!u.isApproved && u.status !== "rejected"));
  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time platform metrics, account approvals, and administration overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Firestore Connected
          </span>
          <button
            onClick={() => onNavigateTab("accounts")}
            className="px-3.5 py-1.5 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Manage Accounts</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className="bg-white dark:bg-darklight p-5 rounded-2xl border border-border dark:border-dark_border shadow-xs hover:border-primary/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Users
            </p>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              👥
            </div>
          </div>
          <p className="text-3xl font-extrabold text-dark dark:text-white mt-3">
            {totalCount}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
            <span>All registered accounts</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </p>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className={`p-5 rounded-2xl border shadow-xs transition cursor-pointer group ${
            pendingCount > 0
              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/40 hover:border-amber-500"
              : "bg-white dark:bg-darklight border-border dark:border-dark_border hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Approvals
            </p>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-2">
            <span>{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                Action Required
              </span>
            )}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 flex items-center justify-between">
            <span>Requires admin action</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Review →</span>
          </p>
        </div>

        {/* Approved Accounts */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className="bg-white dark:bg-darklight p-5 rounded-2xl border border-border dark:border-dark_border shadow-xs hover:border-green-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Approved Accounts
            </p>
            <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              ✓
            </div>
          </div>
          <p className="text-3xl font-extrabold text-dark dark:text-white mt-3">
            {approvedCount}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
            <span>Active authorized users</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </p>
        </div>

        {/* Administrators */}
        <div
          onClick={() => onNavigateTab("accounts")}
          className="bg-white dark:bg-darklight p-5 rounded-2xl border border-border dark:border-dark_border shadow-xs hover:border-purple-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administrators
            </p>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              🛡️
            </div>
          </div>
          <p className="text-3xl font-extrabold text-dark dark:text-white mt-3">
            {adminCount}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
            <span>Full control access</span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </p>
        </div>
      </div>

      {/* Pending Approvals Quick Action Box */}
      {pendingCount > 0 && (
        <div className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-lg font-bold text-dark dark:text-white">
                Pending Approval Queue ({pendingCount})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("accounts")}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View full accounts table</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUsers.slice(0, 6).map((u) => {
              const isItemLoading = actionLoadingId === u.uid;
              return (
                <div
                  key={u.uid}
                  className="bg-white dark:bg-darklight p-4 rounded-xl border border-border/80 dark:border-dark_border shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                      {(u.name || u.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-dark dark:text-white truncate">
                        {u.name || "Unnamed User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded-xs bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300">
                          {u.provider || "email"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "New"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/40 dark:border-dark_border/40">
                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => onApprove(u.uid, u.name)}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 text-center"
                    >
                      {isItemLoading ? "..." : "✓ Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => onReject(u.uid, u.name)}
                      className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/30 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent User Registrations */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border dark:border-dark_border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark dark:text-white">
              Recent Registrations
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Latest accounts created on the platform.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("accounts")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All accounts</span>
            <span>→</span>
          </button>
        </div>

        <div className="divide-y divide-border dark:divide-dark_border">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Loading recent users...
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No user accounts found.
            </div>
          ) : (
            recentUsers.map((u) => {
              const isApproved = u.status === "approved" || u.isApproved;
              const isPending = u.status === "pending" || (!u.isApproved && u.status !== "rejected");
              const isRejected = u.status === "rejected";

              return (
                <div key={u.uid} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-darkmode/30 transition">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {(u.name || u.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-dark dark:text-white truncate">
                        {u.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block capitalize px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300">
                      {u.provider || "password"}
                    </span>

                    {isPending && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        ✓ Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        ✕ Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
