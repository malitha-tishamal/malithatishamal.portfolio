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
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ExperienceItem,
  ExperienceCategory,
  ExperienceMedia,
  LocationType,
  LogoShape,
  defaultExperiences,
} from "@/types/experience";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { searchSkills } from "@/data/skillsDatabase";
import toast from "react-hot-toast";

const POPULAR_SKILLS = [
  "Flutter",
  "Firebase",
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Tailwind CSS",
  "PHP",
  "MySQL",
  "Docker",
  "Java",
  "Python",
  "Web Hosting",
  "Git",
  "REST APIs",
  "Cybersecurity",
  "UI/UX Design",
  "DevOps",
];

const PRESETS = [
  {
    label: "🎓 SLIATE HND IT",
    data: {
      category: "education" as ExperienceCategory,
      organization: "Sri Lanka Institute of Advanced Technological Education (SLIATE)",
      title: "Higher National Diploma, Information Technology",
      fieldOfStudy: "Information Technology",
      employmentType: "Higher National Diploma",
      location: "Colombo / Galle, Sri Lanka",
      locationType: "On-site" as LocationType,
      startDate: "Jul 2024",
      endDate: "Jul 2027",
      isCurrent: true,
      grade: "Merit Standing",
      activities: "IT Society, Robotics & Cybersecurity Club",
      description:
        "Specializing in software engineering, mobile application development, database management systems, network infrastructure, and enterprise systems.",
      skills: ["Flutter", "Firebase", "Java", "Next.js", "Docker", "Database Systems"],
      logoUrl: "https://api.iconify.design/heroicons:academic-cap-20-solid.svg?color=%237c3aed",
      logoShape: "circle" as LogoShape,
    },
  },
  {
    label: "🎓 SITEC Web Design",
    data: {
      category: "education" as ExperienceCategory,
      organization: "Southern IT Education Center - SITEC",
      title: "Certificate, Web Design",
      fieldOfStudy: "Web Design & Development",
      employmentType: "Certificate",
      location: "Southern Province, Sri Lanka",
      locationType: "On-site" as LocationType,
      startDate: "Feb 2023",
      endDate: "Sep 2023",
      isCurrent: false,
      grade: "Distinction",
      activities: "Frontend Web Workshops, UI Challenge Exhibitions",
      description:
        "Hands-on training in responsive layout design, HTML5, CSS3, JavaScript, PHP backends, MySQL relational databases, and live web hosting deployment.",
      skills: ["Web Hosting", "PHP", "MySQL", "JavaScript", "HTML5", "CSS3", "UI/UX Design"],
      logoUrl: "https://api.iconify.design/heroicons:academic-cap.svg",
      logoShape: "circle" as LogoShape,
    },
  },
  {
    label: "💼 Full Stack Freelance",
    data: {
      category: "work" as ExperienceCategory,
      organization: "Independent Client Engagements",
      title: "Full Stack Developer & DevOps Engineer",
      employmentType: "Freelance",
      location: "Remote",
      locationType: "Remote" as LocationType,
      startDate: "Jan 2024",
      endDate: "Present",
      isCurrent: true,
      description:
        "Building production-ready web apps with Next.js 15, TypeScript, and Tailwind CSS. Implementing containerized Docker microservices, automated CI/CD deployment, and high-performance serverless backends.",
      skills: ["Next.js", "React", "TypeScript", "Node.js", "Docker", "Firebase", "Tailwind CSS"],
      logoUrl: "https://api.iconify.design/heroicons:code-bracket-square.svg",
      logoShape: "rounded" as LogoShape,
    },
  },
  {
    label: "🤝 Tech Volunteer",
    data: {
      category: "volunteer" as ExperienceCategory,
      organization: "Sri Lanka Tech Community",
      title: "Community Tech Mentor & Volunteer",
      employmentType: "Volunteer",
      location: "Sri Lanka",
      locationType: "Hybrid" as LocationType,
      startDate: "Jun 2023",
      endDate: "Present",
      isCurrent: true,
      description:
        "Organizing tech meetups, guiding beginners into open source, and conducting hands-on sessions on cybersecurity awareness and modern web frameworks.",
      skills: ["Mentoring", "Open Source", "Public Speaking", "Cybersecurity Awareness"],
      logoUrl: "https://api.iconify.design/heroicons:heart.svg",
      logoShape: "circle" as LogoShape,
    },
  },
];

// ── Admin Media Thumbnail with PDF & fallback support ────────────────────────
const getAdminMediaThumbnailUrl = (url?: string, thumb?: string): string => {
  const target = thumb || url || "";
  if (!target) return "";
  if (target.toLowerCase().endsWith(".pdf")) {
    return target.replace(/\.pdf$/i, ".jpg");
  }
  return target;
};

