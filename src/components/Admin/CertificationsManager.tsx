"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CertificationItem,
  CertificationSettings,
  CERTIFICATION_CATEGORIES,
  defaultCertifications,
  defaultCertificationSettings,
} from "@/types/certification";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { searchSkills } from "@/data/skillsDatabase";
import toast from "react-hot-toast";

const LOGO_BG_PRESETS = [
  { id: "transparent", label: "Transparent", color: "transparent", border: "border-gray-300 dark:border-gray-600" },
  { id: "#ffffff", label: "Clean White", color: "#ffffff", border: "border-gray-300" },
  { id: "#0b1120", label: "Dark Slate", color: "#0b1120", border: "border-gray-700" },
  { id: "#049fd9", label: "Cisco Blue", color: "#049fd9", border: "border-[#049fd9]" },
  { id: "#002c5f", label: "Deep Navy", color: "#002c5f", border: "border-[#002c5f]" },
  { id: "#057642", label: "Emerald", color: "#057642", border: "border-[#057642]" },
];

const POPULAR_CERT_SKILLS = [
  "Cisco Networking",
  "Cybersecurity",
  "Packet Tracer",
  "Threat Detection",
  "Network Vulnerability",
  "Privacy And Data Confidentiality",
  "Internet of Things (IoT)",
  "Cloud Security",
  "Switching & Routing",
  "IPv4/IPv6 Subnetting",
  "Firewall Administration",
  "Ethical Hacking",
];

