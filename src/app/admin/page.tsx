"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserProfile } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Subscribe to real-time users collection from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedUsers: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            fetchedUsers.push({
              ...(docSnap.data() as UserProfile),
              uid: docSnap.id,
            });
          });
          setUsers(fetchedUsers);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore users subscription error:", error);
          // Fallback if index not created or permission error
          const fallbackUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const fetchedUsers: UserProfile[] = [];
            snapshot.forEach((docSnap) => {
              fetchedUsers.push({
                ...(docSnap.data() as UserProfile),
                uid: docSnap.id,
              });
            });
            setUsers(fetchedUsers);
            setLoading(false);
          });
          return () => fallbackUnsub();
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up users listener:", err);
      setLoading(false);
    }
  }, []);

  // Action: Approve User
  const handleApproveUser = async (targetUid: string, targetName: string) => {
    setActionLoadingId(targetUid);
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, {
        status: "approved",
        isApproved: true,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Account for ${targetName || "user"} approved successfully!`);
    } catch (err: any) {
      console.error("Approve user error:", err);
      toast.error(err.message || "Failed to approve user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Reject / Suspend User
  const handleRejectUser = async (targetUid: string, targetName: string) => {
    setActionLoadingId(targetUid);
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, {
        status: "rejected",
        isApproved: false,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Account for ${targetName || "user"} rejected/suspended.`);
    } catch (err: any) {
      console.error("Reject user error:", err);
      toast.error(err.message || "Failed to reject user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Toggle Admin / User Role
  const handleToggleRole = async (targetUid: string, currentRole: string, targetName: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionLoadingId(targetUid);
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      toast.success(`${targetName || "User"} role changed to ${newRole.toUpperCase()}.`);
    } catch (err: any) {
      console.error("Toggle role error:", err);
      toast.error(err.message || "Failed to change role.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Delete User Document
  const handleDeleteUser = async (targetUid: string, targetName: string) => {
    if (!confirm(`Are you sure you want to delete ${targetName || "this user"} from database?`)) {
      return;
    }
    setActionLoadingId(targetUid);
    try {
      await deleteDoc(doc(db, "users", targetUid));
      toast.success("User record deleted from database.");
    } catch (err: any) {
      console.error("Delete user error:", err);
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter and search logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.uid && u.uid.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return u.status === "pending" || !u.isApproved;
    if (filterStatus === "approved") return u.status === "approved" || u.isApproved;
    if (filterStatus === "rejected") return u.status === "rejected";
    if (filterStatus === "admin") return u.role === "admin";
    return true;
  });

  // Calculate statistics
  const totalCount = users.length;
  const pendingCount = users.filter((u) => u.status === "pending" || (!u.isApproved && u.status !== "rejected")).length;
  const approvedCount = users.filter((u) => u.status === "approved" || u.isApproved).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-2xl border border-border/60 dark:border-dark_border shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage user accounts, approve registrations, and control permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Firestore Connected
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-darklight p-5 rounded-xl border border-border dark:border-dark_border shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Users
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              👥
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mt-2">
            {totalCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">All registered accounts</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-darklight p-5 rounded-xl border border-amber-500/30 dark:border-amber-500/20 shadow-xs bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Approvals
            </p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              ⏳
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
            Requires admin action
          </p>
        </div>

        {/* Approved Users */}
        <div className="bg-white dark:bg-darklight p-5 rounded-xl border border-border dark:border-dark_border shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Approved Accounts
            </p>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mt-2">
            {approvedCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Active authorized users</p>
        </div>

        {/* Admins */}
        <div className="bg-white dark:bg-darklight p-5 rounded-xl border border-border dark:border-dark_border shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administrators
            </p>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              🛡️
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white mt-2">
            {adminCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">Full control access</p>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-6 border-b border-border dark:border-dark_border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-dark dark:text-white">
              Account Management
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Review and approve or reject user accounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode px-4 py-2 text-sm text-dark dark:text-white placeholder:text-gray-400 focus:border-primary focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-gray-100 dark:bg-darkmode p-1 rounded-lg border border-border/50 dark:border-dark_border/50 overflow-x-auto">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: `Pending (${pendingCount})` },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
                { key: "admin", label: "Admins" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
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
              Loading users from Firestore...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No user accounts found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 dark:bg-darkmode/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-border dark:border-dark_border">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-dark_border">
                {filteredUsers.map((u) => {
                  const isCurrentLoggedUser = user?.uid === u.uid;
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
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center font-bold text-sm">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-dark dark:text-white flex items-center gap-1.5">
                              {u.name || "Unnamed"}
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

                      {/* Auth Provider */}
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
                              onClick={() => handleApproveUser(u.uid, u.name)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject Button */}
                          {!isRejected && (
                            <button
                              type="button"
                              disabled={isItemLoading}
                              onClick={() => handleRejectUser(u.uid, u.name)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/30 rounded-md text-xs font-medium transition cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}

                          {/* Toggle Admin Role */}
                          <button
                            type="button"
                            disabled={isItemLoading || isCurrentLoggedUser}
                            onClick={() => handleToggleRole(u.uid, u.role || "user", u.name)}
                            title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                            className="px-2.5 py-1.5 bg-gray-100 dark:bg-darkmode hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition cursor-pointer disabled:opacity-40"
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isItemLoading || isCurrentLoggedUser}
                            onClick={() => handleDeleteUser(u.uid, u.name)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition cursor-pointer disabled:opacity-40"
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
}
