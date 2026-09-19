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
import { AdminSidebar, AdminTab } from "@/components/Admin/AdminSidebar";
import { AdminNavbar } from "@/components/Admin/AdminNavbar";
import { DashboardOverview } from "@/components/Admin/DashboardOverview";
import { AccountManagementTab } from "@/components/Admin/AccountManagementTab";
import { RolesPermissionsTab } from "@/components/Admin/RolesPermissionsTab";
import { HeroSectionManager } from "@/components/Admin/HeroSectionManager";
import { CounterManager } from "@/components/Admin/CounterManager";
import { ServicesManager } from "@/components/Admin/ServicesManager";
import { TechStackManager } from "@/components/Admin/TechStackManager";
import { ExperienceManager } from "@/components/Admin/ExperienceManager";
import { CertificationsManager } from "@/components/Admin/CertificationsManager";
import { PortfolioSectionManager } from "@/components/Admin/PortfolioSectionManager";
import { ProjectsSectionManager } from "@/components/Admin/ProjectsSectionManager";
import { TestimonialsManager } from "@/components/Admin/TestimonialsManager";
import { BlogManager } from "@/components/Admin/BlogManager";
import { ContactManager } from "@/components/Admin/ContactManager";
import { FooterManager } from "@/components/Admin/FooterManager";
import { VisitorAnalytics } from "@/components/Admin/VisitorAnalytics";

export default function AdminDashboardPage() {
  const { user, userProfile, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [unreadInquiriesCount, setUnreadInquiriesCount] = useState<number>(0);

  // Subscribe to real-time inquiries for unread badge count
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "inquiries"), (snapshot) => {
        let count = 0;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.status === "new" || !d.status) {
            count++;
          }
        });
        setUnreadInquiriesCount(count);
      });
      return () => unsub();
    } catch (e) {
      console.error("Error setting up inquiries counter listener:", e);
    }
  }, []);

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
          // Fallback if index not created
          const fallbackUnsub = onSnapshot(
            collection(db, "users"),
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
            (fallbackErr) => {
              console.error("Firestore fallback users listener error:", fallbackErr);
              setLoading(false);
            }
          );
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

  // Statistics
  const totalCount = users.length;
  const pendingCount = users.filter((u) => u.status === "pending" || (!u.isApproved && u.status !== "rejected")).length;
  const approvedCount = users.filter((u) => u.status === "approved" || u.isApproved).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkmode">
      {/* Top Navbar */}
      <AdminNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        userProfile={userProfile}
        pendingCount={pendingCount}
        onSignOut={logout}
      />

      <div className="flex">
        {/* Slide-out / Collapsible Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          pendingCount={pendingCount}
          totalUsersCount={totalCount}
          unreadInquiriesCount={unreadInquiriesCount}
          userProfile={userProfile}
          onSignOut={logout}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 lg:pl-72 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
          {/* Tab 1: Dashboard Overview */}
          {activeTab === "overview" && (
            <DashboardOverview
              users={users}
              loading={loading}
              totalCount={totalCount}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              adminCount={adminCount}
              actionLoadingId={actionLoadingId}
              onApprove={handleApproveUser}
              onReject={handleRejectUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Tab 2: Account Management */}
          {activeTab === "accounts" && (
            <AccountManagementTab
              users={users}
              loading={loading}
              currentUser={user}
              totalCount={totalCount}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              adminCount={adminCount}
              actionLoadingId={actionLoadingId}
              onApprove={handleApproveUser}
              onReject={handleRejectUser}
              onToggleRole={handleToggleRole}
              onDelete={handleDeleteUser}
            />
          )}

          {/* Tab 3: Roles & Permissions */}
          {activeTab === "roles" && (
            <RolesPermissionsTab
              users={users}
              adminCount={adminCount}
              approvedCount={approvedCount}
            />
          )}

          {/* Tab 4: Hero Section Manager */}
          {activeTab === "hero" && (
            <HeroSectionManager />
          )}

          {/* Tab: Stats & Counter Manager */}
          {activeTab === "counter" && (
            <CounterManager />
          )}

          {/* Tab: Services & Capabilities Manager */}
          {activeTab === "services" && (
            <ServicesManager />
          )}

          {/* Tab: Tech Stack & Skills Manager */}
          {activeTab === "techstack" && (
            <TechStackManager />
          )}

          {/* Tab: Experience & Education Manager */}
          {activeTab === "experience" && (
            <ExperienceManager />
          )}

          {/* Tab 5: Certifications Manager */}
          {activeTab === "certifications" && (
            <CertificationsManager />
          )}

          {/* Tab 6: Portfolio Section Manager */}
          {activeTab === "portfolio" && (
            <PortfolioSectionManager />
          )}

          {/* Tab 6: Projects Section Manager */}
          {activeTab === "projects" && (
            <ProjectsSectionManager />
          )}

          {/* Tab 7: Testimonials Manager */}
          {activeTab === "testimonials" && (
            <TestimonialsManager />
          )}

          {/* Tab 8: Blog & News Manager */}
          {activeTab === "blogs" && (
            <BlogManager />
          )}

          {/* Tab 9: Contact & Inquiries Manager */}
          {activeTab === "contact" && (
            <ContactManager />
          )}

          {/* Tab 10: Footer Manager */}
          {activeTab === "footer" && (
            <FooterManager />
          )}

          {/* Tab 11: Visitor Analytics */}
          {activeTab === "visitors" && (
            <VisitorAnalytics />
          )}
        </main>
      </div>
    </div>
  );
}
