"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import {
  TechItem,
  TechCategory,
  TechStackSection,
  defaultTechStackSection,
  defaultCategories,
  defaultTechItems,
} from "@/types/techstack";

// ── Types ─────────────────────────────────────────────────────────────────────
type SubTab = "items" | "categories" | "settings";

const PROFICIENCY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

// ── Icon renderer (admin preview) ─────────────────────────────────────────────
function PreviewIcon({ item }: { item: Partial<TechItem> }) {
  if (!item.iconValue) return <span className="text-2xl text-gray-400">?</span>;
  if (item.iconType === "devicon") {
    return <i className={`${item.iconValue} text-3xl`} />;
  }
  if (item.iconType === "url") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.iconValue} alt="" className="w-8 h-8 object-contain" />
    );
  }
  return <span className="text-3xl">{item.iconValue}</span>;
}

// ── Default form states ───────────────────────────────────────────────────────
const defaultItemForm = (): Omit<TechItem, "id"> => ({
  name: "",
  iconType: "devicon",
  iconValue: "",
  categoryId: "",
  proficiency: 3,
  published: true,
  order: 99,
});

const defaultCatForm = (): Omit<TechCategory, "id"> => ({
  name: "",
  color: "#0a66c2",
  order: 99,
  published: true,
});

// ═════════════════════════════════════════════════════════════════════════════
export function TechStackManager() {
  const [subTab, setSubTab] = useState<SubTab>("items");

  // Data
  const [categories, setCategories] = useState<TechCategory[]>([]);
  const [items, setItems] = useState<TechItem[]>([]);
  const [sectionContent, setSectionContent] = useState<TechStackSection>(defaultTechStackSection);
  const [sectionDirty, setSectionDirty] = useState(false);
  const [sectionSaving, setSectionSaving] = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<Omit<TechItem, "id">>(defaultItemForm());
  const [itemSaving, setItemSaving] = useState(false);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<Omit<TechCategory, "id">>(defaultCatForm());
  const [catSaving, setCatSaving] = useState(false);

  // Filter
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Load section content
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteContent", "techstack"), (snap) => {
      if (snap.exists()) setSectionContent({ ...defaultTechStackSection, ...(snap.data() as TechStackSection) });
    });
    return () => unsub();
  }, []);

  // Load categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "techCategories"), (snap) => {
      const cats: TechCategory[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<TechCategory, "id">) }))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setCategories(cats);
    });
    return () => unsub();
  }, []);

  // Load tech items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "techItems"), (snap) => {
      const techItems: TechItem[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<TechItem, "id">) }))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setItems(techItems);
    });
    return () => unsub();
  }, []);

  // ── Seed defaults ──────────────────────────────────────────────────────────
  const handleSeedDefaults = async () => {
    if (!confirm("This will add default categories and tech items to Firestore. Continue?")) return;
    try {
      // Seed categories first with known IDs
      const catIdMap: Record<string, string> = {
        "Languages": "languages",
        "Frameworks & Libraries": "frameworks",
        "DevOps & Cloud": "devops",
        "Databases": "databases",
        "Tools & Platforms": "tools",
        "Security & Networking": "security",
      };
      for (const cat of defaultCategories) {
        const catId = catIdMap[cat.name] ?? cat.name.toLowerCase().replace(/\s+/g, "-");
        await setDoc(doc(db, "techCategories", catId), { ...cat, createdAt: serverTimestamp() });
      }
      for (const item of defaultTechItems) {
        await addDoc(collection(db, "techItems"), { ...item, createdAt: serverTimestamp() });
      }
      toast.success("Default tech stack seeded!");
    } catch (e: any) {
      toast.error(e.message || "Seed failed");
    }
  };

  // ── Save section settings ──────────────────────────────────────────────────
  const saveSectionContent = async () => {
    setSectionSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "techstack"), sectionContent, { merge: true });
      setSectionDirty(false);
      toast.success("Section settings saved!");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSectionSaving(false);
    }
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────
  const openAddItem = () => {
    setEditItemId(null);
    setItemForm(defaultItemForm());
    setShowItemModal(true);
  };

  const openEditItem = (item: TechItem) => {
    setEditItemId(item.id);
    const { id, ...rest } = item;
    setItemForm(rest);
    setShowItemModal(true);
  };

  const saveItem = async () => {
    if (!itemForm.name.trim()) { toast.error("Name is required"); return; }
    if (!itemForm.iconValue.trim()) { toast.error("Icon value is required"); return; }
    if (!itemForm.categoryId) { toast.error("Please select a category"); return; }
    setItemSaving(true);
    try {
      if (editItemId) {
        await updateDoc(doc(db, "techItems", editItemId), { ...itemForm, updatedAt: serverTimestamp() });
        toast.success("Tech item updated!");
      } else {
        await addDoc(collection(db, "techItems"), { ...itemForm, createdAt: serverTimestamp() });
        toast.success("Tech item added!");
      }
      setShowItemModal(false);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setItemSaving(false);
    }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "techItems", id));
      toast.success(`"${name}" deleted`);
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const toggleItemPublished = async (item: TechItem) => {
    try {
      await updateDoc(doc(db, "techItems", item.id), { published: !item.published, updatedAt: serverTimestamp() });
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  // ── Category CRUD ──────────────────────────────────────────────────────────
  const openAddCat = () => {
    setEditCatId(null);
    setCatForm(defaultCatForm());
    setShowCatModal(true);
  };

  const openEditCat = (cat: TechCategory) => {
    setEditCatId(cat.id);
    const { id, ...rest } = cat;
    setCatForm(rest);
    setShowCatModal(true);
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) { toast.error("Name is required"); return; }
    setCatSaving(true);
    try {
      if (editCatId) {
        await updateDoc(doc(db, "techCategories", editCatId), { ...catForm, updatedAt: serverTimestamp() });
        toast.success("Category updated!");
      } else {
        const catId = catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "techCategories", catId), { ...catForm, createdAt: serverTimestamp() });
        toast.success("Category added!");
      }
      setShowCatModal(false);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCat = async (id: string, name: string) => {
    const usedCount = items.filter((i) => i.categoryId === id).length;
    if (usedCount > 0 && !confirm(`"${name}" has ${usedCount} items. Delete anyway?`)) return;
    if (usedCount === 0 && !confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "techCategories", id));
      toast.success(`"${name}" deleted`);
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  // ── Filtered items ─────────────────────────────────────────────────────────
  const displayItems = items.filter((item) => {
    const matchesCat = filterCat === "all" || item.categoryId === filterCat;
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Tech Stack & Skills</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage languages, frameworks, tools and expertise categories
          </p>
        </div>
        <button
          onClick={handleSeedDefaults}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-darklight text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkmode transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Seed Defaults
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-border dark:border-dark_border pb-0">
        {(["items", "categories", "settings"] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
              subTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white"
            }`}
          >
            {tab === "items" ? "Tech Items" : tab === "categories" ? "Categories" : "Section Settings"}
          </button>
        ))}
      </div>

      {/* ── Tab: Tech Items ────────────────────────────────────────────────── */}
      {subTab === "items" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search tech items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darklight text-sm text-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-white dark:bg-darklight text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={openAddItem}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          {/* Items count */}
          <p className="text-xs text-gray-400">
            Showing {displayItems.length} of {items.length} items
          </p>

          {/* Items Grid */}
          {displayItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">No tech items yet.</p>
              <p className="text-xs mt-1">Click "Add Item" or "Seed Defaults"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayItems.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      item.published
                        ? "bg-white dark:bg-darklight border-gray-100 dark:border-dark_border"
                        : "bg-gray-50 dark:bg-darkmode border-dashed border-gray-200 dark:border-gray-700 opacity-60"
                    }`}
                  >
                    {/* Category color dot */}
                    {cat && (
                      <span
                        className="absolute top-2 left-2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        title={cat.name}
                      />
                    )}

                    <PreviewIcon item={item} />
                    <span className="text-xs font-semibold text-center text-dark dark:text-white leading-tight">
                      {item.name}
                    </span>
                    {item.proficiency && (
                      <span className="text-[10px] text-gray-400">
                        {PROFICIENCY_LABELS[item.proficiency] ?? ""}
                      </span>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => toggleItemPublished(item)}
                        title={item.published ? "Unpublish" : "Publish"}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          item.published
                            ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.published ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditItem(item)}
                        className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-200 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteItem(item.id, item.name)}
                        className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-200 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Categories ────────────────────────────────────────────────── */}
      {subTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAddCat}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm font-medium">No categories yet. Click "Add Category" or "Seed Defaults".</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const catItemCount = items.filter((i) => i.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-darklight border border-border dark:border-dark_border"
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-dark dark:text-white">{cat.name}</p>
                      <p className="text-xs text-gray-400">
                        {catItemCount} item{catItemCount !== 1 ? "s" : ""} · Order: {cat.order}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.published
                        ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}>
                      {cat.published ? "Published" : "Hidden"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditCat(cat)}
                        className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-200 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteCat(cat.id, cat.name)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-200 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Section Settings ──────────────────────────────────────────── */}
      {subTab === "settings" && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6 space-y-5">
            <h3 className="text-base font-bold text-dark dark:text-white">Section Header Content</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Badge Text
              </label>
              <input
                type="text"
                value={sectionContent.badge}
                onChange={(e) => { setSectionContent({ ...sectionContent, badge: e.target.value }); setSectionDirty(true); }}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Heading
              </label>
              <input
                type="text"
                value={sectionContent.heading}
                onChange={(e) => { setSectionContent({ ...sectionContent, heading: e.target.value }); setSectionDirty(true); }}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Subheading
              </label>
              <textarea
                rows={3}
                value={sectionContent.subheading}
                onChange={(e) => { setSectionContent({ ...sectionContent, subheading: e.target.value }); setSectionDirty(true); }}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={saveSectionContent}
              disabled={!sectionDirty || sectionSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {sectionSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Item Add/Edit Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-darklight rounded-2xl shadow-2xl border border-border dark:border-dark_border max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border dark:border-dark_border">
              <h2 className="text-lg font-bold text-dark dark:text-white">
                {editItemId ? "Edit Tech Item" : "Add Tech Item"}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-darkmode transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. React, Python, Docker..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Category *</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Icon Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Icon Type *</label>
                <div className="flex gap-2">
                  {(["devicon", "url", "emoji"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setItemForm({ ...itemForm, iconType: type })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                        itemForm.iconType === type
                          ? "bg-primary text-white border-primary"
                          : "bg-white dark:bg-darkmode border-border dark:border-dark_border text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {type === "devicon" ? "Devicon Class" : type === "url" ? "Image URL" : "Emoji"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Value */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {itemForm.iconType === "devicon" ? "Devicon Class" : itemForm.iconType === "url" ? "Image URL" : "Emoji"} *
                </label>
                <input
                  type="text"
                  value={itemForm.iconValue}
                  onChange={(e) => setItemForm({ ...itemForm, iconValue: e.target.value })}
                  placeholder={
                    itemForm.iconType === "devicon"
                      ? "e.g. devicon-react-original colored"
                      : itemForm.iconType === "url"
                      ? "https://example.com/icon.png"
                      : "e.g. 🐍"
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {itemForm.iconType === "devicon" && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Find classes at{" "}
                    <a href="https://devicon.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      devicon.dev
                    </a>
                  </p>
                )}
              </div>

              {/* Icon Preview */}
              {itemForm.iconValue && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                  <PreviewIcon item={itemForm} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{itemForm.name || "Preview"}</span>
                </div>
              )}

              {/* Proficiency */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Proficiency — {PROFICIENCY_LABELS[itemForm.proficiency ?? 3] ?? ""}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={itemForm.proficiency ?? 3}
                  onChange={(e) => setItemForm({ ...itemForm, proficiency: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Beginner</span><span>Expert</span>
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Display Order</label>
                <input
                  type="number"
                  value={itemForm.order}
                  onChange={(e) => setItemForm({ ...itemForm, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Published */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                <span className="text-sm font-semibold text-dark dark:text-white">Published</span>
                <button
                  onClick={() => setItemForm({ ...itemForm, published: !itemForm.published })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${itemForm.published ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${itemForm.published ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border dark:border-dark_border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveItem}
                  disabled={itemSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition shadow-md shadow-primary/20"
                >
                  {itemSaving ? "Saving..." : editItemId ? "Update" : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-darklight rounded-2xl shadow-2xl border border-border dark:border-dark_border">
            <div className="p-6 border-b border-border dark:border-dark_border">
              <h2 className="text-lg font-bold text-dark dark:text-white">
                {editCatId ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowCatModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-darkmode transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Name *</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Languages, Frameworks..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-border dark:border-dark_border"
                  />
                  <input
                    type="text"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Display Order</label>
                <input
                  type="number"
                  value={catForm.order}
                  onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-dark_border bg-gray-50 dark:bg-darkmode text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                <span className="text-sm font-semibold text-dark dark:text-white">Published</span>
                <button
                  onClick={() => setCatForm({ ...catForm, published: !catForm.published })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${catForm.published ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${catForm.published ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border dark:border-dark_border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCat}
                  disabled={catSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition shadow-md shadow-primary/20"
                >
                  {catSaving ? "Saving..." : editCatId ? "Update" : "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
