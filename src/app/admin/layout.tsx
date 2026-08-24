"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin || !isApproved) {
        router.push("/");
      }
    }
  }, [user, userProfile, loading, isAdmin, isApproved, router]);

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

  if (!user || !isAdmin || !isApproved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode text-dark dark:text-white transition-colors">
      <Toaster position="top-right" />
      {children}
    </div>
  );
}