export const CertificationsManager: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Slider timing & options state
  const [sliderSettings, setSliderSettings] = useState<CertificationSettings>(defaultCertificationSettings);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CertificationItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CertificationItem>>({
    title: "",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
    logoShape: "rounded",
    logoBgColor: "transparent",
    issueDate: "Mar 2026",
    expirationDate: "No Expiration",
    credentialId: "",
    credentialUrl: "https://www.credly.com/org/cisco",
    certificateImage: "/images/portfolio/portfolio_1.jpg",
    skills: ["Cybersecurity", "Networking"],
    category: "Cybersecurity",
    description: "",
    displayOrder: 1,
    featured: true,
    published: true,
  });

  const [newSkill, setNewSkill] = useState<string>("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Upload Progress
  const [certProgress, setCertProgress] = useState<number | null>(null);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);

  // ── Fetch Certifications ───────────────────────────────────────────────────
  const fetchItems = async () => {
    try {
      setLoading(true);
      const ref = collection(db, "certifications");
      const q = query(ref);
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const list: CertificationItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CertificationItem, "id">),
        }));

        list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setItems(list);
      } else {
        setItems(defaultCertifications);
      }
    } catch (err) {
      console.error("Error fetching certifications:", err);
      toast.error("Failed to load certifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "siteContent", "certifications"));
      if (snap.exists()) {
        const data = snap.data() as Partial<CertificationSettings>;
        setSliderSettings({
          autoplay: data.autoplay !== undefined ? data.autoplay : defaultCertificationSettings.autoplay,
          autoplaySpeed: Number(data.autoplaySpeed) || defaultCertificationSettings.autoplaySpeed,
          transitionSpeed: Number(data.transitionSpeed) || defaultCertificationSettings.transitionSpeed,
          pauseOnHover: data.pauseOnHover !== undefined ? data.pauseOnHover : defaultCertificationSettings.pauseOnHover,
        });
      }
    } catch (err) {
      console.warn("Notice: could not load slider settings", err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await setDoc(doc(db, "siteContent", "certifications"), sliderSettings, { merge: true });
      toast.success("Slider settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save slider settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSettings();
  }, []);

  // ── Seed Default Cisco Certifications ──────────────────────────────────────
  const handleSeedDefaults = async () => {
    if (!confirm("This will seed default Cisco Certifications into Firestore. Continue?")) {
      return;
    }

    try {
      setSeeding(true);
      for (const item of defaultCertifications) {
        const docRef = doc(db, "certifications", item.id);
        await setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Default certifications seeded!");
      fetchItems();
    } catch (err) {
      console.error("Error seeding certifications:", err);
      toast.error("Failed to seed certifications.");
    } finally {
      setSeeding(false);
    }
  };

  // ── Open Editor for New ────────────────────────────────────────────────────
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      issuer: "Cisco Networking Academy",
      issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
      logoShape: "rounded",
      logoBgColor: "transparent",
      issueDate: "Mar 2026",
      expirationDate: "No Expiration",
      credentialId: "",
      credentialUrl: "https://www.credly.com/org/cisco",
      certificateImage: "/images/portfolio/portfolio_1.jpg",
      skills: ["Cybersecurity", "Networking"],
      category: "Cybersecurity",
      description: "",
      displayOrder: items.length + 1,
      featured: true,
      published: true,
    });
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
    setIsModalOpen(true);
  };

  // ── Open Editor for Existing ───────────────────────────────────────────────
  const handleEdit = (item: CertificationItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      logoBgColor: item.logoBgColor || "transparent",
      logoShape: item.logoShape || "rounded",
      skills: item.skills || [],
    });
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
    setIsModalOpen(true);
  };

  // ── Delete Certification ───────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      await deleteDoc(doc(db, "certifications", id));
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Certification deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete certification.");
    }
  };

  // ── Reorder Items (Up / Down) ──────────────────────────────────────────────
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const current = newItems[index];
    const target = newItems[targetIndex];

    const tempOrder = current.displayOrder || index + 1;
    current.displayOrder = target.displayOrder || targetIndex + 1;
    target.displayOrder = tempOrder;

    newItems[index] = target;
    newItems[targetIndex] = current;
    newItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setItems(newItems);

    try {
      await setDoc(doc(db, "certifications", current.id), { displayOrder: current.displayOrder }, { merge: true });
      await setDoc(doc(db, "certifications", target.id), { displayOrder: target.displayOrder }, { merge: true });
      toast.success("Order updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order.");
    }
  };

  // ── Direct Order Change ────────────────────────────────────────────────────
  const handleQuickOrderChange = async (id: string, newOrder: number) => {
    const updated = items.map((it) => (it.id === id ? { ...it, displayOrder: newOrder } : it));
    updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    setItems(updated);
    try {
      await setDoc(doc(db, "certifications", id), { displayOrder: newOrder }, { merge: true });
      toast.success("Order updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order.");
    }
  };

  // ── Cloudinary Upload Handlers (Image or PDF) ──────────────────────────────
  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCertProgress(10);
      const res = await uploadToCloudinary(file, (p) => setCertProgress(p), "auto");
      const url = res.secure_url || res.url;

      // If uploaded file is a PDF, Cloudinary renders first page image preview with .jpg format
      if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
        const previewImageUrl = url.replace(/\.pdf$/i, ".jpg");
        setFormData((prev) => ({
          ...prev,
          certificateImage: previewImageUrl,
          certificatePdfUrl: url,
        }));
        toast.success("PDF uploaded & converted to image preview!");
      } else {
        setFormData((prev) => ({ ...prev, certificateImage: url }));
        toast.success("Certificate image uploaded!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setCertProgress(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoProgress(10);
      const res = await uploadToCloudinary(file, (p) => setLogoProgress(p));
      const url = res.secure_url || res.url;
      setFormData((prev) => ({ ...prev, issuerLogo: url }));
      toast.success("Issuer logo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Logo upload failed.");
    } finally {
      setLogoProgress(null);
    }
  };

  // ── Skill Tag Management with 5,500+ Auto-Suggest (Case-Insensitive) ────────
  const handleSkillInputChange = (value: string) => {
    setNewSkill(value);
    if (value.trim().length > 0) {
      const results = searchSkills(value, 15);
      setSkillSuggestions(results);
      setShowSkillSuggestions(results.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const addSkill = (skillToAdd?: string) => {
    const raw = (skillToAdd || newSkill).trim();
    if (!raw) return;

    // Case-insensitive duplicate check
    const currentSkills = formData.skills || [];
    const alreadyExists = currentSkills.some(
      (s) => s.toLowerCase() === raw.toLowerCase()
    );

    if (!alreadyExists) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), raw],
      }));
    } else {
      toast("Skill already added", { icon: "ℹ️" });
    }
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s.toLowerCase() !== skill.toLowerCase()) || [],
    }));
  };

  // ── Save / Update ──────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.issuer?.trim()) {
      toast.error("Title and Issuer are required.");
      return;
    }

    const certId = editingItem ? editingItem.id : `cert-${Date.now()}`;

    const payload: CertificationItem = {
      id: certId,
      title: formData.title.trim(),
      issuer: formData.issuer.trim(),
      issuerLogo: formData.issuerLogo || "",
      logoShape: formData.logoShape || "rounded",
      logoBgColor: formData.logoBgColor || "transparent",
      issueDate: formData.issueDate || "Mar 2026",
      expirationDate: formData.expirationDate || "No Expiration",
      credentialId: formData.credentialId?.trim() || "",
      credentialUrl: formData.credentialUrl?.trim() || "",
      certificateImage: formData.certificateImage || "",
      certificatePdfUrl: formData.certificatePdfUrl || "",
      skills: formData.skills || [],
      category: formData.category || "Cybersecurity",
      description: formData.description?.trim() || "",
      displayOrder: formData.displayOrder || items.length + 1,
      featured: !!formData.featured,
      published: formData.published !== false,
    };

    try {
      setSaving(true);
      await setDoc(doc(db, "certifications", certId), payload);
      toast.success(editingItem ? "Certification updated!" : "New certification created!");
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Error saving certification:", err);
      toast.error("Failed to save certification.");
    } finally {
      setSaving(false);
    }
  };

  // ── Quick Published Toggle ─────────────────────────────────────────────────
  const togglePublished = async (item: CertificationItem) => {
    try {
      const updated = !item.published;
      await setDoc(doc(db, "certifications", item.id), { published: updated }, { merge: true });
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, published: updated } : it)));
      toast.success(updated ? "Certification published!" : "Certification hidden.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const filteredItems = items.filter((it) => {
    const matchCat = categoryFilter === "All" || it.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      it.title.toLowerCase().includes(q) ||
      it.issuer.toLowerCase().includes(q) ||
      it.credentialId?.toLowerCase().includes(q) ||
      it.skills?.some((s) => s.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darkmode text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelCls =
    "block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-xl font-bold text-dark dark:text-white">
              Licenses & Certifications Manager
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage your verified credentials, Cisco badges, skills accreditation, and certificate PDF/image previews.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>{seeding ? "Seeding..." : "✦ Seed Default Cisco Certs"}</span>
          </button>

          <button
            onClick={handleAddNew}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Certification</span>
          </button>
        </div>
      </div>

      {/* 🎠 Slider & Carousel Timing Settings Card */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60 dark:border-dark_border/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎠</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-dark dark:text-white">
                Homepage Slider & Carousel Controls
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Manage autoplay interval, transition speed, and pause behaviors for the certifications carousel on the homepage.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>{savingSettings ? "Saving..." : "💾 Save Slider Settings"}</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Autoplay Toggle */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-dark dark:text-white block">Autoplay</span>
              <span className="text-[10px] text-gray-500">Auto-rotate slides</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sliderSettings.autoplay}
                onChange={(e) => setSliderSettings((prev) => ({ ...prev, autoplay: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Autoplay Speed (Interval) */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-dark dark:text-white">
              <span>Slide Interval</span>
              <span className="text-primary font-mono">{sliderSettings.autoplaySpeed}ms ({((sliderSettings.autoplaySpeed || 4500) / 1000).toFixed(1)}s)</span>
            </div>
            <input
              type="range"
              min={1500}
              max={10000}
              step={250}
              value={sliderSettings.autoplaySpeed}
              onChange={(e) => setSliderSettings((prev) => ({ ...prev, autoplaySpeed: Number(e.target.value) }))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1.5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Transition Speed */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-dark dark:text-white">
              <span>Transition Speed</span>
              <span className="text-primary font-mono">{sliderSettings.transitionSpeed}ms</span>
            </div>
            <input
              type="range"
              min={200}
              max={2000}
              step={50}
              value={sliderSettings.transitionSpeed}
              onChange={(e) => setSliderSettings((prev) => ({ ...prev, transitionSpeed: Number(e.target.value) }))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>200ms</span>
              <span>2000ms</span>
            </div>
          </div>

          {/* Pause on Hover */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-dark dark:text-white block">Pause on Hover</span>
              <span className="text-[10px] text-gray-500">Halt when hovered</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sliderSettings.pauseOnHover}
                onChange={(e) => setSliderSettings((prev) => ({ ...prev, pauseOnHover: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border dark:border-dark_border shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, issuer, ID, skill..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none"
          >
            {CERTIFICATION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          {filteredItems.length} certification{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table of Certifications */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading certifications...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm font-semibold mb-2">No certifications found</p>
            <p className="text-xs">Click &quot;+ Add Certification&quot; or &quot;Seed Default Cisco Certs&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 dark:bg-darkmode border-b border-border dark:border-dark_border text-gray-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Order</th>
                  <th className="py-3.5 px-4 font-bold">Certification</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Issue Date</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark_border/60">
                {filteredItems.map((item, index) => {
                  const itemShapeClass =
                    item.logoShape === "circle"
                      ? "rounded-full"
                      : item.logoShape === "square"
                      ? "rounded-md"
                      : "rounded-xl";
                  const isItemTrans = !item.logoBgColor || item.logoBgColor === "transparent";
                  const isItemWhite =
                    item.logoBgColor?.toLowerCase() === "#ffffff" ||
                    item.logoBgColor?.toLowerCase() === "white";
                  const itemBgStyle = !isItemTrans && !isItemWhite ? { backgroundColor: item.logoBgColor } : undefined;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-darkmode/50 transition"
                    >
                      {/* Order Controls */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={item.displayOrder || index + 1}
                            onChange={(e) => handleQuickOrderChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 px-1.5 py-1 text-center font-bold text-xs rounded-lg border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white"
                          />
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleMoveOrder(index, "up")}
                              disabled={index === 0}
                              title="Move Up"
                              className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer text-[10px] leading-none"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveOrder(index, "down")}
                              disabled={index === items.length - 1}
                              title="Move Down"
                              className="p-0.5 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer text-[10px] leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Certification Title & Issuer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 ${itemShapeClass} flex items-center justify-center p-1.5 shrink-0 border ${
                              isItemTrans
                                ? "bg-transparent border-border"
                                : isItemWhite
                                ? "bg-white border-gray-200 shadow-xs"
                                : "border-black/15"
                            }`}
                            style={itemBgStyle}
                          >
                            {item.issuerLogo ? (
                              <Image
                                src={item.issuerLogo}
                                alt={item.issuer}
                                width={30}
                                height={30}
                                className="object-contain max-h-full max-w-full"
                                unoptimized
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500">CERT</span>
                            )}
                          </div>
                          <div className="max-w-md">
                            <p className="font-bold text-dark dark:text-white line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {item.issuer} {item.credentialId && `• ID: ${item.credentialId}`}
                            </p>
                          </div>
                        </div>
                      </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {item.category}
                      </span>
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-500">
                      {item.issueDate} ({item.expirationDate || "No Expiration"})
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(item)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          item.published !== false
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-gray-200 dark:bg-darkmode text-gray-500 border border-border"
                        }`}
                      >
                        {item.published !== false ? "✓ Published" : "Draft"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.credentialUrl && (
                          <a
                            href={item.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Verify Credential"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                          >
                            ↗
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          title="Edit Certification"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Delete Certification"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                        >
                          🗑
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

      {/* ──────────────── EDIT / CREATE MODAL ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-darklight w-full max-w-3xl max-h-[92vh] rounded-3xl border border-border dark:border-dark_border shadow-2xl overflow-y-auto p-6 sm:p-8 my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-border dark:border-dark_border mb-6">
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">
                  {editingItem ? "Edit Certification" : "Add New Certification"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure certificate title, issuer, issue date, skills, and image/PDF file.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode text-gray-500 hover:text-dark dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Title & Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Certificate Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Introduction to Cybersecurity"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={formData.category || "Cybersecurity"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className={inputCls}
                  >
                    {CERTIFICATION_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issuer & Issuer Logo */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Issuer Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.issuer || "Cisco Networking Academy"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issuer: e.target.value }))}
                    placeholder="e.g. Cisco Networking Academy"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Issuer Logo (URL or Upload)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.issuerLogo || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issuerLogo: e.target.value }))}
                      placeholder="https://... logo url"
                      className={`${inputCls} flex-1`}
                    />
                    <label className="px-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition cursor-pointer shrink-0 flex items-center">
                      <span>{logoProgress !== null ? `${logoProgress}%` : "Upload"}</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo Display Shape Selector */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-dark dark:text-white block">
                      Issuer Logo Shape
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Choose whether the organization badge appears as Rounded, Circle, or Square.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "rounded", label: "Rounded", cls: "rounded-xl" },
                      { id: "circle", label: "Circle", cls: "rounded-full" },
                      { id: "square", label: "Square", cls: "rounded-md" },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoShape: shape.id as any }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          formData.logoShape === shape.id
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border-border hover:border-primary"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 bg-current ${shape.cls} inline-block`} />
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo Background Color */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark dark:text-white block">
                    Logo Background Color
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Default is transparent. Pick a preset or enter a custom hex color.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {LOGO_BG_PRESETS.map((preset) => {
                    const isSelected =
                      (formData.logoBgColor || "transparent") === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, logoBgColor: preset.id }))
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-gray-300 dark:border-gray-600 hover:border-primary/50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md border border-black/10 shrink-0 ${
                            preset.color === "transparent"
                              ? "bg-[repeating-conic-gradient(#ccc_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
                              : ""
                          }`}
                          style={
                            preset.color !== "transparent"
                              ? { backgroundColor: preset.color }
                              : undefined
                          }
                        />
                        <span className="text-dark dark:text-white">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Custom hex / color picker */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-[11px] font-semibold text-gray-500 shrink-0">
                    Custom Color:
                  </label>
                  <input
                    type="color"
                    value={
                      formData.logoBgColor && formData.logoBgColor !== "transparent"
                        ? formData.logoBgColor
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, logoBgColor: e.target.value }))
                    }
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
                    title="Pick custom background color"
                  />
                  <input
                    type="text"
                    value={formData.logoBgColor || "transparent"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, logoBgColor: e.target.value }))
                    }
                    placeholder="#hex or transparent"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darklight text-xs font-mono text-dark dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, logoBgColor: "transparent" }))
                    }
                    className="text-[11px] text-gray-500 hover:text-red-500 transition font-semibold cursor-pointer shrink-0"
                  >
                    Reset
                  </button>
                </div>
                {/* Live logo preview with background */}
                {formData.issuerLogo && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] text-gray-500 font-semibold">Preview:</span>
                    <div
                      className={`w-12 h-12 flex items-center justify-center p-1.5 border rounded-xl ${
                        !formData.logoBgColor || formData.logoBgColor === "transparent"
                          ? "bg-transparent border-border"
                          : formData.logoBgColor.toLowerCase() === "#ffffff" ||
                            formData.logoBgColor.toLowerCase() === "white"
                          ? "bg-white border-gray-200"
                          : "border-black/10"
                      }`}
                      style={
                        formData.logoBgColor &&
                        formData.logoBgColor !== "transparent" &&
                        formData.logoBgColor.toLowerCase() !== "#ffffff" &&
                        formData.logoBgColor.toLowerCase() !== "white"
                          ? { backgroundColor: formData.logoBgColor }
                          : undefined
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.issuerLogo}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dates & Credential ID */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Issue Date</label>
                  <input
                    type="text"
                    value={formData.issueDate || "Mar 2026"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                    placeholder="e.g. Mar 2026"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Expiration Date</label>
                  <input
                    type="text"
                    value={formData.expirationDate || "No Expiration"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                    placeholder="e.g. No Expiration"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Credential ID</label>
                  <input
                    type="text"
                    value={formData.credentialId || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, credentialId: e.target.value }))}
                    placeholder="e.g. e4e1215f-35c6..."
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Verification URL */}
              <div>
                <label className={labelCls}>Credential Verification URL (Show credential button)</label>
                <input
                  type="url"
                  value={formData.credentialUrl || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, credentialUrl: e.target.value }))}
                  placeholder="https://www.credly.com/..."
                  className={inputCls}
                />
              </div>

              {/* Certificate Image / PDF Upload */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <label className={labelCls}>Certificate Document (Image or PDF)</label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Upload an image (.png, .jpg) or PDF document. If you upload a PDF, it will automatically generate a clean high-res preview image!
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.certificateImage && (
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-border bg-white dark:bg-darklight">
                      <Image
                        src={formData.certificateImage}
                        alt="Preview"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={formData.certificateImage || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, certificateImage: e.target.value }))}
                      placeholder="Image URL or upload certificate file..."
                      className={inputCls}
                    />
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs">
                        <span>Upload Certificate (PDF / Image)</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleCertUpload}
                          className="hidden"
                        />
                      </label>
                      {certProgress !== null && (
                        <span className="text-xs text-primary font-bold">
                          Uploading: {certProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Tags — with 5,500+ Auto-Suggest */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <div>
                  <label className={labelCls}>Verified Skills &amp; Competencies</label>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Search from 5,500+ skills — case-insensitive. Press Enter or click a suggestion.
                  </p>
                </div>

                {/* Popular quick-add chips */}
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CERT_SKILLS.map((skill) => {
                    const alreadyAdded = (formData.skills || []).some(
                      (s) => s.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <button
                        key={skill}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addSkill(skill)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                          alreadyAdded
                            ? "bg-primary/10 text-primary border-primary/30 opacity-60 cursor-not-allowed"
                            : "bg-white dark:bg-darklight border-border text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {alreadyAdded ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Input + suggestions dropdown */}
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillSuggestions[0] || undefined);
                        }
                        if (e.key === "Escape") {
                          setShowSkillSuggestions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 150)}
                      onFocus={() => {
                        if (skillSuggestions.length > 0) setShowSkillSuggestions(true);
                      }}
                      placeholder="Type to search 5,500+ skills (e.g. Packet Tracer, SIEM, Python)..."
                      className={inputCls}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => addSkill()}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Auto-suggest dropdown */}
                  {showSkillSuggestions && skillSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-darklight border border-border dark:border-dark_border rounded-xl shadow-lg overflow-hidden">
                      <div className="max-h-52 overflow-y-auto">
                        {skillSuggestions.map((suggestion, i) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addSkill(suggestion)}
                            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition flex items-center justify-between gap-2 ${
                              i === 0 ? "bg-primary/5 font-semibold text-primary" : "text-dark dark:text-white"
                            }`}
                          >
                            <span>{suggestion}</span>
                            {i === 0 && (
                              <span className="text-[10px] text-primary/60 shrink-0">↵ Enter</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-darkmode border-t border-border text-[10px] text-gray-400">
                        {skillSuggestions.length} result{skillSuggestions.length !== 1 ? "s" : ""} — case-insensitive search
                      </div>
                    </div>
                  )}
                </div>

                {/* Added skill tags */}
                {(formData.skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.skills?.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-darklight border border-border text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="text-red-400 hover:text-red-600 font-bold leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description / Learning Outcomes</label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Summary of course competencies and demonstrated knowledge..."
                  className={inputCls}
                />
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published !== false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-dark dark:text-white">
                    Publish (Visible to Public)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.featured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-dark dark:text-white">
                    Featured on Homepage Slider
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-dark_border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Certification"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};