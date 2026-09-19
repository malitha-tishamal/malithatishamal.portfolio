"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ContactSectionContent,
  ContactInquiry,
  ContactPartner,
  defaultContactContent,
  defaultContactPartners,
} from "@/types/contact";
import { uploadToCloudinary } from "@/utils/cloudinary";
import toast from "react-hot-toast";

export const ContactManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inquiries" | "settings">("inquiries");

  // Inquiries state
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read" | "replied" | "starred">("all");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [adminNote, setAdminNote] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Settings state
  const [formData, setFormData] = useState<ContactSectionContent>(defaultContactContent);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // New Partner Modal / Form state
  const [isAddingPartner, setIsAddingPartner] = useState<boolean>(false);
  const [newPartnerName, setNewPartnerName] = useState<string>("");
  const [newPartnerLogo, setNewPartnerLogo] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

  // SMTP Email Delivery State
  const [smtpUser, setSmtpUser] = useState<string>("malithatishamal@gmail.com");
  const [smtpPass, setSmtpPass] = useState<string>("");
  const [receiverEmail, setReceiverEmail] = useState<string>("malithatishamal@gmail.com");
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(false);
  const [checkingSmtp, setCheckingSmtp] = useState<boolean>(true);
  const [testingSmtp, setTestingSmtp] = useState<boolean>(false);
  const [savingSmtp, setSavingSmtp] = useState<boolean>(false);
  const [showSmtpPass, setShowSmtpPass] = useState<boolean>(false);
  const [passwordFetchResult, setPasswordFetchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Check SMTP configuration status on load
  useEffect(() => {
    const checkSmtp = async () => {
      try {
        const res = await fetch("/api/contact/smtp-config");
        if (res.ok) {
          const data = await res.json();
          setSmtpConfigured(Boolean(data.configured));
          if (data.smtpUser) setSmtpUser(data.smtpUser);
          if (data.receiverEmail) setReceiverEmail(data.receiverEmail);
        }
      } catch (err) {
        console.warn("Failed to check SMTP status:", err);
      } finally {
        setCheckingSmtp(false);
      }
    };
    checkSmtp();
  }, []);

  // Handle Save / Test SMTP
  const handleSaveSmtp = async (testNow: boolean) => {
    if (!smtpPass.trim() && !smtpConfigured) {
      toast.error("Please enter your 16-character Google App Password.");
      return;
    }

    if (testNow) setTestingSmtp(true);
    else setSavingSmtp(true);

    try {
      // First, save to Firestore
      await setDoc(
        doc(db, "siteContent", "contact"),
        {
          gmailSmtpUser: smtpUser.trim(),
          gmailNotificationRecipient: receiverEmail.trim(),
          gmailSmtpAppPassword: smtpPass.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Then call the API for SMTP configuration/testing
      const res = await fetch("/api/contact/smtp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          receiverEmail: receiverEmail.trim(),
          testNow,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to configure SMTP");
      }

      setSmtpConfigured(true);
      setSmtpPass(""); // Clear password field from UI once saved
      setPasswordSaved(true);
      setPasswordFetchResult({ success: true, message: "✅ Key saved to Firestore successfully!" });
      toast.success(data.message || "SMTP configured successfully!");
      // Reset password saved indicator after 5 seconds
      setTimeout(() => setPasswordSaved(false), 5000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update SMTP settings");
      setPasswordSaved(false);
      setPasswordFetchResult({ success: false, message: "❌ Failed to save password to Firestore" });
    } finally {
      setTestingSmtp(false);
      setSavingSmtp(false);
    }
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    const password = smtpPass.trim();
    if (!password) {
      toast.error('No password to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  // Fetch password from Firestore
  const fetchPasswordFromFirestore = async () => {
    try {
      const snap = await getDoc(doc(db, "siteContent", "contact"));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.gmailSmtpAppPassword) {
          setSmtpPass(data.gmailSmtpAppPassword);
          setPasswordFetchResult({ success: true, message: "✅ Key fetched from Firestore successfully!" });
          toast.success("Password fetched from Firestore!");
        } else {
          setPasswordFetchResult({ success: false, message: "❌ No password found in Firestore" });
          toast.error("No password found in Firestore");
        }
      } else {
        setPasswordFetchResult({ success: false, message: "❌ No contact configuration found in Firestore" });
        toast.error("No contact configuration found");
      }
    } catch (error) {
      console.error('Error fetching password:', error);
      setPasswordFetchResult({ success: false, message: "❌ Failed to fetch password from Firestore" });
      toast.error("Failed to fetch password from Firestore");
    }
  };

  // 1. Subscribe to Inquiries
  useEffect(() => {
    try {
      const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: ContactInquiry[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              ...(docSnap.data() as ContactInquiry),
              id: docSnap.id,
            });
          });
          setInquiries(list);
          setLoadingInquiries(false);
        },
        (err) => {
          console.warn("Inquiries ordered listener notice, falling back:", err);
          // Fallback if index not yet generated
          const unsubFallback = onSnapshot(
            collection(db, "inquiries"),
            (snapshot) => {
              const list: ContactInquiry[] = [];
              snapshot.forEach((docSnap) => {
                list.push({
                  ...(docSnap.data() as ContactInquiry),
                  id: docSnap.id,
                });
              });
              setInquiries(list);
              setLoadingInquiries(false);
            },
            (err2) => {
              console.error("Inquiries fallback error:", err2);
              setLoadingInquiries(false);
            }
          );
          return () => unsubFallback();
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error("Error setting up inquiries listener:", e);
      setLoadingInquiries(false);
    }
  }, []);

  // 2. Fetch Contact Section Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "contact"));
        if (snap.exists()) {
          const data = snap.data() as Partial<ContactSectionContent>;
          setFormData({
            ...defaultContactContent,
            ...data,
            partners: data.partners?.length ? data.partners : defaultContactPartners,
          });
          // Load SMTP settings if available
          if (data.gmailSmtpUser) setSmtpUser(data.gmailSmtpUser);
          if (data.gmailNotificationRecipient) setReceiverEmail(data.gmailNotificationRecipient);
          if (data.gmailSmtpAppPassword) {
            setSmtpPass(data.gmailSmtpAppPassword);
            setSmtpConfigured(true);
          }
        }
      } catch (e) {
        console.error("Error fetching contact settings:", e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, "siteContent", "contact"),
        {
          ...formData,
          gmailSmtpUser: smtpUser,
          gmailNotificationRecipient: receiverEmail,
          gmailSmtpAppPassword: smtpPass || undefined,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Contact section settings saved successfully!");
      if (smtpPass) {
        setPasswordSaved(true);
        setPasswordFetchResult({ success: true, message: "✅ Key fetched from Firestore successfully!" });
        setTimeout(() => setPasswordSaved(false), 5000);
      }
    } catch (err: any) {
      console.error("Error saving contact settings:", err);
      toast.error(err.message || "Failed to save settings.");
      setPasswordSaved(false);
    } finally {
      setSavingSettings(false);
    }
  };

  // Inquiry Actions
  const handleUpdateStatus = async (
    id: string,
    newStatus: "new" | "read" | "replied" | "archived"
  ) => {
    try {
      await updateDoc(doc(db, "inquiries", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(`Inquiry marked as ${newStatus}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleStar = async (id: string, currentVal?: boolean) => {
    try {
      await updateDoc(doc(db, "inquiries", id), {
        isStarred: !currentVal,
      });
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, isStarred: !currentVal } : null));
      }
    } catch (e) {
      toast.error("Failed to update star");
    }
  };

  const handleDeleteInquiry = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete inquiry from "${clientName}"?`)) return;
    try {
      await deleteDoc(doc(db, "inquiries", id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      toast.success("Inquiry deleted.");
    } catch (e) {
      toast.error("Failed to delete inquiry");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedInquiry) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, "inquiries", selectedInquiry.id), {
        notes: adminNote,
        updatedAt: serverTimestamp(),
      });
      setSelectedInquiry((prev) => (prev ? { ...prev, notes: adminNote } : null));
      toast.success("Admin note saved");
    } catch (e) {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  // Partner Management
  const handleTogglePartner = (idx: number) => {
    setFormData((prev) => {
      const updated = [...prev.partners];
      updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
      return { ...prev, partners: updated };
    });
  };

  const handleDeletePartner = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners.filter((_, i) => i !== idx),
    }));
  };

  const handleAddPartner = () => {
    if (!newPartnerName.trim() || !newPartnerLogo.trim()) {
      toast.error("Please enter partner name and logo URL / image.");
      return;
    }
    const newPartner: ContactPartner = {
      name: newPartnerName.trim(),
      logoUrl: newPartnerLogo.trim(),
      enabled: true,
    };
    setFormData((prev) => ({
      ...prev,
      partners: [...prev.partners, newPartner],
    }));
    setNewPartnerName("");
    setNewPartnerLogo("");
    setIsAddingPartner(false);
    toast.success("Partner added! Don't forget to save changes.");
  };

  const handlePartnerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadToCloudinary(file);
      setNewPartnerLogo(res.secure_url || res.url);
      toast.success("Partner logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Filtered inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      `${inq.firstName} ${inq.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.country || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "new") return inq.status === "new" || !inq.status;
    if (statusFilter === "read") return inq.status === "read";
    if (statusFilter === "replied") return inq.status === "replied";
    if (statusFilter === "starred") return !!inq.isStarred;
    return true;
  });

  const countNew = inquiries.filter((i) => i.status === "new" || !i.status).length;
  const countReplied = inquiries.filter((i) => i.status === "replied").length;
  const countStarred = inquiries.filter((i) => !!i.isStarred).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/25">
              💬
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-midnight_text dark:text-white">
                Contact &amp; Project Inquiries
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Manage client inquiries, track email leads &amp; customize the contact section
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-darkmode p-1 rounded-xl border border-border dark:border-dark_border shrink-0">
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>📥 Inquiries &amp; Messages</span>
            {countNew > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                {countNew}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-dark dark:hover:text-white"
            }`}
          >
            <span>⚙️ Section Settings</span>
          </button>
        </div>
      </div>

      {/* ════════════════════ TAB 1: INQUIRIES & MESSAGES ════════════════════ */}
      {activeTab === "inquiries" && (
        <div className="space-y-6">
          {/* Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter("all")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "bg-blue-500/10 border-blue-500/50 dark:bg-blue-950/20"
                  : "bg-white dark:bg-darklight border-border dark:border-dark_border hover:border-blue-300"
              }`}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Inquiries</span>
              <p className="text-2xl font-black text-midnight_text dark:text-white mt-1">
                {inquiries.length}
              </p>
            </div>

            <div
              onClick={() => setStatusFilter("new")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === "new"
                  ? "bg-red-500/10 border-red-500/50 dark:bg-red-950/20"
                  : "bg-white dark:bg-darklight border-border dark:border-dark_border hover:border-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-600 dark:text-red-400 font-bold">New &amp; Unread</span>
                {countNew > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
              </div>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {countNew}
              </p>
            </div>

            <div
              onClick={() => setStatusFilter("replied")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === "replied"
                  ? "bg-emerald-500/10 border-emerald-500/50 dark:bg-emerald-950/20"
                  : "bg-white dark:bg-darklight border-border dark:border-dark_border hover:border-emerald-300"
              }`}
            >
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Replied</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {countReplied}
              </p>
            </div>

            <div
              onClick={() => setStatusFilter("starred")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === "starred"
                  ? "bg-amber-500/10 border-amber-500/50 dark:bg-amber-950/20"
                  : "bg-white dark:bg-darklight border-border dark:border-dark_border hover:border-amber-300"
              }`}
            >
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">⭐ Starred</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {countStarred}
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-darklight p-4 rounded-2xl border border-border dark:border-dark_border">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search inquiries (name, email, country, message)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border focus:outline-none focus:border-primary text-midnight_text dark:text-white"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {(["all", "new", "read", "replied", "starred"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer shrink-0 ${
                    statusFilter === filter
                      ? "bg-midnight_text dark:bg-white text-white dark:text-midnight_text"
                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-400 hover:text-midnight_text dark:hover:text-white"
                  }`}
                >
                  {filter === "all" ? "All Inquiries" : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries Table / List */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border overflow-hidden shadow-xs">
            {loadingInquiries ? (
              <div className="p-12 text-center text-gray-400 animate-pulse">
                Loading inquiries from database...
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <div className="text-4xl">📭</div>
                <p className="font-bold text-sm text-midnight_text dark:text-white">No inquiries found</p>
                <p className="text-xs text-gray-500">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search query or filter."
                    : "Client inquiries submitted through your portfolio form will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 dark:bg-darkmode border-b border-border dark:border-dark_border text-gray-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold w-10">⭐</th>
                      <th className="py-3.5 px-4 font-bold">Client</th>
                      <th className="py-3.5 px-4 font-bold">Country</th>
                      <th className="py-3.5 px-4 font-bold">Message Preview</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-dark_border/60">
                    {filteredInquiries.map((inq) => {
                      const fullName = `${inq.firstName} ${inq.lastName || ""}`.trim();
                      const isUnread = inq.status === "new" || !inq.status;

                      let dateLabel = "Recent";
                      if (inq.createdAt?.seconds) {
                        dateLabel = new Date(inq.createdAt.seconds * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }

                      return (
                        <tr
                          key={inq.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-darkmode/50 transition cursor-pointer ${
                            isUnread ? "bg-blue-500/5 font-semibold" : ""
                          }`}
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setAdminNote(inq.notes || "");
                            if (isUnread) {
                              handleUpdateStatus(inq.id, "read");
                            }
                          }}
                        >
                          {/* Star */}
                          <td
                            className="py-3.5 px-4 text-base"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(inq.id, inq.isStarred);
                            }}
                          >
                            <span className="cursor-pointer hover:scale-125 transition inline-block">
                              {inq.isStarred ? "⭐" : "☆"}
                            </span>
                          </td>

                          {/* Client Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {inq.firstName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-midnight_text dark:text-white">
                                    {fullName}
                                  </p>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                                  {inq.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Country */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                            {inq.country ? (
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-darkmode text-gray-700 dark:text-gray-300 border border-border">
                                📍 {inq.country}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Message snippet */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                              {inq.message}
                            </p>
                            {inq.notes && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                📝 Note added
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                inq.status === "replied"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : inq.status === "read"
                                  ? "bg-gray-100 dark:bg-darkmode text-gray-500 dark:text-gray-400 border-border"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse"
                              }`}
                            >
                              {inq.status === "replied"
                                ? "Replied"
                                : inq.status === "read"
                                ? "Read"
                                : "NEW"}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                            {dateLabel}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={`mailto:${inq.email}?subject=Re:%20Project%20Inquiry%20-%20Malitha%20Tishamal`}
                                onClick={() => handleUpdateStatus(inq.id, "replied")}
                                className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition text-xs font-bold"
                                title="Reply via Email"
                              >
                                ✉️ Reply
                              </a>
                              <button
                                onClick={() => handleDeleteInquiry(inq.id, fullName)}
                                className="px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-500 hover:text-white transition text-xs font-bold"
                                title="Delete Inquiry"
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ INQUIRY DETAIL MODAL ════════════════════ */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-darklight rounded-3xl border border-border dark:border-dark_border shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 my-auto relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border dark:border-dark_border mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedInquiry.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-midnight_text dark:text-white">
                    {selectedInquiry.firstName} {selectedInquiry.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedInquiry.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode flex items-center justify-center text-gray-500 hover:text-dark dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-4 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-xs">
              <div>
                <span className="text-gray-400 block">Country:</span>
                <span className="font-bold text-midnight_text dark:text-white">
                  {selectedInquiry.country || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Status:</span>
                <span className="font-bold capitalize text-primary">
                  {selectedInquiry.status || "new"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Received:</span>
                <span className="font-bold text-midnight_text dark:text-white">
                  {selectedInquiry.createdAt?.seconds
                    ? new Date(selectedInquiry.createdAt.seconds * 1000).toLocaleString()
                    : "Recent"}
                </span>
              </div>
            </div>

            {/* Full Message */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                💬 Client Message / Project Details:
              </label>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-sm text-midnight_text dark:text-white whitespace-pre-wrap leading-relaxed">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Admin Note */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                📝 Internal Admin Note:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Quoted $1500, waiting for client response..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-dark text-xs font-bold rounded-xl hover:opacity-90"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>

            {/* Status Change & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border dark:border-dark_border">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "new")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedInquiry.status === "new"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 border-border"
                  }`}
                >
                  Mark New
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "read")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedInquiry.status === "read"
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 border-border"
                  }`}
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "replied")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedInquiry.status === "replied"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 border-border"
                  }`}
                >
                  Mark Replied
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re:%20Project%20Inquiry%20-%20Malitha%20Tishamal`}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "replied")}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                >
                  ✉️ Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 2: SECTION SETTINGS ════════════════════ */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border space-y-6">
            <h2 className="text-lg font-bold text-midnight_text dark:text-white pb-3 border-b border-border dark:border-dark_border">
              Contact Section Information &amp; Copy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Top Badge Text
                </label>
                <input
                  type="text"
                  value={formData.badgeText || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, badgeText: e.target.value }))}
                  placeholder="e.g. build everything"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Notification Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Inquiry Notification Email (Your Email)
                </label>
                <input
                  type="email"
                  value={formData.notificationEmail || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, notificationEmail: e.target.value }))}
                  placeholder="malithatishamal@gmail.com"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Emails for new inquiries will be delivered to this address.
                </p>
              </div>

              {/* Main Headline */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Section Headline
                </label>
                <textarea
                  rows={2}
                  value={formData.heading || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, heading: e.target.value }))}
                  placeholder="Let’s discuss about your project and take it the next level."
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Public Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Public Display Email
                </label>
                <input
                  type="text"
                  value={formData.email || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="malithatishamal@gmail.com"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Colombo, Sri Lanka"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ═══════════ EMAIL NOTIFICATION (GMAIL SMTP) CARD ═══════════ */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border dark:border-dark_border">
              <div>
                <h2 className="text-lg font-bold text-midnight_text dark:text-white flex items-center gap-2">
                  <span>📧</span> Email Notifications (Gmail SMTP)
                </h2>
                <p className="text-xs text-gray-500">
                  Send an automatic email copy of every new client inquiry directly to your personal inbox.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {checkingSmtp ? (
                  <span className="text-xs text-gray-400">Checking status...</span>
                ) : smtpConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active &amp; Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    App Password Required
                  </span>
                )}
              </div>
            </div>

            {/* Explanatory / Warning Banner */}
            {!smtpConfigured && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  ⚠️ Why emails are not arriving in your inbox:
                </p>
                <p className="leading-relaxed">
                  Inquiries are currently being saved safely into this Admin Panel database, but Google Gmail requires a <strong>16-character Google App Password</strong> to authorize your website to send notification emails through <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded font-mono">malithatishamal@gmail.com</code>.
                </p>
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                  <p className="font-semibold mb-1">How to generate your 16-character App Password (takes 1 minute):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                    <li>Make sure <strong>2-Step Verification</strong> is ON in your Google Account.</li>
                    <li>
                      Visit{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold text-blue-600 dark:text-blue-400 hover:opacity-80"
                      >
                        Google App Passwords (click here) ↗
                      </a>
                    </li>
                    <li>Type an App Name (e.g. <strong>Portfolio</strong>) and click <strong>Create</strong>.</li>
                    <li>Copy the <strong>16-letter code</strong> and paste it into the field below, then click <strong>&quot;Save &amp; Send Test Email&quot;</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sender Gmail */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Sender Gmail Account (SMTP User)
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="malithatishamal@gmail.com"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Receiver Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Notification Recipient Email
                </label>
                <input
                  type="email"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="malithatishamal@gmail.com"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* 16-Char Google App Password */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Google App Password (16 Characters)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showSmtpPass ? "text" : "password"}
                      value={smtpPass}
                      onChange={(e) => {
                        setSmtpPass(e.target.value.replace(/\s/g, ''));
                        setPasswordSaved(false);
                      }}
                      placeholder={smtpConfigured ? "•••••••••••••••• (Configured. Enter new to update)" : "e.g. abcd efgh ijkl mnop"}
                      className="w-full text-xs sm:text-sm font-mono tracking-wider px-4 py-2.5 pr-20 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                      maxLength={16}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass((p) => !p)}
                        className="p-1.5 rounded transition text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-darklight cursor-pointer"
                        title={showSmtpPass ? "Hide password" : "Show password"}
                      >
                        {showSmtpPass ? "👁️" : "👁️‍🗨️"}
                      </button>
                      <button
                        type="button"
                        onClick={copyPassword}
                        disabled={!smtpPass}
                        className={`p-1.5 rounded transition ${
                          !smtpPass
                            ? 'text-gray-400 cursor-not-allowed opacity-50'
                            : 'text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-darklight cursor-pointer'
                        }`}
                        title="Copy password"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchPasswordFromFirestore}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition cursor-pointer"
                    title="Fetch password from Firestore"
                  >
                    🔄 Fetch from Firestore
                  </button>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-gray-100 dark:bg-darkmode text-xs font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-darklight transition cursor-pointer"
                  >
                    Get App Password ↗
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Spaces are automatically removed. This is your 16-character Google App Password (not your regular Google password).
                </p>
                {passwordSaved && (
                  <div className="mt-2 p-2 rounded-lg text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                    ✅ Key fetched from Firestore successfully!
                  </div>
                )}
                {passwordFetchResult && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${
                    passwordFetchResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    {passwordFetchResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons for SMTP */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border dark:border-dark_border">
              <span className="text-xs text-gray-500">
                {smtpConfigured
                  ? `✅ Emails will be delivered to ${receiverEmail}`
                  : "Enter the app password to activate email notifications."}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveSmtp(false)}
                  disabled={savingSmtp || testingSmtp}
                  className="px-4 py-2 rounded-xl border border-border dark:border-dark_border text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer disabled:opacity-50"
                >
                  {savingSmtp ? "Saving..." : "Save Password Only"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSmtp(true)}
                  disabled={savingSmtp || testingSmtp}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {testingSmtp ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Testing &amp; Sending...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Save &amp; Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Card Configuration */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border space-y-5">
            <h2 className="text-lg font-bold text-midnight_text dark:text-white pb-3 border-b border-border dark:border-dark_border">
              Right Card Form Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Form Heading
                </label>
                <input
                  type="text"
                  value={formData.formHeading || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, formHeading: e.target.value }))}
                  placeholder="Start the project"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  value={formData.submitButtonText || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, submitButtonText: e.target.value }))}
                  placeholder="Submit Inquiry"
                  className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Trusted By Partners Manager */}
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-dark_border">
              <div>
                <h2 className="text-lg font-bold text-midnight_text dark:text-white">
                  &quot;Trusted By&quot; Partner Logos
                </h2>
                <p className="text-xs text-gray-500">
                  Manage the client &amp; platform logos displayed underneath the contact info
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPartner(true)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                + Add Partner
              </button>
            </div>

            {/* Partner list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {formData.partners.map((partner, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    partner.enabled
                      ? "bg-gray-50 dark:bg-darkmode border-border dark:border-dark_border"
                      : "bg-gray-100/50 dark:bg-darkmode/30 border-dashed border-gray-300 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-midnight_text dark:text-white">
                      {partner.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePartner(idx)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        partner.enabled
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {partner.enabled ? "Visible" : "Hidden"}
                    </button>
                  </div>

                  <div className="h-12 bg-white dark:bg-darklight rounded-lg flex items-center justify-center p-2 mb-3 border border-border/50">
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={100}
                      height={28}
                      className="max-h-8 w-auto object-contain"
                      unoptimized
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePartner(idx)}
                    className="text-[11px] text-red-500 hover:text-red-700 font-semibold self-end"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Add partner mini form */}
            {isAddingPartner && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Add New Partner
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Partner Name</label>
                    <input
                      type="text"
                      value={newPartnerName}
                      onChange={(e) => setNewPartnerName(e.target.value)}
                      placeholder="e.g. Stripe, AWS, PayPal"
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-darkmode border border-border text-midnight_text dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Logo URL or Upload</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPartnerLogo}
                        onChange={(e) => setNewPartnerLogo(e.target.value)}
                        placeholder="/images/contact/stripe.png or URL"
                        className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-darkmode border border-border text-midnight_text dark:text-white focus:outline-none"
                      />
                      <label className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-darkmode hover:bg-gray-300 text-xs font-bold cursor-pointer shrink-0 border border-border">
                        {uploadingLogo ? "..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePartnerLogoUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPartner(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPartner}
                    className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
                  >
                    Confirm Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save bar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? "Saving Settings..." : "Save Contact Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
