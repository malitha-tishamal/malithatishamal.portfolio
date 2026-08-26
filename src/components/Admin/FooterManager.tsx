"use client";

import React, { useState, useEffect } from "react";
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getDocs, orderBy, query, deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FooterContent, SocialLink, FooterNavLink,
  defaultFooterContent, DEFAULT_SOCIAL_LINKS, DEFAULT_NAV_LINKS
} from "@/types/footer";
import toast from "react-hot-toast";

// Social platforms that can be added
const ALL_PLATFORMS = ["LinkedIn", "GitHub", "Instagram", "Facebook", "X", "WhatsApp", "YouTube"];

// ─── Subscriber Row type ────────────────────────────────────────────────────
interface Subscriber { id: string; email: string; subscribedAt?: { seconds: number } }

export const FooterManager: React.FC = () => {
  const [formData, setFormData] = useState<FooterContent>(defaultFooterContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"content" | "subscribers">("content");
  const [newPlatform, setNewPlatform] = useState("");
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavHref, setNewNavHref] = useState("");

  // ── Fetch footer content ──────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "siteContent", "footer"));
        if (snap.exists()) {
          const d = snap.data() as FooterContent;
          setFormData({
            ...defaultFooterContent,
            ...d,
            socialLinks: d.socialLinks?.length ? d.socialLinks : DEFAULT_SOCIAL_LINKS,
            navLinks: d.navLinks?.length ? d.navLinks : DEFAULT_NAV_LINKS,
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  // ── Fetch subscribers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeSection !== "subscribers") return;
    const fetch = async () => {
      setSubLoading(true);
      try {
        const q = query(collection(db, "newsletterSubscribers"), orderBy("subscribedAt", "desc"));
        const snap = await getDocs(q);
        setSubscribers(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Subscriber, "id">) })));
      } catch (e) { console.error(e); }
      finally { setSubLoading(false); }
    };
    fetch();
  }, [activeSection]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const setField = <K extends keyof FooterContent>(key: K, val: FooterContent[K]) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  // Social links
  const updateSocial = (idx: number, field: keyof SocialLink, val: string | boolean) => {
    const links = [...formData.socialLinks];
    links[idx] = { ...links[idx], [field]: val };
    setField("socialLinks", links);
  };
  const addSocialPlatform = () => {
    if (!newPlatform) return;
    if (formData.socialLinks.find(s => s.platform === newPlatform)) {
      toast.error("Platform already added");
      return;
    }
    setField("socialLinks", [...formData.socialLinks, { platform: newPlatform, url: "#", enabled: true }]);
    setNewPlatform("");
  };
  const removeSocial = (idx: number) => {
    const links = [...formData.socialLinks];
    links.splice(idx, 1);
    setField("socialLinks", links);
  };
  const moveSocial = (idx: number, dir: -1 | 1) => {
    const links = [...formData.socialLinks];
    const to = idx + dir;
    if (to < 0 || to >= links.length) return;
    [links[idx], links[to]] = [links[to], links[idx]];
    setField("socialLinks", links);
  };

  // Nav links
  const updateNav = (idx: number, field: keyof FooterNavLink, val: string | boolean) => {
    const links = [...formData.navLinks];
    links[idx] = { ...links[idx], [field]: val };
    setField("navLinks", links);
  };
  const addNav = () => {
    if (!newNavLabel) { toast.error("Enter a label"); return; }
    setField("navLinks", [...formData.navLinks, { label: newNavLabel, href: newNavHref || "#", enabled: true }]);
    setNewNavLabel(""); setNewNavHref("");
  };
  const removeNav = (idx: number) => {
    const links = [...formData.navLinks];
    links.splice(idx, 1);
    setField("navLinks", links);
  };
  const moveNav = (idx: number, dir: -1 | 1) => {
    const links = [...formData.navLinks];
    const to = idx + dir;
    if (to < 0 || to >= links.length) return;
    [links[idx], links[to]] = [links[to], links[idx]];
    setField("navLinks", links);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "footer"), { ...formData, updatedAt: serverTimestamp() });
      toast.success("Footer saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  // Delete subscriber
  const deleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      await deleteDoc(doc(db, "newsletterSubscribers", id));
      setSubscribers(prev => prev.filter(s => s.id !== id));
      toast.success("Subscriber removed.");
    } catch (e) { toast.error("Error removing subscriber."); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darkmode text-dark dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1";

  const SOCIAL_BRAND: Record<string, string> = {
    LinkedIn:"#0A66C2", GitHub:"#24292e", Instagram:"#E1306C", Facebook:"#1877F2",
    X:"#000000", WhatsApp:"#25D366", YouTube:"#FF0000"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Footer Manager</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage footer content, social links, nav links, and newsletter subscribers.</p>
        </div>
        <button onClick={handleSave} disabled={saving || activeSection === "subscribers"}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer">
          {saving ? "Saving…" : "Save Footer"}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-border dark:border-dark_border pb-2">
        {(["content", "subscribers"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize transition cursor-pointer ${activeSection === tab ? "bg-primary text-white" : "text-gray-500 hover:text-dark dark:hover:text-white"}`}>
            {tab === "subscribers" ? "Newsletter Subscribers" : "Footer Content"}
          </button>
        ))}
      </div>

      {/* ──────────────── CONTENT TAB ──────────────── */}
      {activeSection === "content" && (
        <div className="space-y-8">

          {/* CTA Section */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Call-to-Action (Left Column)
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Tagline</label>
                <input className={inputCls} value={formData.tagline} onChange={e => setField("tagline", e.target.value)} placeholder="Ready to get started?" />
              </div>
              <div>
                <label className={labelCls}>Button Label</label>
                <input className={inputCls} value={formData.ctaLabel} onChange={e => setField("ctaLabel", e.target.value)} placeholder="Get Started" />
              </div>
              <div>
                <label className={labelCls}>Button Link</label>
                <input className={inputCls} value={formData.ctaHref} onChange={e => setField("ctaHref", e.target.value)} placeholder="/#contact" />
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Support Info (Middle Column)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Section Title</label>
                <input className={inputCls} value={formData.supportTitle} onChange={e => setField("supportTitle", e.target.value)} placeholder="Support" />
              </div>
              <div>
                <label className={labelCls}>Phone Display</label>
                <input className={inputCls} value={formData.phone} onChange={e => setField("phone", e.target.value)} placeholder="+94 XX XXX XXXX" />
              </div>
              <div>
                <label className={labelCls}>Phone Href (tel:...)</label>
                <input className={inputCls} value={formData.phoneHref} onChange={e => setField("phoneHref", e.target.value)} placeholder="tel:+94XXXXXXXXX" />
              </div>
              <div>
                <label className={labelCls}>Email Display</label>
                <input className={inputCls} value={formData.email} onChange={e => setField("email", e.target.value)} placeholder="hello@example.com" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Email Href (mailto:...)</label>
                <input className={inputCls} value={formData.emailHref} onChange={e => setField("emailHref", e.target.value)} placeholder="mailto:hello@example.com" />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Social Links
            </h3>
            <div className="space-y-3">
              {formData.socialLinks.map((social, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-darkmode rounded-xl p-3">
                  <button onClick={() => updateSocial(idx, "enabled", !social.enabled)}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold transition cursor-pointer`}
                    style={{ background: SOCIAL_BRAND[social.platform] || "#555" }}
                    title={social.enabled ? "Enabled (click to hide)" : "Hidden (click to show)"}>
                    {social.enabled ? "✓" : "○"}
                  </button>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-20 shrink-0">{social.platform}</span>
                  <input className={`${inputCls} flex-1`} value={social.url} onChange={e => updateSocial(idx, "url", e.target.value)} placeholder="https://..." />
                  <div className="flex gap-1">
                    <button onClick={() => moveSocial(idx, -1)} disabled={idx === 0}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 cursor-pointer transition">↑</button>
                    <button onClick={() => moveSocial(idx, 1)} disabled={idx === formData.socialLinks.length - 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 cursor-pointer transition">↓</button>
                    <button onClick={() => removeSocial(idx)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Add new platform */}
            <div className="mt-4 flex gap-3">
              <select value={newPlatform} onChange={e => setNewPlatform(e.target.value)}
                className={`${inputCls} flex-1`}>
                <option value="">-- Add platform --</option>
                {ALL_PLATFORMS.filter(p => !formData.socialLinks.find(s => s.platform === p)).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button onClick={addSocialPlatform}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer">
                + Add
              </button>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Newsletter (Right Column)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={formData.newsletterTitle} onChange={e => setField("newsletterTitle", e.target.value)} placeholder="Subscribe newsletter" />
              </div>
              <div>
                <label className={labelCls}>Subtitle</label>
                <input className={inputCls} value={formData.newsletterSubtitle} onChange={e => setField("newsletterSubtitle", e.target.value)} placeholder="Stay updated..." />
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Footer Navigation Links (Bottom Bar)
            </h3>
            <div className="space-y-3">
              {formData.navLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-darkmode rounded-xl p-3">
                  <button onClick={() => updateNav(idx, "enabled", !link.enabled)}
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 transition cursor-pointer ${link.enabled ? "bg-primary border-primary text-white" : "border-gray-300 dark:border-dark_border text-gray-400"}`}>
                    {link.enabled ? "✓" : ""}
                  </button>
                  <input className={`${inputCls} w-28`} value={link.label} onChange={e => updateNav(idx, "label", e.target.value)} placeholder="Label" />
                  <input className={`${inputCls} flex-1`} value={link.href} onChange={e => updateNav(idx, "href", e.target.value)} placeholder="/page or /#section" />
                  <div className="flex gap-1">
                    <button onClick={() => moveNav(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 cursor-pointer transition">↑</button>
                    <button onClick={() => moveNav(idx, 1)} disabled={idx === formData.navLinks.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 cursor-pointer transition">↓</button>
                    <button onClick={() => removeNav(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <input className={`${inputCls} w-32`} value={newNavLabel} onChange={e => setNewNavLabel(e.target.value)} placeholder="Label" />
              <input className={`${inputCls} flex-1`} value={newNavHref} onChange={e => setNewNavHref(e.target.value)} placeholder="Href (e.g. /blog)" />
              <button onClick={addNav} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer">+ Add</button>
            </div>
          </div>

          {/* Copyright */}
          <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
            <h3 className="text-sm font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Copyright Text
            </h3>
            <input className={inputCls} value={formData.copyright} onChange={e => setField("copyright", e.target.value)} placeholder="© 2025 Your Name. All rights reserved." />
          </div>

        </div>
      )}

      {/* ──────────────── SUBSCRIBERS TAB ──────────────── */}
      {activeSection === "subscribers" && (
        <div className="bg-white dark:bg-darklight rounded-2xl border border-border dark:border-dark_border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-dark dark:text-white">Newsletter Subscribers</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""} total</p>
            </div>
          </div>

          {subLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm">No subscribers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-dark_border">
                    <th className="text-left pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="text-left pb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscribed At</th>
                    <th className="pb-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr key={sub.id} className="border-b border-border/40 dark:border-dark_border/40 hover:bg-gray-50 dark:hover:bg-darkmode/50">
                      <td className="py-3 px-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-2 font-medium text-dark dark:text-white">{sub.email}</td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">
                        {sub.subscribedAt ? new Date(sub.subscribedAt.seconds * 1000).toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => deleteSubscriber(sub.id)}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded cursor-pointer transition">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};