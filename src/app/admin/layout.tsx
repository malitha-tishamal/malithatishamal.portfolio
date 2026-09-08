"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Common/Loader";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, isAdmin, isApproved } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            Checking admin credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Not Signed In</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You need to sign in to access the admin panel.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
          >
            Go to Homepage and Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin || !isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-dark dark:text-white mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your account does not have admin privileges.
          </p>
          <div className="text-xs bg-gray-100 dark:bg-darkmode rounded-lg p-3 mb-5 text-left space-y-1 border border-gray-200 dark:border-dark_border">
            <p><span className="font-semibold">Email:</span> {userProfile?.email || user.email}</p>
            <p><span className="font-semibold">Role:</span> <span className={userProfile?.role === "admin" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{userProfile?.role || "unknown"}</span></p>
            <p><span className="font-semibold">Status:</span> <span className={userProfile?.status === "approved" ? "text-green-600 font-bold" : "text-amber-500 font-bold"}>{userProfile?.status || "unknown"}</span></p>
            <p><span className="font-semibold">isApproved:</span> <span className={userProfile?.isApproved ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{String(userProfile?.isApproved ?? "unknown")}</span></p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 leading-relaxed">
            Firebase Console → Firestore → users → your document → set role: admin, status: approved, isApproved: true
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode text-dark dark:text-white transition-colors">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
