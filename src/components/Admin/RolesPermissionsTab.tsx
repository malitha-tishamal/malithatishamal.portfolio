"use client";

import React from "react";
import { UserProfile } from "@/context/AuthContext";

interface RolesPermissionsTabProps {
  users: UserProfile[];
  adminCount: number;
  approvedCount: number;
}

export const RolesPermissionsTab: React.FC<RolesPermissionsTabProps> = ({
  users,
  adminCount,
  approvedCount,
}) => {
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white">
          Roles & Permissions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of platform access levels, permissions matrix, and authorized administrators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Role Card */}
        <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-purple-500/30 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-lg font-bold text-dark dark:text-white">
                Administrator Role
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {adminCount} Active
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Full control permissions across the entire platform.
          </p>

          <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Access Admin Dashboard & Analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Approve and Reject user account registrations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Promote / Demote users to Admin or User roles</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Delete accounts from the database</span>
            </li>
          </ul>
        </div>

        {/* User Role Card */}
        <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-blue-500/30 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <h2 className="text-lg font-bold text-dark dark:text-white">
                Standard User Role
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {approvedCount} Active
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Standard registered and approved member access.
          </p>

          <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Access personalized member profile</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Interact with public portfolio features</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span className="text-gray-400">Cannot access Admin Panel</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500 font-bold">✕</span>
              <span className="text-gray-400">Cannot modify other user accounts</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Authorized Admins List */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border dark:border-dark_border">
          <h2 className="text-lg font-bold text-dark dark:text-white">
            Authorized Administrators ({admins.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Accounts with super administrator privileges.
          </p>
        </div>

        <div className="divide-y divide-border dark:divide-dark_border">
          {admins.map((admin) => (
            <div key={admin.uid} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-sm">
                  {(admin.name || admin.email || "A").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-dark dark:text-white">
                    {admin.name || "Administrator"}
                  </p>
                  <p className="text-xs text-gray-400">{admin.email}</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase">
                ADMIN
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
