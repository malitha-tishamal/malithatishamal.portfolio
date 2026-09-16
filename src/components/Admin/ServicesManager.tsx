"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ServiceItem,
  ServicesSectionContent,
  defaultServices,
  defaultServicesContent,
} from "@/types/service";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Software Engineering",
  "DevOps & Cloud",
  "Cybersecurity",
  "Networking",
  "Mobile & Apps",
  "Database & Performance",
] as const;

const POPULAR_EMOJIS = ["🚀", "☁️", "🛡️", "🌐", "📱", "⚡", "💻", "🔒", "⚙️", "🔧", "📊", "🎯"];

const ACCENT_PRESETS = [
  { label: "LinkedIn Blue", color: "#0a66c2" },
  { label: "Cloud Sky", color: "#0284c7" },
  { label: "Security Purple", color: "#7c3aed" },
  { label: "Network Emerald", color: "#059669" },
  { label: "Mobile Orange", color: "#ea580c" },
  { label: "Data Amber", color: "#d97706" },
];

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"services" | "settings">("services");

  // Section Settings State
  const [sectionSettings, setSectionSettings] = useState<ServicesSectionContent>(defaultServicesContent);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Modal (Add / Edit) State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [savingService, setSavingService] = useState<boolean>(false);

  // Form Fields State
  const [title, setTitle] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [fullDescription, setFullDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("🚀");
  const [category, setCategory] = useState<ServiceItem["category"]>("Software Engineering");
  const [colorAccent, setColorAccent] = useState<string>("#0a66c2");
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [published, setPublished] = useState<boolean>(true);

  // Tag list states
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [newTech, setNewTech] = useState<string>("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState<string>("");

  // 1. Subscribe to Services Collection
  useEffect(() => {
    try {
      const q = query(collection(db, "services"), orderBy("displayOrder", "asc"));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: ServiceItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              ...(docSnap.data() as ServiceItem),
              id: docSnap.id,
            });
          });
          setServices(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching services:", err);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.error("Error subscribing to services:", e);
      setLoading(false);
    }
  }, []);

  // 2. Fetch Section Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "services"));
        if (snap.exists()) {
          setSectionSettings({
            ...defaultServicesContent,
            ...(snap.data() as Partial<ServicesSectionContent>),
          });
        }
      } catch (e) {
        console.warn("Could not fetch service settings:", e);
      }
    };
    fetchSettings();
  }, []);

  // Seed default services if database is empty
  const handleSeedDefaults = async () => {
    const confirm = window.confirm(
      "Load the 6 default specialized engineering services into your database? This will give you instant services to customize."
    );
    if (!confirm) return;

    setLoading(true);
    try {
      for (const item of defaultServices) {
        const { id, ...rest } = item;
        await addDoc(collection(db, "services"), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Default services successfully loaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to seed defaults");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingService(null);
    setTitle("");
    setTagline("");
    setShortDescription("");
    setFullDescription("");
    setIcon("🚀");
    setCategory("Software Engineering");
    setColorAccent("#0a66c2");
    setDisplayOrder(services.length + 1);
    setPublished(true);
    setTechnologies(["Next.js", "React", "TypeScript", "Node.js"]);
    setDeliverables([
      "Custom Software Application Architecture",
      "API Design & Documentation",
      "Automated Testing & Security Validation",
    ]);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (item: ServiceItem) => {
    setEditingService(item);
    setTitle(item.title);
    setTagline(item.tagline || "");
    setShortDescription(item.shortDescription || "");
    setFullDescription(item.fullDescription || item.shortDescription || "");
    setIcon(item.icon || "⚡");
    setCategory(item.category || "Software Engineering");
    setColorAccent(item.colorAccent || "#0a66c2");
    setDisplayOrder(item.displayOrder ?? 1);
    setPublished(item.published !== false);
    setTechnologies(item.technologies || []);
    setDeliverables(item.deliverables || []);
    setIsModalOpen(true);
  };

  // Handle Save Service (Add / Update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Service title is required");
      return;
    }
    if (!shortDescription.trim()) {
      toast.error("Short description is required for the card preview");
      return;
    }

    setSavingService(true);
    try {
      const payload = {
        title: title.trim(),
        tagline: tagline.trim(),
        shortDescription: shortDescription.trim(),
        fullDescription: (fullDescription.trim() || shortDescription.trim()),
        icon: icon.trim() || "⚡",
        category,
        colorAccent,
        displayOrder: Number(displayOrder) || 1,
        published,
        technologies,
        deliverables,
        updatedAt: serverTimestamp(),
      };

      if (editingService) {
        await updateDoc(doc(db, "services", editingService.id), payload);
        toast.success("Service updated successfully!");
      } else {
        await addDoc(collection(db, "services"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("New service added successfully!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving service:", err);
      toast.error(err.message || "Failed to save service");
    } finally {
      setSavingService(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the service "${name}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Service deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service");
    }
  };

  // Quick toggle published
  const handleTogglePublished = async (item: ServiceItem) => {
    try {
      await updateDoc(doc(db, "services", item.id), {
        published: !item.published,
        updatedAt: serverTimestamp(),
      });
      toast.success(item.published ? "Service unpublished" : "Service published");
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  // Save Section Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, "siteContent", "services"),
        {
          ...sectionSettings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Services section headers saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Tech tags handler
  const handleAddTech = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech("");
    }
  };
  const handleRemoveTech = (idx: number) => {
    setTechnologies(technologies.filter((_, i) => i !== idx));
  };

  // Deliverables handler
  const handleAddDeliverable = () => {
    if (newDeliverable.trim() && !deliverables.includes(newDeliverable.trim())) {
      setDeliverables([...deliverables, newDeliverable.trim()]);
      setNewDeliverable("");
    }
  };
  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-dark_border">
        <div>
          <h1 className="text-2xl font-black text-midnight_text dark:text-white flex items-center gap-2">
            <span>⚡</span> Services &amp; Capabilities Manager
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your specialized software engineering, DevOps, networking &amp; cybersecurity service offerings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {services.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-darkmode dark:hover:bg-darklight text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🌱</span> Load Defaults
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Add Service
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border dark:border-dark_border pb-3">
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "services"
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
          }`}
        >
          <span>📋</span> All Services ({services.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "settings"
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-400 hover:text-dark dark:hover:text-white"
          }`}
        >
          <span>⚙️</span> Section Copy &amp; Settings
        </button>
      </div>

      {/* ════════════════════ TAB 1: ALL SERVICES ════════════════════ */}
      {activeTab === "services" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="bg-white dark:bg-darklight p-10 rounded-2xl border border-dashed border-border dark:border-dark_border text-center space-y-3">
              <div className="text-4xl">🛠️</div>
              <h3 className="text-base font-bold text-midnight_text dark:text-white">
                No Services Added Yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Click &quot;Load Defaults&quot; to automatically import the 6 pre-configured engineering services, or create a new service from scratch.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedDefaults}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  Load 6 Engineering Services
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-darklight rounded-2xl border p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    item.published === false
                      ? "opacity-60 border-dashed border-gray-300 dark:border-gray-700"
                      : "border-border dark:border-dark_border"
                  }`}
                >
                  <div>
                    {/* Header: Icon + Category + Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{
                          backgroundColor: `${item.colorAccent || "#0a66c2"}18`,
                          border: `1px solid ${item.colorAccent || "#0a66c2"}30`,
                        }}
                      >
                        {item.icon || "⚡"}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePublished(item)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            item.published !== false
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300"
                          }`}
                        >
                          {item.published !== false ? "● Live" : "○ Draft"}
                        </button>

                        <span className="text-[10px] text-gray-400 font-mono">
                          #{item.displayOrder ?? 0}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-midnight_text dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    {item.tagline && (
                      <p
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: item.colorAccent || "#0a66c2" }}
                      >
                        {item.tagline}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {item.shortDescription}
                    </p>

                    {/* Metadata counts */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60 dark:border-dark_border/60 text-[11px] text-gray-500">
                      <span>🛠️ {item.technologies?.length || 0} tools</span>
                      <span>📋 {item.deliverables?.length || 0} deliverables</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/60 dark:border-dark_border/60">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-darkmode dark:hover:bg-dark_border text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(item.id, item.title)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-600 dark:text-red-400 transition cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 2: SECTION SETTINGS ════════════════════ */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white dark:bg-darklight p-6 rounded-2xl border border-border dark:border-dark_border space-y-5">
            <h2 className="text-base font-bold text-midnight_text dark:text-white pb-3 border-b border-border dark:border-dark_border">
              Section Header &amp; Subtitle Copy
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                Top Small Badge Text
              </label>
              <input
                type="text"
                value={sectionSettings.badgeText}
                onChange={(e) =>
                  setSectionSettings((p) => ({ ...p, badgeText: e.target.value }))
                }
                placeholder="Core Engineering Capabilities"
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                Main Section Heading
              </label>
              <input
                type="text"
                value={sectionSettings.heading}
                onChange={(e) =>
                  setSectionSettings((p) => ({ ...p, heading: e.target.value }))
                }
                placeholder="High-Impact Services Engineered for Scale & Reliability"
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                Section Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={sectionSettings.subheading}
                onChange={(e) =>
                  setSectionSettings((p) => ({ ...p, subheading: e.target.value }))
                }
                placeholder="Brief summary of your overall service capabilities..."
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? "Saving..." : "Save Header Settings"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ════════════════════ ADD / EDIT MODAL ════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl border border-border dark:border-dark_border shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:px-6 border-b border-border dark:border-dark_border">
              <h3 className="text-base sm:text-lg font-bold text-midnight_text dark:text-white flex items-center gap-2">
                <span>{editingService ? "✏️ Edit Service" : "➕ Add New Service"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-darkmode text-gray-500 hover:text-dark dark:text-gray-400 dark:hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveService} className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. DevOps & Cloud Infrastructure"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Tagline / Sub-badge
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Automated CI/CD & Orchestration"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Category, Icon, Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Icon / Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder="🚀"
                      className="w-14 text-center text-lg px-2 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {POPULAR_EMOJIS.slice(0, 6).map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setIcon(em)}
                          className="w-6 h-6 rounded text-xs bg-gray-100 dark:bg-darkmode hover:scale-110 transition"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  Theme Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setColorAccent(p.color)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition ${
                        colorAccent === p.color
                          ? "border-primary bg-primary/10 font-bold"
                          : "border-border dark:border-dark_border"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.label}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={colorAccent}
                    onChange={(e) => setColorAccent(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border dark:border-dark_border p-0.5 bg-transparent"
                  />
                </div>
              </div>

              {/* Short Description (Preview on Card) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Card Short Description * (Shown on the homepage card preview)
                </label>
                <textarea
                  rows={2}
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Concise 1-2 sentence overview of what this service solves..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Full Description (Shown in Modal) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Full In-Depth Description (Shown when card is clicked in the modal)
                </label>
                <textarea
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Comprehensive technical breakdown, architectural approach, and business benefits..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Deliverables Builder */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Key Deliverables &amp; Inclusions
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                    placeholder="e.g. CI/CD pipeline automation with GitHub Actions"
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-dark text-xs font-bold hover:opacity-90"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-darkmode text-xs text-midnight_text dark:text-white"
                    >
                      <span>✓ {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technologies / Tools Builder */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Tech Stack &amp; Tools Used
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTech();
                      }
                    }}
                    placeholder="e.g. Docker, Kubernetes, Next.js"
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border text-midnight_text dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-dark text-xs font-bold hover:opacity-90"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(idx)}
                        className="hover:text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Published Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="published-service"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label
                  htmlFor="published-service"
                  className="text-xs font-bold text-midnight_text dark:text-white cursor-pointer"
                >
                  Publish live on website
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-dark_border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-dark dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-md shadow-primary/25 disabled:opacity-50 transition cursor-pointer"
                >
                  {savingService ? "Saving..." : editingService ? "Update Service" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
