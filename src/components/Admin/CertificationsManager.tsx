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
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CertificationItem,
  CertificationSettings,
  CertificateImageLayout,
  CERTIFICATION_CATEGORIES,
  defaultCertifications,
  defaultCertificationSettings,
  getCertificateImages,
  getPdfPageImageUrl,
} from "@/types/certification";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { searchSkills, skillExistsInDatabase, setCustomSkills } from "@/data/skillsDatabase";
import { loadCustomSkillsFromFirestore, registerCustomSkills } from "@/utils/customSkills";
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
    certificateImages: ["/images/portfolio/portfolio_1.jpg"],
    certificateImageLayout: "side-by-side",
    certificatePdfUrl: "",
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

  // Upload Progress & Image slots
  const [certProgress, setCertProgress] = useState<number | null>(null);
  const [certUploadSlot, setCertUploadSlot] = useState<number | null>(null);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [certificateImages, setCertificateImages] = useState<string[]>([""]);
  const [sectionViewCount, setSectionViewCount] = useState<number>(0);

  // PDF & Multi-Page Settings Modal State
  const [isPdfSettingsModalOpen, setIsPdfSettingsModalOpen] = useState<boolean>(false);
  const [pdfSettingsTargetUrl, setPdfSettingsTargetUrl] = useState<string>("");
  const [pdfPageCount, setPdfPageCount] = useState<number>(2);
  const [pdfSelectedPages, setPdfSelectedPages] = useState<number[]>([1, 2]);
  const [pdfChosenLayout, setPdfChosenLayout] = useState<CertificateImageLayout>("side-by-side");

  // ── Real-time Firestore Listeners ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    // 1. Real-time certifications collection listener
    const unsubCerts = onSnapshot(
      collection(db, "certifications"),
      (snapshot) => {
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
        setLoading(false);
      },
      (err) => {
        console.warn("Certifications listener notice:", err);
        setItems(defaultCertifications);
        setLoading(false);
      }
    );

    // 2. Real-time section view analytics listener
    const unsubAnalytics = onSnapshot(
      doc(db, "siteContent", "certificationAnalytics"),
      (snap) => {
        if (snap.exists()) {
          setSectionViewCount(Number(snap.data()?.sectionViewCount) || 0);
        }
      },
      (err) => console.warn("Analytics listener notice:", err)
    );

    // 3. Real-time custom skills listener
    const unsubCustomSkills = onSnapshot(
      doc(db, "siteContent", "customSkills"),
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.skills)) {
          setCustomSkills(snap.data().skills);
        }
      },
      (err) => console.warn("Custom skills listener notice:", err)
    );

    // Initial load of custom skills
    loadCustomSkillsFromFirestore();

    // 4. Slider settings fetch
    fetchSettings();

    return () => {
      unsubCerts();
      unsubAnalytics();
      unsubCustomSkills();
    };
  }, []);

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
      certificateImages: ["/images/portfolio/portfolio_1.jpg"],
      certificateImageLayout: "side-by-side",
      certificatePdfUrl: "",
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
    setCertificateImages([""]);
    setIsModalOpen(true);
  };

  // ── Open Editor for Existing ───────────────────────────────────────────────
  const handleEdit = (item: CertificationItem) => {
    setEditingItem(item);
    const imgs = getCertificateImages(item);
    setFormData({
      ...item,
      logoBgColor: item.logoBgColor || "transparent",
      logoShape: item.logoShape || "rounded",
      skills: item.skills || [],
      certificateImageLayout: item.certificateImageLayout || (imgs.length >= 2 ? "side-by-side" : "single"),
      certificatePdfUrl: item.certificatePdfUrl || "",
    });
    setCertificateImages(imgs.length > 0 ? imgs : [""]);
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

  const handleAddImageSlot = () => {
    if (certificateImages.length >= 4) {
      toast.error("Maximum 4 certificate images supported.");
      return;
    }
    setCertificateImages((prev) => [...prev, ""]);
  };

  const handleRemoveImageSlot = (index: number) => {
    if (certificateImages.length <= 1) return;
    setCertificateImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCertImageUrlChange = (index: number, value: string) => {
    setCertificateImages((prev) => prev.map((img, i) => (i === index ? value : img)));
    if (value.toLowerCase().includes(".pdf")) {
      setFormData((prev) => ({ ...prev, certificatePdfUrl: value }));
      setPdfSettingsTargetUrl(value);
    }
  };

  // ── Cloudinary Upload Handlers (Image or PDF) ──────────────────────────────
  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCertUploadSlot(slotIndex);
      setCertProgress(10);
      const res = await uploadToCloudinary(file, (p) => setCertProgress(p), "auto");
      const url = res.secure_url || res.url;

      if (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
        const previewPage1 = getPdfPageImageUrl(url, 1);
        const previewPage2 = getPdfPageImageUrl(url, 2);

        setCertificateImages([previewPage1, previewPage2]);
        setFormData((prev) => ({
          ...prev,
          certificatePdfUrl: url,
          certificateImageLayout: "side-by-side",
        }));

        setPdfSettingsTargetUrl(url);
        setPdfPageCount(2);
        setPdfSelectedPages([1, 2]);
        setPdfChosenLayout("side-by-side");
        setIsPdfSettingsModalOpen(true);

        toast.success("PDF uploaded! Multi-page layout settings opened to adjust pages.");
      } else {
        setCertificateImages((prev) =>
          prev.map((img, i) => (i === slotIndex ? url : img))
        );
        toast.success(`Certificate image ${slotIndex + 1} uploaded!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setCertProgress(null);
      setCertUploadSlot(null);
      e.target.value = "";
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

  // ── Skill Tag Management with 5,500+ Auto-Suggest & Auto-Save ──────────────
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

  const addSkill = async (skillToAdd?: string) => {
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

      // If new skill not in database, save to Firestore database immediately!
      if (!skillExistsInDatabase(raw)) {
        try {
          const added = await registerCustomSkills([raw]);
          if (added.length > 0) {
            toast.success(`New skill "${raw}" saved to database for future use! ✨`);
          }
        } catch (err) {
          console.warn("Could not save new custom skill:", err);
        }
      }
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
    const cleanedImages = certificateImages.map((img) => img.trim()).filter(Boolean);

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
      certificateImage: cleanedImages[0] || "",
      certificateImages: cleanedImages,
      certificateImageLayout: formData.certificateImageLayout || (cleanedImages.length >= 2 ? "side-by-side" : "single"),
      certificatePdfUrl: formData.certificatePdfUrl || "",
      skills: formData.skills || [],
      clickCount: editingItem?.clickCount || 0,
      hoverCount: editingItem?.hoverCount || 0,
      category: formData.category || "Cybersecurity",
      description: formData.description?.trim() || "",
      displayOrder: formData.displayOrder || items.length + 1,
      featured: !!formData.featured,
      published: formData.published !== false,
    };

    try {
      setSaving(true);
      const addedSkills = await registerCustomSkills(payload.skills);
      await setDoc(doc(db, "certifications", certId), payload);
      if (addedSkills.length > 0) {
        toast.success(`Saved! ${addedSkills.length} new skill(s) added to database.`);
      } else {
        toast.success(editingItem ? "Certification updated!" : "New certification created!");
      }
      setIsModalOpen(false);
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

      {/* Analytics Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Section Views</p>
          <p className="text-2xl font-bold text-primary">{sectionViewCount.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-1">Total certifications section visits</p>
        </div>
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Clicks</p>
          <p className="text-2xl font-bold text-dark dark:text-white">
            {items.reduce((sum, it) => sum + (it.clickCount || 0), 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Certificate preview & credential clicks</p>
        </div>
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Hovers</p>
          <p className="text-2xl font-bold text-dark dark:text-white">
            {items.reduce((sum, it) => sum + (it.hoverCount || 0), 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Cursor hover on certificate cards</p>
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
                  <th className="py-3.5 px-4 font-bold">Clicks</th>
                  <th className="py-3.5 px-4 font-bold">Hovers</th>
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
                            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-dark dark:text-white"
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

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200/60 dark:border-blue-900/40 font-bold text-xs" title="Clicks / details viewed">
                        <span>👆</span>
                        <span>{(item.clickCount || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-normal text-gray-400">clicks</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40 font-bold text-xs" title="Cursor hover views">
                        <span>🖱️</span>
                        <span>{(item.hoverCount || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-normal text-gray-400">hovers</span>
                      </span>
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

              {/* Certificate Images & Multi-Page / PDF Layout Manager */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60 dark:border-dark_border/60">
                  <div>
                    <label className={labelCls}>
                      Certificate Images &amp; Layout ({certificateImages.length}/4)
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Add 1 or multiple images. Choose how multiple pages / images are arranged on the card.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const firstPdf = formData.certificatePdfUrl || certificateImages.find((img) => img.toLowerCase().includes(".pdf")) || "";
                        setPdfSettingsTargetUrl(firstPdf);
                        setIsPdfSettingsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>⚙️</span>
                      <span>PDF Multi-Page Settings</span>
                    </button>
                    {certificateImages.length < 4 && (
                      <button
                        type="button"
                        onClick={handleAddImageSlot}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition cursor-pointer"
                      >
                        + Add Image Slot
                      </button>
                    )}
                  </div>
                </div>

                {/* Layout Choice Controls */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-darklight border border-border/80 dark:border-dark_border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark dark:text-white flex items-center gap-1.5">
                      <span>📐</span>
                      <span>Display Layout on Certificate Card:</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {formData.certificateImageLayout || "side-by-side"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Side-by-Side (depeththe) */}
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, certificateImageLayout: "side-by-side" }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                        (formData.certificateImageLayout || "side-by-side") === "side-by-side"
                          ? "bg-blue-50/70 dark:bg-blue-950/40 border-primary ring-2 ring-primary/30 shadow-xs"
                          : "bg-gray-50/80 dark:bg-darkmode border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark dark:text-white">🪟 Side-by-Side</span>
                        {(formData.certificateImageLayout || "side-by-side") === "side-by-side" && (
                          <span className="text-[10px] text-primary font-bold">✓ Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">2 columns (left &amp; right split, vertical line)</p>
                      {/* Mini Visual Icon */}
                      <div className="w-full h-8 rounded border border-dashed border-primary/50 grid grid-cols-2 gap-0.5 p-0.5 bg-white dark:bg-darkmode">
                        <div className="bg-primary/20 rounded-xs flex items-center justify-center text-[8px] font-bold text-primary">P1</div>
                        <div className="bg-primary/20 rounded-xs flex items-center justify-center text-[8px] font-bold text-primary">P2</div>
                      </div>
                    </button>

                    {/* 2. Stacked (uda yata) */}
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, certificateImageLayout: "stacked" }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                        formData.certificateImageLayout === "stacked"
                          ? "bg-purple-50/70 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-600/30 shadow-xs"
                          : "bg-gray-50/80 dark:bg-darkmode border-border hover:border-purple-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark dark:text-white">🥞 Stacked</span>
                        {formData.certificateImageLayout === "stacked" && (
                          <span className="text-[10px] text-purple-600 font-bold">✓ Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">2 rows (top &amp; bottom split, horizontal line)</p>
                      {/* Mini Visual Icon */}
                      <div className="w-full h-8 rounded border border-dashed border-purple-500/50 grid grid-rows-2 gap-0.5 p-0.5 bg-white dark:bg-darkmode">
                        <div className="bg-purple-500/20 rounded-xs flex items-center justify-center text-[8px] font-bold text-purple-600">P1 (Top)</div>
                        <div className="bg-purple-500/20 rounded-xs flex items-center justify-center text-[8px] font-bold text-purple-600">P2 (Bottom)</div>
                      </div>
                    </button>

                    {/* 3. Single / Tabs */}
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, certificateImageLayout: "tabs" }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                        formData.certificateImageLayout === "tabs" || formData.certificateImageLayout === "single"
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs"
                          : "bg-gray-50/80 dark:bg-darkmode border-border hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark dark:text-white">📑 Page Switcher</span>
                        {(formData.certificateImageLayout === "tabs" || formData.certificateImageLayout === "single") && (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Active</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500">Full cover with page switch dots / pills</p>
                      {/* Mini Visual Icon */}
                      <div className="w-full h-8 rounded border border-dashed border-emerald-500/50 p-1 flex items-center justify-between bg-white dark:bg-darkmode">
                        <span className="text-[9px] font-bold text-emerald-600">Full Page</span>
                        <div className="flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* PDF Link Indicator if present */}
                {formData.certificatePdfUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">📄</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-dark dark:text-white">Attached PDF Document</p>
                        <p className="text-[10px] text-gray-500 truncate">{formData.certificatePdfUrl}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfSettingsTargetUrl(formData.certificatePdfUrl || "");
                        setIsPdfSettingsModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition shrink-0 cursor-pointer shadow-2xs"
                    >
                      Adjust Pages ⚙️
                    </button>
                  </div>
                )}

                {/* Individual Image Slots */}
                {certificateImages.map((imgUrl, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="p-3.5 rounded-xl bg-white dark:bg-darklight border border-border/60 dark:border-dark_border/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-dark dark:text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-bold">
                          {slotIdx + 1}
                        </span>
                        <span>Image / Page {slotIdx + 1}</span>
                        {slotIdx === 0 && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            {(formData.certificateImageLayout || "side-by-side") === "side-by-side" ? "(Left Half)" : (formData.certificateImageLayout || "side-by-side") === "stacked" ? "(Top Half)" : "(Primary)"}
                          </span>
                        )}
                        {slotIdx === 1 && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            {(formData.certificateImageLayout || "side-by-side") === "side-by-side" ? "(Right Half)" : (formData.certificateImageLayout || "side-by-side") === "stacked" ? "(Bottom Half)" : "(Page 2)"}
                          </span>
                        )}
                      </span>
                      {certificateImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageSlot(slotIdx)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {imgUrl ? (
                        <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-border bg-white dark:bg-darklight shadow-2xs">
                          <Image
                            src={imgUrl}
                            alt={`Preview ${slotIdx + 1}`}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-24 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                          Empty Slot
                        </div>
                      )}
                      <div className="flex-1 w-full space-y-2">
                        <input
                          type="text"
                          value={imgUrl}
                          onChange={(e) => handleCertImageUrlChange(slotIdx, e.target.value)}
                          placeholder="Image URL or upload certificate file/PDF..."
                          className={inputCls}
                        />
                        <div className="flex items-center gap-3">
                          <label className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs">
                            <span>Upload Image or PDF</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleCertUpload(e, slotIdx)}
                              className="hidden"
                            />
                          </label>
                          {certProgress !== null && certUploadSlot === slotIdx && (
                            <span className="text-xs text-primary font-bold">
                              Uploading: {certProgress}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* ═══════════ PDF & MULTI-PAGE DOCUMENT SETTINGS MODAL ═══════════ */}
      {isPdfSettingsModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-darklight rounded-3xl border border-border dark:border-dark_border shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 my-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border dark:border-dark_border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl">
                  📄
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-dark dark:text-white leading-tight">
                    Multi-Page Document &amp; PDF Layout Settings
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Configure how multi-page certificates or PDFs are displayed on the public card.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode text-gray-500 hover:text-dark dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document PDF URL */}
            <div className="space-y-1.5">
              <label className={labelCls}>PDF Document URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pdfSettingsTargetUrl}
                  onChange={(e) => setPdfSettingsTargetUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../cert.pdf"
                  className={inputCls}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Cloudinary automatically generates high-resolution page previews (`pg_1`, `pg_2`, etc.).
              </p>
            </div>

            {/* Total Pages in Document */}
            <div className="space-y-2">
              <label className={labelCls}>How many pages does this certificate / document have?</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setPdfPageCount(cnt);
                      if (cnt === 1) {
                        setPdfSelectedPages([1]);
                        setPdfChosenLayout("single");
                      } else {
                        setPdfSelectedPages([1, 2]);
                        setPdfChosenLayout("side-by-side");
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      pdfPageCount === cnt
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-gray-50 dark:bg-darkmode text-gray-600 dark:text-gray-300 border-border hover:border-purple-500/50"
                    }`}
                  >
                    {cnt} {cnt === 1 ? "Page" : "Pages"}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages to display */}
            {pdfPageCount > 1 && (
              <div className="space-y-2">
                <label className={labelCls}>Select pages to include in the preview card:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.from({ length: pdfPageCount }, (_, i) => i + 1).map((pg) => {
                    const isChecked = pdfSelectedPages.includes(pg);
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (pdfSelectedPages.length > 1) {
                              setPdfSelectedPages((prev) => prev.filter((p) => p !== pg));
                            }
                          } else {
                            setPdfSelectedPages((prev) => [...prev, pg].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-primary/10 text-primary border-primary/40 ring-1 ring-primary/40"
                            : "bg-gray-50 dark:bg-darkmode text-gray-500 border-border"
                        }`}
                      >
                        <span>{isChecked ? "☑" : "☐"}</span>
                        <span>Page {pg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Display Layout Choice (Matches User's 2 Drawings) */}
            <div className="space-y-2.5">
              <label className={labelCls}>How to arrange pages on the certificate card:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Side-by-Side (User's Drawing 1: Vertical Red Line Down Middle) */}
                <button
                  type="button"
                  onClick={() => setPdfChosenLayout("side-by-side")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                    pdfChosenLayout === "side-by-side"
                      ? "bg-blue-50/70 dark:bg-blue-950/40 border-primary ring-2 ring-primary/30 shadow-xs"
                      : "bg-gray-50/70 dark:bg-darkmode border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark dark:text-white">🪟 Side-by-Side</span>
                    {pdfChosenLayout === "side-by-side" && (
                      <span className="text-[10px] text-primary font-bold">✓ Selected</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    2 columns side-by-side with vertical dividing line (left &amp; right)
                  </p>
                  {/* Miniature diagram replicating image 1 */}
                  <div className="w-full h-14 rounded-lg border-2 border-dashed border-primary/60 grid grid-cols-2 divide-x-2 divide-red-500 bg-white dark:bg-darklight p-1">
                    <div className="flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
                      Page 1
                    </div>
                    <div className="flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
                      Page 2
                    </div>
                  </div>
                </button>

                {/* 2. Stacked (User's Drawing 2: Horizontal Red Line Across Middle) */}
                <button
                  type="button"
                  onClick={() => setPdfChosenLayout("stacked")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                    pdfChosenLayout === "stacked"
                      ? "bg-purple-50/70 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-600/30 shadow-xs"
                      : "bg-gray-50/70 dark:bg-darkmode border-border hover:border-purple-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark dark:text-white">🥞 Stacked</span>
                    {pdfChosenLayout === "stacked" && (
                      <span className="text-[10px] text-purple-600 font-bold">✓ Selected</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    2 rows stacked with horizontal dividing line (top &amp; bottom)
                  </p>
                  {/* Miniature diagram replicating image 2 */}
                  <div className="w-full h-14 rounded-lg border-2 border-dashed border-purple-500/60 grid grid-rows-2 divide-y-2 divide-red-500 bg-white dark:bg-darklight p-1">
                    <div className="flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
                      Page 1 (Top)
                    </div>
                    <div className="flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
                      Page 2 (Bottom)
                    </div>
                  </div>
                </button>

                {/* 3. Single Cover / Switcher */}
                <button
                  type="button"
                  onClick={() => setPdfChosenLayout("single")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                    pdfChosenLayout === "single" || pdfChosenLayout === "tabs"
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600 ring-2 ring-emerald-600/30 shadow-xs"
                      : "bg-gray-50/70 dark:bg-darkmode border-border hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark dark:text-white">📑 Single Cover</span>
                    {(pdfChosenLayout === "single" || pdfChosenLayout === "tabs") && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Selected</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Single prominent cover page (with page switcher pills)
                  </p>
                  {/* Miniature diagram */}
                  <div className="w-full h-14 rounded-lg border-2 border-dashed border-emerald-500/60 p-2 flex items-center justify-center bg-white dark:bg-darklight text-[9px] font-bold text-emerald-600">
                    Full Cover (Page 1)
                  </div>
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Live Preview of Card Output:
              </span>
              <div className="w-full h-44 rounded-2xl border border-border dark:border-dark_border bg-slate-900/5 dark:bg-slate-950/50 p-2 overflow-hidden flex items-center justify-center">
                {pdfChosenLayout === "side-by-side" && pdfSelectedPages.length >= 2 ? (
                  <div className="grid grid-cols-2 w-full h-full gap-1 rounded-xl overflow-hidden bg-border/40 dark:bg-dark_border/60 p-0.5">
                    {pdfSelectedPages.slice(0, 2).map((pg) => {
                      const img = getPdfPageImageUrl(pdfSettingsTargetUrl, pg);
                      return (
                        <div key={pg} className="relative w-full h-full bg-white dark:bg-darkmode rounded flex items-center justify-center overflow-hidden">
                          {img ? (
                            <Image
                              src={img}
                              alt={`Page ${pg}`}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">Page {pg}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : pdfChosenLayout === "stacked" && pdfSelectedPages.length >= 2 ? (
                  <div className="grid grid-rows-2 w-full h-full gap-1 rounded-xl overflow-hidden bg-border/40 dark:bg-dark_border/60 p-0.5">
                    {pdfSelectedPages.slice(0, 2).map((pg) => {
                      const img = getPdfPageImageUrl(pdfSettingsTargetUrl, pg);
                      return (
                        <div key={pg} className="relative w-full h-full bg-white dark:bg-darkmode rounded flex items-center justify-center overflow-hidden">
                          {img ? (
                            <Image
                              src={img}
                              alt={`Page ${pg}`}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">Page {pg}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-white dark:bg-darkmode rounded-xl flex items-center justify-center overflow-hidden">
                    {pdfSettingsTargetUrl ? (
                      <Image
                        src={getPdfPageImageUrl(pdfSettingsTargetUrl, pdfSelectedPages[0] || 1)}
                        alt="Page 1"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">Page 1 Cover</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-dark_border">
              <button
                type="button"
                onClick={() => setIsPdfSettingsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetUrl = pdfSettingsTargetUrl.trim() || formData.certificatePdfUrl || "";
                  if (!targetUrl) {
                    toast.error("Please provide a valid PDF or document URL.");
                    return;
                  }

                  const generatedImgs = pdfSelectedPages.map((pg) =>
                    getPdfPageImageUrl(targetUrl, pg)
                  );

                  setCertificateImages(generatedImgs);
                  setFormData((prev) => ({
                    ...prev,
                    certificatePdfUrl: targetUrl,
                    certificateImageLayout: pdfChosenLayout,
                    pdfPagesCount: pdfPageCount,
                  }));

                  setIsPdfSettingsModalOpen(false);
                  toast.success(`Applied ${generatedImgs.length} page(s) with ${pdfChosenLayout} layout! ✨`);
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>✓ Apply Pages &amp; Layout to Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CertificationsManager;