const AdminMediaThumbnail: React.FC<{
  url?: string;
  thumbnailUrl?: string;
  type?: string;
  title?: string;
  size?: string;
}> = ({ url, thumbnailUrl, type, title, size = "w-10 h-10" }) => {
  const [hasError, setHasError] = useState(false);
  const displaySrc = getAdminMediaThumbnailUrl(url, thumbnailUrl);
  const isPdf = url?.toLowerCase().includes(".pdf") || thumbnailUrl?.toLowerCase().includes(".pdf");

  useEffect(() => {
    setHasError(false);
  }, [url, thumbnailUrl]);

  if (!displaySrc || hasError) {
    return (
      <div
        className={`${size} rounded-xl bg-purple-100 dark:bg-purple-900/60 border border-purple-300 dark:border-purple-700 flex flex-col items-center justify-center shrink-0 shadow-xs`}
        title={title}
      >
        <span className="text-sm">{isPdf ? "📄" : type === "award" ? "🏆" : type === "certificate" ? "📜" : "📎"}</span>
        <span className="text-[8px] font-black text-purple-700 dark:text-purple-300 uppercase leading-none mt-0.5">
          {isPdf ? "PDF" : type || "DOC"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${size} rounded-xl overflow-hidden bg-white dark:bg-darkmode border border-purple-200 dark:border-purple-800 shrink-0 shadow-xs flex items-center justify-center`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt=""
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

export const ExperienceManager: React.FC = () => {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<"all" | ExperienceCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal & Edit state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ExperienceItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ExperienceItem>>({
    category: "work",
    title: "",
    organization: "",
    employmentType: "Full-time",
    fieldOfStudy: "",
    location: "Colombo, Sri Lanka",
    locationType: "Hybrid",
    startDate: "Jan 2024",
    endDate: "Present",
    isCurrent: true,
    grade: "",
    activities: "",
    description: "",
    skills: ["Next.js", "React", "TypeScript"],
    logoUrl: "",
    logoShape: "rounded",
    colorTheme: "linkedin",
    accentColor: "#0a66c2",
    badgeColor: "#0a66c2",
    media: [] as ExperienceMedia[],
    cardBgColor: "",
    displayOrder: 1,
    published: true,
  });

  const [newSkill, setNewSkill] = useState<string>("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState<boolean>(false);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);

  const [mediaTitle, setMediaTitle] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaThumbnail, setMediaThumbnail] = useState<string>("");
  const [mediaType, setMediaType] = useState<"certificate" | "award" | "document" | "image" | "link">("certificate");
  const [mediaProgress, setMediaProgress] = useState<number | null>(null);

  // Analytics & Custom Skills State
  const [sectionViewCount, setSectionViewCount] = useState<number>(0);
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  // Fetch Items from Firestore
  const fetchItems = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "experiences")));
      if (!snapshot.empty) {
        const list: ExperienceItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ExperienceItem, "id">),
        }));
        list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setItems(list);
      } else {
        setItems(defaultExperiences);
      }
    } catch (err) {
      console.error("Error fetching experiences:", err);
      toast.error("Failed to load experience records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Listen to section view count analytics
    const unsubViews = onSnapshot(doc(db, "siteContent", "experienceAnalytics"), (snap) => {
      if (snap.exists()) {
        setSectionViewCount(Number(snap.data()?.sectionViewCount) || 0);
      }
    });

    // Listen to custom persistent skills
    const unsubSkills = onSnapshot(doc(db, "siteContent", "customSkills"), (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.skills)) {
        setCustomSkills(snap.data().skills);
      }
    });

    return () => {
      unsubViews();
      unsubSkills();
    };
  }, []);

  // Seed default items
  const handleSeedDefaults = async () => {
    if (!confirm("This will seed default LinkedIn Experience & Education into Firestore. Continue?")) {
      return;
    }
    try {
      setSeeding(true);
      for (const item of defaultExperiences) {
        const docRef = doc(db, "experiences", item.id);
        await setDoc(docRef, {
          ...item,
          updatedAt: serverTimestamp(),
        });
      }
      toast.success("Default Experience & Education seeded successfully!");
      fetchItems();
    } catch (err: any) {
      console.error("Error seeding experiences:", err);
      toast.error("Failed to seed items.");
    } finally {
      setSeeding(false);
    }
  };

  // Open modal for new item
  const handleAddNew = (category: ExperienceCategory = "work") => {
    setEditingItem(null);
    setFormData({
      category,
      title: "",
      organization: "",
      employmentType: category === "education" ? "Higher National Diploma" : "Full-time",
      fieldOfStudy: "",
      location: "Colombo, Sri Lanka",
      locationType: "Hybrid",
      startDate: "Jan 2024",
      endDate: "Present",
      isCurrent: true,
      grade: "",
      activities: "",
      description: "",
      skills: ["React", "TypeScript", "Next.js"],
      logoUrl: "",
      logoShape: category === "education" ? "circle" : "rounded",
      colorTheme: "linkedin",
      accentColor: "#0a66c2",
      badgeColor: "#0a66c2",
      cardBgColor: "",
      media: [],
      displayOrder: items.length + 1,
      published: true,
    });
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
    setMediaTitle("");
    setMediaUrl("");
    setMediaType("certificate");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (item: ExperienceItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      skills: item.skills || [],
      media: item.media || [],
      colorTheme: item.colorTheme || "linkedin",
      accentColor: item.accentColor || "#0a66c2",
      badgeColor: item.badgeColor || "#0a66c2",
      cardBgColor: item.cardBgColor || "",
    });
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
    setMediaTitle("");
    setMediaUrl("");
    setMediaType("certificate");
    setIsModalOpen(true);
  };

  // Apply a preset template
  const applyPreset = (preset: typeof PRESETS[0]["data"]) => {
    setFormData((prev) => ({
      ...prev,
      ...preset,
      displayOrder: prev.displayOrder || items.length + 1,
    }));
    toast.success("Preset applied! You can adjust details below.");
  };

  // Logo upload to Cloudinary
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoProgress(10);
      const res = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, logoUrl: res.secure_url || res.url }));
      setLogoProgress(100);
      toast.success("Logo uploaded!");
      setTimeout(() => setLogoProgress(null), 1000);
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      toast.error("Logo upload failed.");
      setLogoProgress(null);
    }
  };

  // Skill tag management with 5,500+ auto-suggest + custom persistent database
  const handleSkillInputChange = (val: string) => {
    setNewSkill(val);
    if (val.trim().length > 0) {
      const q = val.trim().toLowerCase();
      const dbResults = searchSkills(val, 15);
      const customMatches = customSkills.filter(
        (cs) =>
          cs.toLowerCase().includes(q) &&
          !dbResults.some((d) => d.toLowerCase() === cs.toLowerCase())
      );
      const combined = [...customMatches, ...dbResults].slice(0, 15);
      setSkillSuggestions(combined);
      setShowSkillSuggestions(combined.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSkillSuggestions(false);
    }
  };

  const addSkill = async (skillToAdd?: string) => {
    const s = (skillToAdd || newSkill).trim();
    if (!s) return;
    const current = formData.skills || [];
    // Case-insensitive duplicate check
    const alreadyExists = current.some(
      (existing) => existing.toLowerCase() === s.toLowerCase()
    );
    if (!alreadyExists) {
      setFormData((prev) => ({ ...prev, skills: [...current, s] }));

      // Check if skill is in skillsDatabase or customSkills
      const inSkillsDb = searchSkills(s, 100).some(
        (existing) => existing.toLowerCase() === s.toLowerCase()
      );
      const inCustom = customSkills.some(
        (existing) => existing.toLowerCase() === s.toLowerCase()
      );

      // If it's a new custom skill not in existing database, save to Firestore!
      if (!inSkillsDb && !inCustom) {
        setCustomSkills((prev) => [...prev, s]);
        try {
          await setDoc(
            doc(db, "siteContent", "customSkills"),
            { skills: arrayUnion(s) },
            { merge: true }
          );
          toast.success(`New skill "${s}" saved to database for future use! ✨`);
        } catch (err) {
          console.warn("Could not save new skill to database", err);
        }
      }
    } else {
      toast("Skill already added", { icon: "ℹ️" });
    }
    setNewSkill("");
    setSkillSuggestions([]);
    setShowSkillSuggestions(false);
  };

  const removeSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index),
    }));
  };

  // Media / Certificate upload & add
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Automatically extract title from file name if mediaTitle is empty
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, "") // strip extension
      .replace(/[_-]/g, " ") // replace underscores & dashes with spaces
      .replace(/\s+/g, " ") // normalize multiple spaces
      .trim();

    if (!mediaTitle.trim() && cleanFileName) {
      setMediaTitle(cleanFileName);
    }

    try {
      setMediaProgress(15);
      const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
      const res = await uploadToCloudinary(file, (p) => setMediaProgress(p), "auto");
      const uploadedUrl = res.secure_url || res.url;
      setMediaUrl(uploadedUrl);

      // If PDF, compute Cloudinary jpg preview thumbnail
      const previewThumb = isPdf ? uploadedUrl.replace(/\.pdf$/i, ".jpg") : uploadedUrl;
      setMediaThumbnail(previewThumb);

      setMediaProgress(100);
      toast.success(isPdf ? "PDF uploaded & preview thumbnail generated!" : "File uploaded!");
      setTimeout(() => setMediaProgress(null), 1000);
    } catch (err: any) {
      console.error("Media upload failed:", err);
      toast.error("Upload failed.");
      setMediaProgress(null);
    }
  };

  const handleAddMedia = () => {
    if (!mediaTitle.trim()) {
      toast.error("Please enter a title for the document / certificate.");
      return;
    }
    if (!mediaUrl.trim()) {
      toast.error("Please upload an image or provide a document link.");
      return;
    }

    const isPdf = mediaUrl.toLowerCase().endsWith(".pdf");
    const finalThumb = mediaThumbnail || (isPdf ? mediaUrl.replace(/\.pdf$/i, ".jpg") : mediaUrl);

    const newMedia: ExperienceMedia = {
      title: mediaTitle.trim(),
      url: mediaUrl.trim(),
      type: mediaType,
      thumbnailUrl: finalThumb,
    };
    setFormData((prev) => ({
      ...prev,
      media: [...(prev.media || []), newMedia],
    }));
    setMediaTitle("");
    setMediaUrl("");
    setMediaThumbnail("");
    setMediaType("certificate");
    toast.success("Attachment added!");
  };

  const handleRemoveMedia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index),
    }));
  };

  // Save Item
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.organization?.trim()) {
      toast.error("Please provide both Title/Degree and School/Organization name.");
      return;
    }

    try {
      setSaving(true);
      const id = editingItem ? editingItem.id : `exp-${Date.now()}`;
      const docRef = doc(db, "experiences", id);
      const payload: ExperienceItem = {
        id,
        category: (formData.category || "work") as ExperienceCategory,
        title: formData.title.trim(),
        organization: formData.organization.trim(),
        employmentType: formData.employmentType || "",
        fieldOfStudy: formData.fieldOfStudy || "",
        location: formData.location || "",
        locationType: (formData.locationType || "Hybrid") as LocationType,
        startDate: formData.startDate || "",
        endDate: formData.isCurrent ? "Present" : formData.endDate || "",
        isCurrent: !!formData.isCurrent,
        grade: formData.grade || "",
        activities: formData.activities || "",
        description: formData.description || "",
        skills: formData.skills || [],
        media: formData.media || [],
        logoUrl: formData.logoUrl || "",
        logoShape: (formData.logoShape || "rounded") as LogoShape,
        displayOrder: Number(formData.displayOrder) || items.length + 1,
        published: formData.published !== false,
        // Color customization fields
        accentColor: formData.accentColor || "",
        badgeColor: formData.badgeColor || "",
        colorTheme: formData.colorTheme || "linkedin",
        cardBgColor: formData.cardBgColor || "",
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      toast.success(editingItem ? "Record updated!" : "New record added!");
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "experiences", id));
      toast.success("Record deleted.");
      fetchItems();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record.");
    }
  };

  // Toggle published
  const handleTogglePublish = async (item: ExperienceItem) => {
    try {
      const docRef = doc(db, "experiences", item.id);
      await setDoc(docRef, { published: !item.published }, { merge: true });
      toast.success(item.published ? "Record hidden." : "Record published!");
      fetchItems();
    } catch (err) {
      toast.error("Failed to toggle visibility.");
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCat = categoryFilter === "all" || item.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.organization.toLowerCase().includes(q) ||
      item.skills?.some((s) => s.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const inputCls =
    "w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-gray-50 dark:bg-darkmode border border-border/80 dark:border-dark_border text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelCls = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-darklight p-6 rounded-3xl border border-border dark:border-dark_border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              LinkedIn Style Career & Academics
            </span>
          </div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Experience & Education Manager
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your work history, degrees, volunteer achievements, logos, and verified skills.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl border border-border dark:border-dark_border text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
          >
            {seeding ? "Seeding..." : "✦ Seed Default SLIATE & Work"}
          </button>

          <button
            onClick={() => handleAddNew("work")}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Add Experience</span>
          </button>

          <button
            onClick={() => handleAddNew("education")}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-bold hover:bg-purple-700 transition shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Add Education</span>
          </button>
        </div>
      </div>

      {/* ── Analytics Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Section Views */}
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-4 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Section Views
            </span>
            <span className="text-lg">👁️</span>
          </div>
          <p className="text-2xl font-extrabold text-dark dark:text-white">
            {sectionViewCount}
          </p>
          <p className="text-[11px] text-gray-400">
            Visitors who scrolled to this section
          </p>
        </div>

        {/* Total Items */}
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-4 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Items
            </span>
            <span className="text-lg">📋</span>
          </div>
          <p className="text-2xl font-extrabold text-dark dark:text-white">
            {items.length}
          </p>
          <p className="text-[11px] text-gray-400">
            All experience & education records
          </p>
        </div>

        {/* Education Count */}
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/40 p-4 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Education
            </span>
            <span className="text-lg">🎓</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
            {items.filter((i) => i.category === "education").length}
          </p>
          <p className="text-[11px] text-purple-500 dark:text-purple-400">
            Degrees, diplomas & training
          </p>
        </div>

        {/* Work + Volunteer Count */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/40 p-4 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Work / Volunteer
            </span>
            <span className="text-lg">💼</span>
          </div>
          <p className="text-2xl font-extrabold text-primary">
            {items.filter((i) => i.category === "work" || i.category === "volunteer").length}
          </p>
          <p className="text-[11px] text-blue-400">
            Professional & volunteer positions
          </p>
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
              placeholder="Search role, school, skill..."
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-darkmode p-1 rounded-xl">
            {(["all", "work", "education", "volunteer"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-white dark:bg-darklight text-primary shadow-xs font-bold"
                    : "text-gray-500 hover:text-dark dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading records...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm font-semibold mb-2">No records found</p>
            <p className="text-xs">Click &quot;+ Add Experience&quot; or &quot;Seed Default SLIATE & Work&quot; to populate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 dark:bg-darkmode border-b border-border dark:border-dark_border text-gray-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Organization / School</th>
                  <th className="py-3.5 px-4 font-bold">Title / Degree</th>
                  <th className="py-3.5 px-4 font-bold">Period</th>
                  <th className="py-3.5 px-4 font-bold">Color</th>
                  <th className="py-3.5 px-4 font-bold">Hover / Clicks</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark_border/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-darkmode/50 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          item.category === "education"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            : item.category === "volunteer"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-blue-500/10 text-primary border border-primary/20"
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 ${
                            item.logoShape === "circle"
                              ? "rounded-full"
                              : item.logoShape === "square"
                              ? "rounded-md"
                              : "rounded-xl"
                          } bg-gray-100 dark:bg-darkmode border border-border flex items-center justify-center shrink-0 overflow-hidden`}
                        >
                          {item.logoUrl ? (
                            <Image
                              src={item.logoUrl}
                              alt={item.organization}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="font-bold text-xs text-gray-400">
                              {item.organization.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-dark dark:text-white line-clamp-1">
                            {item.organization}
                          </p>
                          {item.location && (
                            <p className="text-[11px] text-gray-400">{item.location}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-dark dark:text-white">{item.title}</p>
                      {item.employmentType && (
                        <p className="text-[11px] text-gray-400">{item.employmentType}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                      {item.startDate} – {item.endDate || (item.isCurrent ? "Present" : "")}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/30 shadow-sm shrink-0"
                          style={{
                            backgroundColor:
                              item.accentColor ||
                              (item.category === "volunteer"
                                ? "#057642"
                                : item.category === "education"
                                ? "#7c3aed"
                                : "#0a66c2"),
                          }}
                          title={item.accentColor || "default"}
                        />
                        <span className="text-[10px] text-gray-400 font-mono">
                          {item.accentColor || "default"}
                        </span>
                      </div>
                    </td>

                    {/* Hover & Click Analytics per item */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5" title="Times cursor hovered on this card (unique per session)">
                          <span className="text-[11px]">🖱️</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {item.hoverCount ?? 0}
                          </span>
                          <span className="text-[10px] text-gray-400">hovers</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Times this card was clicked / detail opened">
                          <span className="text-[11px]">👆</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {item.clickCount ?? 0}
                          </span>
                          <span className="text-[10px] text-gray-400">clicks</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                          item.published !== false
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-gray-100 dark:bg-darkmode text-gray-400 border border-border"
                        }`}
                      >
                        {item.published !== false ? "Visible" : "Hidden"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition text-xs font-bold cursor-pointer"
                        >
                          Delete
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

      {/* ═══════════ ADD / EDIT MODAL ═══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-darklight rounded-3xl border border-border dark:border-dark_border shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border dark:border-dark_border mb-5">
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">
                  {editingItem ? "Edit Experience / Education" : "Add Experience / Education"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Follows LinkedIn profile specification with custom logo shapes and skills tags.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkmode text-gray-500 hover:text-dark dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets / Autofill Buttons */}
            {!editingItem && (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 mb-6">
                <span className="text-[11px] font-bold text-primary block mb-2 uppercase tracking-wider">
                  ⚡ 1-Click Fast Presets (Click to autofill all options):
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.data)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-darklight text-dark dark:text-white border border-border hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Category & Employment Type */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Category *</label>
                  <select
                    value={formData.category || "work"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as ExperienceCategory,
                        logoShape: e.target.value === "education" ? "circle" : prev.logoShape,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="work">💼 Work Experience</option>
                    <option value="education">🎓 Education</option>
                    <option value="volunteer">🤝 Volunteer Experience</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    {formData.category === "education" ? "Degree / Qualification Type" : "Employment Type"}
                  </label>
                  <select
                    value={formData.employmentType || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value }))}
                    className={inputCls}
                  >
                    {formData.category === "education" ? (
                      <>
                        <option value="Higher National Diploma">Higher National Diploma</option>
                        <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                        <option value="Master's Degree">Master&apos;s Degree</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Secondary Education">Secondary Education</option>
                      </>
                    ) : (
                      <>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Contract">Contract</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Internship">Internship</option>
                        <option value="Volunteer">Volunteer</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Organization & Title */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    {formData.category === "education" ? "School / Institution *" : "Company / Organization *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
                    placeholder={
                      formData.category === "education"
                        ? "e.g. SLIATE or Boston University"
                        : "e.g. Google or Freelance"
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    {formData.category === "education" ? "Degree / Title *" : "Job Title / Role *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={
                      formData.category === "education"
                        ? "e.g. Higher National Diploma, Information Technology"
                        : "e.g. Full Stack Developer"
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Field of Study & Grade (for Education) or Location (for Work) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    {formData.category === "education" ? "Field of Study" : "Location"}
                  </label>
                  <input
                    type="text"
                    value={
                      formData.category === "education"
                        ? formData.fieldOfStudy || ""
                        : formData.location || ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ...(formData.category === "education"
                          ? { fieldOfStudy: e.target.value }
                          : { location: e.target.value }),
                      }))
                    }
                    placeholder={
                      formData.category === "education"
                        ? "e.g. Information Technology"
                        : "e.g. Colombo, Sri Lanka"
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    {formData.category === "education" ? "Grade / Classification" : "Workplace Type"}
                  </label>
                  {formData.category === "education" ? (
                    <input
                      type="text"
                      value={formData.grade || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g. Merit Standing, First Class, 3.8 GPA"
                      className={inputCls}
                    />
                  ) : (
                    <select
                      value={formData.locationType || "Hybrid"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          locationType: e.target.value as LocationType,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date (Month Year)</label>
                  <input
                    type="text"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    placeholder="e.g. Jul 2024"
                    className={inputCls}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>End Date</label>
                    <label className="flex items-center gap-1.5 text-xs text-primary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!formData.isCurrent}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isCurrent: e.target.checked,
                            endDate: e.target.checked ? "Present" : "",
                          }))
                        }
                        className="rounded"
                      />
                      <span>Currently {formData.category === "education" ? "studying" : "working"}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!!formData.isCurrent}
                    value={formData.isCurrent ? "Present" : formData.endDate || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    placeholder="e.g. Jul 2027 or Sep 2023"
                    className={`${inputCls} ${formData.isCurrent ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>

              {/* Activities & societies (for education) */}
              {formData.category === "education" && (
                <div>
                  <label className={labelCls}>Activities & Societies</label>
                  <input
                    type="text"
                    value={formData.activities || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, activities: e.target.value }))}
                    placeholder="e.g. IT Club, Volleyball Team, Student Representative"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className={labelCls}>Description / Key Responsibilities</label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Outline key projects, practical modules, technical skills acquired, or team achievements..."
                  className={inputCls}
                />
              </div>

              {/* Logo & Shape Selector */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <label className={labelCls}>Organization / School Logo</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.logoUrl || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://... logo image URL"
                    className={`${inputCls} flex-1`}
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shrink-0">
                    <span>{logoProgress !== null ? `${logoProgress}%` : "Upload"}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>

                {/* Logo Shape Choice */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-gray-500">Logo Shape:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "circle", label: "Circle (LinkedIn)", cls: "rounded-full" },
                      { id: "rounded", label: "Rounded", cls: "rounded-xl" },
                      { id: "square", label: "Square", cls: "rounded-md" },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, logoShape: shape.id as LogoShape }))
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          formData.logoShape === shape.id
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border-border"
                        }`}
                      >
                        <span className={`w-3 h-3 bg-current ${shape.cls} inline-block`} />
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════════ CARD COLOR THEME & ACCENT MANAGER ═══════════ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-darkmode dark:to-blue-950/20 border border-slate-200 dark:border-dark_border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🎨 Card Color Theme & Accent Manager</span>
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Fully customize card colors (left glow bar, badge pills, live accents). Default is LinkedIn Blue & Black.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-lg bg-white dark:bg-darklight border border-slate-200 dark:border-dark_border">
                    {formData.colorTheme?.toUpperCase() || "LINKEDIN"}
                  </span>
                </div>

                {/* Theme Presets */}
                <div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-2">
                    Quick Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      {
                        id: "linkedin",
                        label: "LinkedIn Blue (Default)",
                        accent: "#0a66c2",
                        badge: "#0a66c2",
                        dot: "bg-[#0a66c2]",
                      },
                      {
                        id: "black",
                        label: "Black / Dark Slate",
                        accent: "#181818",
                        badge: "#1e293b",
                        dot: "bg-slate-900 dark:bg-white",
                      },
                      {
                        id: "blue",
                        label: "Electric Royal Blue",
                        accent: "#2563eb",
                        badge: "#1d4ed8",
                        dot: "bg-blue-600",
                      },
                      {
                        id: "emerald",
                        label: "Emerald Green",
                        accent: "#057642",
                        badge: "#057642",
                        dot: "bg-[#057642]",
                      },
                      {
                        id: "purple",
                        label: "Deep Purple",
                        accent: "#7c3aed",
                        badge: "#6d28d9",
                        dot: "bg-purple-600",
                      },
                      {
                        id: "custom",
                        label: "Custom Palette",
                        accent: formData.accentColor || "#0a66c2",
                        badge: formData.badgeColor || "#0a66c2",
                        dot: "bg-gradient-to-r from-pink-500 via-amber-500 to-blue-500",
                      },
                    ].map((preset) => {
                      const isSelected = formData.colorTheme === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              colorTheme: preset.id as any,
                              accentColor: preset.accent,
                              badgeColor: preset.badge,
                            }))
                          }
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "bg-white dark:bg-darklight border-primary shadow-sm ring-1 ring-primary"
                              : "bg-white/80 dark:bg-darklight/60 border-slate-200 dark:border-dark_border hover:border-slate-300"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${preset.dot} shrink-0 shadow-2xs`} />
                          <span className="text-xs font-semibold text-dark dark:text-white truncate">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Pickers Row */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-dark_border/80 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                      Accent Glow Line Color:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.accentColor || "#0a66c2"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            colorTheme: "custom",
                            accentColor: e.target.value,
                          }))
                        }
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={formData.accentColor || "#0a66c2"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            colorTheme: "custom",
                            accentColor: e.target.value,
                          }))
                        }
                        placeholder="#0a66c2"
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block mb-1">
                      Badge / Highlight Color:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.badgeColor || "#0a66c2"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            colorTheme: "custom",
                            badgeColor: e.target.value,
                          }))
                        }
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={formData.badgeColor || "#0a66c2"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            colorTheme: "custom",
                            badgeColor: e.target.value,
                          }))
                        }
                        placeholder="#0a66c2"
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Live Card Preview:
                  </span>
                  <div
                    className="p-3.5 rounded-xl border relative overflow-hidden bg-white dark:bg-darkmode transition-all shadow-xs"
                    style={{
                      borderLeftColor: formData.accentColor || "#0a66c2",
                      borderLeftWidth: "4px",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{ backgroundColor: formData.accentColor || "#0a66c2" }}
                      >
                        {formData.category === "education" ? "🎓" : "💼"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-dark dark:text-white truncate">
                            {formData.title || "Position / Program Title"}
                          </h5>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              color: formData.badgeColor || "#0a66c2",
                              borderColor: `${formData.badgeColor || "#0a66c2"}40`,
                              backgroundColor: `${formData.badgeColor || "#0a66c2"}15`,
                            }}
                          >
                            {formData.employmentType || "Full-time"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {formData.organization || "Company or Institution"} · {formData.startDate || "Jan 2024"} – {formData.endDate || "Present"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Skills Tags */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-3">
                <label className={labelCls}>Top Skills (Diamond 💎 badge on card)</label>
                
                {/* Popular Skill Quick Add Chips */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {POPULAR_SKILLS.map((sk) => {
                    const isAdded = (formData.skills || []).some(
                      (s) => s.toLowerCase() === sk.toLowerCase()
                    );
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => !isAdded && addSkill(sk)}
                        disabled={isAdded}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                          isAdded
                            ? "bg-gray-200 dark:bg-darklight text-gray-400 opacity-50 cursor-default"
                            : "bg-white dark:bg-darklight text-gray-700 dark:text-gray-300 border border-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        + {sk}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Skill Input with 5,500+ Auto-Suggest Dropdown */}
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onFocus={() => {
                        if (newSkill.trim().length > 0) {
                          const results = searchSkills(newSkill, 15);
                          setSkillSuggestions(results);
                          setShowSkillSuggestions(results.length > 0);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (skillSuggestions.length > 0) {
                            addSkill(skillSuggestions[0]);
                          } else {
                            addSkill();
                          }
                        }
                      }}
                      placeholder="Type skill (e.g. Python, Docker, Cisco, Kubernetes - 5,500+ skills, case-insensitive)..."
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill()}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  {/* Suggestions Dropdown Popover */}
                  {showSkillSuggestions && skillSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-darklight rounded-2xl border border-primary/30 dark:border-primary/40 shadow-xl max-h-56 overflow-y-auto p-2 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider flex justify-between">
                        <span>Suggested Skills ({skillSuggestions.length})</span>
                        <span>Click or Enter to add</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skillSuggestions.map((sug) => {
                          const isAlreadyAdded = (formData.skills || []).some(
                            (s) => s.toLowerCase() === sug.toLowerCase()
                          );
                          return (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                addSkill(sug);
                              }}
                              disabled={isAlreadyAdded}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-1.5 cursor-pointer ${
                                isAlreadyAdded
                                  ? "bg-gray-100 dark:bg-darkmode text-gray-400 opacity-50 cursor-not-allowed"
                                  : "bg-blue-50/70 dark:bg-blue-950/40 text-primary hover:bg-primary hover:text-white border border-blue-200/50 dark:border-blue-800/50"
                              }`}
                            >
                              <span>+</span>
                              <span>{sug}</span>
                              {isAlreadyAdded && <span className="text-[10px]">✓ added</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Skills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(formData.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-primary border border-blue-200/60 dark:border-blue-900/60"
                    >
                      <span>💎 {skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Media, Documents & Certificates Section */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-darkmode border border-border dark:border-dark_border space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>
                      📜 Documents, Certificates &amp; Event Awards
                    </label>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Thumbnail &amp; name display on card
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Attach certificates, competition trophies, degrees, event win photos, or letters. Users will see a thumbnail and name on the card, and can click to view full resolution.
                  </p>
                </div>

                {/* Add New Media Form */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-darklight border border-border/70 dark:border-dark_border space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">
                        Document / Certificate Title *
                      </label>
                      <input
                        type="text"
                        value={mediaTitle}
                        onChange={(e) => setMediaTitle(e.target.value)}
                        placeholder="e.g. INTROVA 1.0 1st Place Award, Dean's List Certificate"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">
                        Attachment Type
                      </label>
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as any)}
                        className={inputCls}
                      >
                        <option value="certificate">📜 Certificate</option>
                        <option value="award">🏆 Award / Event Win</option>
                        <option value="document">📄 Official Document</option>
                        <option value="image">🖼️ Photo / Screenshot</option>
                        <option value="link">🔗 Verification Link</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      File / Image URL (Cloudinary or Direct Link) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://... image or document URL"
                        className={inputCls}
                      />
                      <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center shrink-0">
                        <span>{mediaProgress ? `${mediaProgress}%` : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleMediaUpload}
                          className="hidden"
                          disabled={!!mediaProgress}
                        />
                      </label>
                    </div>
                    {mediaProgress !== null && (
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 transition-all duration-300"
                          style={{ width: `${mediaProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Preview if mediaUrl exists */}
                  {mediaUrl && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-darkmode rounded-xl border border-border/60">
                      <AdminMediaThumbnail
                        url={mediaUrl}
                        thumbnailUrl={mediaThumbnail}
                        type={mediaType}
                        title={mediaTitle}
                        size="w-12 h-12"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-dark dark:text-white truncate">
                          {mediaTitle || "Untitled Attachment"}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">{mediaType}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                    >
                      + Attach Certificate / Document
                    </button>
                  </div>
                </div>

                {/* List of Attached Media */}
                {formData.media && formData.media.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500">
                      Attached Documents ({formData.media.length}):
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {formData.media.map((med, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-darklight border border-border dark:border-dark_border"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AdminMediaThumbnail
                              url={med.url}
                              thumbnailUrl={med.thumbnailUrl}
                              type={med.type}
                              title={med.title}
                              size="w-10 h-10"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-dark dark:text-white truncate">
                                {med.type === "award" ? "🏆" : med.type === "certificate" ? "📜" : "📄"}{" "}
                                {med.title}
                              </p>
                              <a
                                href={med.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline truncate block"
                              >
                                View full document ↗
                              </a>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                            title="Remove attachment"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No certificates or documents attached yet.
                  </p>
                )}
              </div>

              {/* Display Order & Visibility */}
              <div className="grid sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className={labelCls}>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder || 1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))
                    }
                    className={inputCls}
                  />
                </div>

                <div className="flex items-center gap-2 sm:mt-5">
                  <input
                    type="checkbox"
                    id="publishedExp"
                    checked={formData.published !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, published: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-primary"
                  />
                  <label htmlFor="publishedExp" className="text-xs font-semibold text-dark dark:text-white cursor-pointer">
                    Visible on Public Website
                  </label>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-border dark:border-dark_border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Record" : "Save Record"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExperienceManager;
