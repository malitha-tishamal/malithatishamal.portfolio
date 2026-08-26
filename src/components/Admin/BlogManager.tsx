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
import { BlogPost, BLOG_CATEGORIES, defaultBlogPosts, RelatedLink } from "@/types/blog";
import { uploadToCloudinary } from "@/utils/cloudinary";
import toast from "react-hot-toast";

export const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    category: "Technology & AI",
    coverImage: "/images/blog/blog_1.png",
    content: "",
    additionalImages: [],
    author: {
      name: "Malitha Tishamal",
      role: "Lead Full Stack & Cloud Architect",
      avatar: "/images/hero/hero-image.png",
    },
    date: new Date().toISOString().split("T")[0],
    readingTime: "5 min read",
    tags: ["Technology", "NextJS"],
    relatedLinks: [],
    featured: false,
    published: true,
  });

  // Helper inputs for tags & related links
  const [newTag, setNewTag] = useState<string>("");
  const [newLinkTitle, setNewLinkTitle] = useState<string>("");
  const [newLinkUrl, setNewLinkUrl] = useState<string>("");
  const [newLinkType, setNewLinkType] = useState<"github" | "live" | "docs" | "external">("live");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Upload Progress
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [authorAvatarProgress, setAuthorAvatarProgress] = useState<number | null>(null);
  const [galleryProgress, setGalleryProgress] = useState<number | null>(null);

  // ── Fetch Blogs ─────────────────────────────────────────────────────────────
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogsRef = collection(db, "blogs");
      const q = query(blogsRef);
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const list: BlogPost[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BlogPost, "id">),
        }));

        list.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setPosts(list);
      } else {
        setPosts(defaultBlogPosts);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      toast.error("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // ── Seed Default Blogs ──────────────────────────────────────────────────────
  const handleSeedDefaults = async () => {
    if (!confirm("This will seed default engineering & news articles to Firestore. Continue?")) {
      return;
    }

    try {
      setSeeding(true);
      for (const item of defaultBlogPosts) {
        const docRef = doc(db, "blogs", item.id);
        await setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Default articles seeded successfully!");
      fetchBlogs();
    } catch (err) {
      console.error("Error seeding defaults:", err);
      toast.error("Failed to seed default articles.");
    } finally {
      setSeeding(false);
    }
  };

  // ── Open Editor for New Post ────────────────────────────────────────────────
  const handleAddNew = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      excerpt: "",
      category: "Technology & AI",
      coverImage: "/images/blog/blog_1.png",
      content: `## Article Overview\n\nWrite your article introduction here.\n\n### Key Highlights\n\n- Highlight point 1\n- Highlight point 2\n\n> "Add an impactful quote or summary here."\n\n### In-Depth Breakdown\n\nDetailed explanations with diagrams and architecture discussions.`,
      additionalImages: [],
      author: {
        name: "Malitha Tishamal",
        role: "Lead Full Stack & Cloud Architect",
        avatar: "/images/hero/hero-image.png",
      },
      date: new Date().toISOString().split("T")[0],
      readingTime: "5 min read",
      tags: ["Tech", "Engineering"],
      relatedLinks: [],
      featured: false,
      published: true,
      order: posts.length + 1,
    });
    setIsModalOpen(true);
  };

  // ── Open Editor for Existing Post ───────────────────────────────────────────
  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      ...post,
      tags: post.tags || [],
      relatedLinks: post.relatedLinks || [],
      additionalImages: post.additionalImages || [],
    });
    setIsModalOpen(true);
  };

  // ── Delete Post ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteDoc(doc(db, "blogs", id));
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Article deleted.");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete article.");
    }
  };

  // ── Slug Generator Helper ───────────────────────────────────────────────────
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !editingPost && (!prev.slug || prev.slug === generateSlug(prev.title || "")) ? generateSlug(val) : prev.slug,
    }));
  };

  // ── Cloudinary Upload Handlers ──────────────────────────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCoverProgress(10);
      const res = await uploadToCloudinary(file, (p) => setCoverProgress(p));
      const url = res.secure_url || res.url;
      setFormData((prev) => ({ ...prev, coverImage: url }));
      toast.success("Cover image uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Cover image upload failed.");
    } finally {
      setCoverProgress(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAuthorAvatarProgress(10);
      const res = await uploadToCloudinary(file, (p) => setAuthorAvatarProgress(p));
      const url = res.secure_url || res.url;
      setFormData((prev) => ({
        ...prev,
        author: {
          name: prev.author?.name || "Malitha Tishamal",
          role: prev.author?.role || "Author",
          avatar: url,
        },
      }));
      toast.success("Author avatar uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Avatar upload failed.");
    } finally {
      setAuthorAvatarProgress(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setGalleryProgress(10);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadToCloudinary(files[i], (p) => setGalleryProgress(p));
        newUrls.push(res.secure_url || res.url);
      }
      setFormData((prev) => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...newUrls],
      }));
      toast.success(`${newUrls.length} screenshot(s) uploaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Gallery upload failed.");
    } finally {
      setGalleryProgress(null);
    }
  };

  const removeGalleryImage = (index: number) => {
    const updated = [...(formData.additionalImages || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, additionalImages: updated }));
  };

  // ── Tag Management ──────────────────────────────────────────────────────────
  const addTag = () => {
    if (!newTag.trim()) return;
    const clean = newTag.trim().replace(/^#/, "");
    if (!formData.tags?.includes(clean)) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), clean] }));
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  // ── Related Links Management ────────────────────────────────────────────────
  const addRelatedLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.error("Please provide both title and URL for the link.");
      return;
    }
    const newEntry: RelatedLink = {
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      type: newLinkType,
    };
    setFormData((prev) => ({
      ...prev,
      relatedLinks: [...(prev.relatedLinks || []), newEntry],
    }));
    setNewLinkTitle("");
    setNewLinkUrl("");
  };

  const removeRelatedLink = (index: number) => {
    const updated = [...(formData.relatedLinks || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, relatedLinks: updated }));
  };

  // ── Save Form (Create or Update) ────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Title is required.");
      return;
    }

    const postSlug = formData.slug?.trim() || generateSlug(formData.title);
    const postId = editingPost ? editingPost.id : `blog-${Date.now()}`;

    const payload: BlogPost = {
      id: postId,
      slug: postSlug,
      title: formData.title.trim(),
      subtitle: formData.subtitle?.trim() || "",
      excerpt: formData.excerpt?.trim() || formData.title.trim(),
      category: formData.category || "Technology & AI",
      coverImage: formData.coverImage || "/images/blog/blog_1.png",
      content: formData.content || "",
      additionalImages: formData.additionalImages || [],
      author: {
        name: formData.author?.name || "Malitha Tishamal",
        role: formData.author?.role || "Author",
        avatar: formData.author?.avatar || "/images/hero/hero-image.png",
      },
      date: formData.date || new Date().toISOString().split("T")[0],
      readingTime: formData.readingTime || "5 min read",
      tags: formData.tags || [],
      relatedLinks: formData.relatedLinks || [],
      featured: !!formData.featured,
      published: formData.published !== false,
      order: formData.order || 1,
      updatedAt: serverTimestamp(),
      ...(editingPost ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      setSaving(true);
      await setDoc(doc(db, "blogs", postId), payload);

      toast.success(editingPost ? "Article updated successfully!" : "New article published!");
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error("Error saving blog post:", err);
      toast.error("Failed to save article.");
    } finally {
      setSaving(false);
    }
  };

  // ── Quick Status Toggle ─────────────────────────────────────────────────────
  const togglePublished = async (post: BlogPost) => {
    try {
      const updated = !post.published;
      await setDoc(doc(db, "blogs", post.id), { published: updated }, { merge: true });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: updated } : p)));
      toast.success(updated ? "Article published!" : "Article converted to draft.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  // Filtered List for Table
  const filteredList = posts.filter((p) => {
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
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
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h2 className="text-xl font-bold text-dark dark:text-white">
              Blog & News Manager
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Publish, edit, and organize dynamic articles, tech news, and architecture deep dives.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>{seeding ? "Seeding..." : "✦ Seed Default Articles"}</span>
          </button>

          <button
            onClick={handleAddNew}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ New Article</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-darklight p-4 rounded-2xl border border-border dark:border-dark_border shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or slug..."
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

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none"
          >
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          {filteredList.length} article{filteredList.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table / Article List */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading articles...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm font-semibold mb-2">No articles found</p>
            <p className="text-xs">Click &quot;+ New Article&quot; or &quot;Seed Default Articles&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 dark:bg-darkmode border-b border-border dark:border-dark_border text-gray-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Article</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark_border/60">
                {filteredList.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-darkmode/50 transition"
                  >
                    {/* Title & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-darkmode shrink-0 relative border border-border/40">
                          <Image
                            src={post.coverImage || "/images/blog/blog_1.png"}
                            alt={post.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="max-w-md">
                          <p className="font-bold text-dark dark:text-white line-clamp-1">
                            {post.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            /blog/{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {post.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-500">
                      {post.date}
                    </td>

                    {/* Status toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(post)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          post.published !== false
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-gray-200 dark:bg-darkmode text-gray-500 border border-border"
                        }`}
                      >
                        {post.published !== false ? "✓ Published" : "Draft"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Live Article"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition cursor-pointer"
                        >
                          👁
                        </a>
                        <button
                          onClick={() => handleEdit(post)}
                          title="Edit Article"
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          title="Delete Article"
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

      {/* ──────────────── EDIT / CREATE MODAL DRAWER ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-darklight w-full max-w-4xl max-h-[92vh] rounded-3xl border border-border dark:border-dark_border shadow-2xl overflow-y-auto p-6 sm:p-8 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-border dark:border-dark_border mb-6">
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">
                  {editingPost ? "Edit Article" : "Create New Article"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure article content, images, author, and related resources.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode text-gray-500 hover:text-dark dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Title & Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Article Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ""}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Building Scalable Cloud Native Microservices"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                    placeholder="e.g. building-scalable-cloud-native-microservices"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Subtitle / Excerpt */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Subtitle / Lead Text</label>
                  <input
                    type="text"
                    value={formData.subtitle || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Short engaging subtitle shown under the main title"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Excerpt (Short Summary for Cards)</label>
                  <input
                    type="text"
                    value={formData.excerpt || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="1-2 sentences shown on card previews"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Category, Date & Reading Time */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={formData.category || "Technology & AI"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className={inputCls}
                  >
                    {BLOG_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Publish Date</label>
                  <input
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Estimated Reading Time</label>
                  <input
                    type="text"
                    value={formData.readingTime || "5 min read"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, readingTime: e.target.value }))
                    }
                    placeholder="e.g. 5 min read"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <label className={labelCls}>Cover Image</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.coverImage && (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                      <Image
                        src={formData.coverImage}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={formData.coverImage || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, coverImage: e.target.value }))
                      }
                      placeholder="Image URL or upload file..."
                      className={inputCls}
                    />
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition cursor-pointer">
                        <span>Upload Cover (Cloudinary)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                      </label>
                      {coverProgress !== null && (
                        <span className="text-xs text-primary font-bold">
                          Uploading: {coverProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Author Details */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <label className={labelCls}>Author Details</label>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Author Name</span>
                    <input
                      type="text"
                      value={formData.author?.name || "Malitha Tishamal"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          author: {
                            name: e.target.value,
                            role: prev.author?.role || "Author",
                            avatar: prev.author?.avatar || "/images/hero/hero-image.png",
                          },
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Author Role</span>
                    <input
                      type="text"
                      value={formData.author?.role || "Lead Full Stack & Cloud Architect"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          author: {
                            name: prev.author?.name || "Malitha Tishamal",
                            role: e.target.value,
                            avatar: prev.author?.avatar || "/images/hero/hero-image.png",
                          },
                        }))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Avatar Image</span>
                    <label className="w-full flex items-center justify-center px-3 py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition cursor-pointer">
                      <span>{authorAvatarProgress !== null ? `Uploading: ${authorAvatarProgress}%` : "Upload Avatar"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Rich Markdown Article Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls}>Full Article Body (Markdown / Structured)</label>
                  <span className="text-[11px] text-gray-400">
                    Supports ## Headings, - Lists, &gt; Quotes, ``` Code blocks
                  </span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={formData.content || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="## Introduction&#10;&#10;Write the full article content here..."
                  className={`${inputCls} font-mono text-xs sm:text-sm leading-relaxed`}
                />
              </div>

              {/* Additional Screenshots */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>
                    Article Screenshots & Diagrams ({formData.additionalImages?.length || 0})
                  </label>
                  <label className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer">
                    <span>
                      {galleryProgress !== null ? `Uploading ${galleryProgress}%` : "+ Upload Screenshots"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.additionalImages && formData.additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formData.additionalImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative h-24 rounded-xl overflow-hidden border border-border group"
                      >
                        <Image
                          src={img}
                          alt="Screenshot"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags & Related Links */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Tags */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-2">
                  <label className={labelCls}>Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.tags?.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-darklight border border-border text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-red-400 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Related Links */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-2">
                  <label className={labelCls}>Related Links & Resources</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder="Link Title (e.g. GitHub)"
                        className={`${inputCls} flex-1`}
                      />
                      <select
                        value={newLinkType}
                        onChange={(e: any) => setNewLinkType(e.target.value)}
                        className="px-2 py-2 rounded-xl text-xs bg-white dark:bg-darkmode border border-border"
                      >
                        <option value="github">GitHub</option>
                        <option value="live">Live Demo</option>
                        <option value="docs">Docs</option>
                        <option value="external">External</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={addRelatedLink}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {formData.relatedLinks && formData.relatedLinks.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {formData.relatedLinks.map((lnk, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-darklight border border-border text-xs"
                        >
                          <span className="font-semibold text-primary truncate max-w-[200px]">
                            {lnk.title} ({lnk.type || "link"})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRelatedLink(i)}
                            className="text-red-400 hover:text-red-600 font-bold ml-2 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, published: e.target.checked }))
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-dark dark:text-white">
                    Publish Immediately (Visible to Public)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-bold text-dark dark:text-white">
                    Featured Article
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
                  {saving ? "Saving..." : editingPost ? "Save Changes" : "Publish Article"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};