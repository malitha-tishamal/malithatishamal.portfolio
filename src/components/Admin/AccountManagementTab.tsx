"use client";

import React, { useState } from "react";
import { User } from "firebase/auth";
import { UserProfile } from "@/context/AuthContext";

interface AccountManagementTabProps {
  users: UserProfile[];
  loading: boolean;
  currentUser: User | null;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  adminCount: number;
  actionLoadingId: string | null;
  onApprove: (uid: string, name: string) => void;
  onReject: (uid: string, name: string) => void;
  onToggleRole: (uid: string, currentRole: string, name: string) => void;
  onDelete: (uid: string, name: string) => void;
}

export const AccountManagementTab: React.FC<AccountManagementTabProps> = ({
  users,
  loading,
  currentUser,
  totalCount,
  pendingCount,
  approvedCount,
  adminCount,
  actionLoadingId,
  onApprove,
  onReject,
  onToggleRole,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.uid && u.uid.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return u.status === "pending" || (!u.isApproved && u.status !== "rejected");
    if (filterStatus === "approved") return u.status === "approved" || u.isApproved;
    if (filterStatus === "rejected") return u.status === "rejected";
    if (filterStatus === "admin") return u.role === "admin";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Account Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white flex items-center gap-3">
            <span>Account Management</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and approve pending accounts, suspend access, or assign administrator roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 font-medium">
            Total Accounts: <strong className="text-primary">{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* Account Management Table Card */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        {/* Table Controls (Search & Filter Tabs) */}
        <div className="p-6 border-b border-border dark:border-dark_border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email, or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode pl-10 pr-8 py-2 text-sm text-dark dark:text-white placeholder:text-gray-400 focus:border-primary focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center bg-gray-100 dark:bg-darkmode p-1 rounded-xl border border-border/50 dark:border-dark_border/50 overflow-x-auto">
              {[
                { key: "all", label: `All (${totalCount})` },
                { key: "pending", label: `Pending (${pendingCount})` },
                { key: "approved", label: `Approved (${approvedCount})` },
                { key: "rejected", label: "Rejected" },
                { key: "admin", label: `Admins (${adminCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    filterStatus === tab.key
                      ? "bg-white dark:bg-darklight text-primary shadow-xs font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Loading user accounts from Firestore...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm space-y-2">
              <p className="text-base font-semibold text-dark dark:text-white">
                No matching accounts found
              </p>
              <p className="text-xs">
                Try adjusting your search query or filter criteria.
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-xs text-primary underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 dark:bg-darkmode/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-border dark:border-dark_border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-dark_border">
                {filteredUsers.map((u) => {
                  const isCurrentLoggedUser = currentUser?.uid === u.uid;
                  const isPending = u.status === "pending" || (!u.isApproved && u.status !== "rejected");
                  const isApproved = u.status === "approved" || u.isApproved;
                  const isRejected = u.status === "rejected";
                  const isItemLoading = actionLoadingId === u.uid;

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-gray-50/50 dark:hover:bg-darkmode/30 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-dark dark:text-white flex items-center gap-1.5">
                              <span>{u.name || "Unnamed"}</span>
                              {isCurrentLoggedUser && (
                                <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.2 rounded-sm font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-darkmode text-gray-700 dark:text-gray-300 border border-border/50 dark:border-dark_border/50">
                          {u.provider || "password"}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            u.role === "admin"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {(u.role || "user").toUpperCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            ✓ Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            ✕ Rejected
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString()
                          : "Recently"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button */}
                          {!isApproved && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onApprove(u.uid, u.name)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject Button */}
                          {!isRejected && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => onReject(u.uid, u.name)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/30 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}

                          {/* Toggle Admin Role */}
                          <button
                            type="button"
                            disabled={isItemLoading || isCurrentLoggedUser}
                            onClick={() => onToggleRole(u.uid, u.role || "user", u.name)}
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-darkmode hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40"
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isItemLoading || isCurrentLoggedUser}
                            onClick={() => onDelete(u.uid, u.name)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer disabled:opacity-40"
                            title="Delete User Record"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
