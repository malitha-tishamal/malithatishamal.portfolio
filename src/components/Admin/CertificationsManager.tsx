"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CertificationItem,
  CERTIFICATION_CATEGORIES,
  defaultCertifications,
} from "@/types/certification";
import { uploadToCloudinary } from "@/utils/cloudinary";
import toast from "react-hot-toast";

export const CertificationsManager: React.FC = () => {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CertificationItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CertificationItem>>({
    title: "",
    issuer: "Cisco Networking Academy",
    issuerLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Cisco_logo_blue_2016.svg/1200px-Cisco_logo_blue_2016.svg.png",
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

  useEffect(() => {
    fetchItems();
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
    setIsModalOpen(true);
  };

  // ── Open Editor for Existing ───────────────────────────────────────────────
  const handleEdit = (item: CertificationItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      skills: item.skills || [],
    });
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

  // ── Skill Tag Management ───────────────────────────────────────────────────
  const addSkill = () => {
    if (!newSkill.trim()) return;
    const clean = newSkill.trim();
    if (!formData.skills?.includes(clean)) {
      setFormData((prev) => ({ ...prev, skills: [...(prev.skills || []), clean] }));
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
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
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-darkmode/50 transition"
                  >
                    {/* Order Controls */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-gray-400 w-4">{item.displayOrder || index + 1}</span>
                        <button
                          onClick={() => handleMoveOrder(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveOrder(index, "down")}
                          disabled={index === items.length - 1}
                          className="p-1 text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>
                    </td>

                    {/* Certification Title & Issuer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center p-1.5 shrink-0 border border-gray-800">
                          {item.issuerLogo ? (
                            <Image
                              src={item.issuerLogo}
                              alt={item.issuer}
                              width={32}
                              height={32}
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px] font-bold">CERT</span>
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
                ))}
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
                        className="object-cover"
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

              {/* Skills Tags */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-2">
                <label className={labelCls}>Verified Skills & Competencies</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type skill and press Enter or click Add (e.g. Threat Detection)..."
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.skills?.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-darklight border border-border text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="text-red-400 hover:text-red-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
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