"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PortfolioBlock, PortfolioBlockType } from "@/types/portfolio";
import { RichTextEditor } from "@/components/Admin/RichTextEditor";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { getImgPath } from "@/utils/image";
import toast from "react-hot-toast";

import { sanitizeHtml } from "@/utils/sanitize";

interface PortfolioPageBuilderProps {
  blocks: PortfolioBlock[];
  onChange: (blocks: PortfolioBlock[]) => void;
}

const newId = () => `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const BLOCK_META: Record<PortfolioBlockType, { label: string; icon: string }> = {
  heading: { label: "Heading", icon: "H" },
  text: { label: "Paragraph", icon: "¶" },
  split: { label: "Split (Image + Text)", icon: "◫" },
  html: { label: "HTML Code", icon: "<>" },
  image: { label: "Image", icon: "🖼" },
  video: { label: "Video", icon: "🎬" },
  gallery: { label: "Gallery", icon: "🗂" },
  quote: { label: "Quote", icon: "❝" },
  divider: { label: "Divider", icon: "—" },
};

const makeBlock = (type: PortfolioBlockType): PortfolioBlock => ({
  id: newId(),
  type,
  text: type === "heading" ? "New Section Heading" : type === "quote" ? "Your quote here" : "",
  html:
    type === "text"
      ? "<p>Write your paragraph here…</p>"
      : type === "split"
      ? "<p>Write content describing this image or section here…</p>"
      : type === "html"
      ? '<div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">\n  <h4 class="font-bold text-blue-500">Custom HTML Block</h4>\n  <p class="text-sm">Paste any custom HTML, embed widgets, or tables here.</p>\n</div>'
      : "",
  src: "",
  caption: "",
  images: type === "gallery" ? [] : undefined,
  autoplay: type === "video" ? true : undefined,
  layout: type === "split" ? "image_left" : undefined,
  splitRatio: type === "split" ? "50-50" : undefined,
});

export const PortfolioPageBuilder: React.FC<PortfolioPageBuilderProps> = ({ blocks, onChange }) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [htmlViewMode, setHtmlViewMode] = useState<Record<string, "code" | "preview">>({});

  const update = (id: string, patch: Partial<PortfolioBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const addBlock = (type: PortfolioBlockType) => onChange([...blocks, makeBlock(type)]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDrop = (target: number) => {
    if (dragIdx !== null) move(dragIdx, target);
    setDragIdx(null);
    setOverIdx(null);
  };

  const uploadMedia = async (file: File, id: string, kind: "image" | "video", intoGallery = false) => {
    setUploading((p) => ({ ...p, [id]: true }));
    try {
      const res: any = await uploadToCloudinary(file, undefined, kind);
      const url: string = typeof res === "string" ? res : res.secure_url;
      if (intoGallery) {
        const blk = blocks.find((b) => b.id === id);
        update(id, { images: [...(blk?.images || []), url] });
      } else {
        update(id, { src: url });
      }
      toast.success("Uploaded to Cloudinary!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {/* Add-block toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">
          Add Block:
        </span>
        {(Object.keys(BLOCK_META) as PortfolioBlockType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addBlock(t)}
            className="px-2.5 py-1 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-[11px] font-bold text-dark dark:text-white hover:border-primary hover:text-primary cursor-pointer transition"
          >
            {BLOCK_META[t].icon} {BLOCK_META[t].label}
          </button>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 border border-dashed border-border dark:border-dark_border rounded-xl p-4 text-center">
          No blocks yet. Add headings, paragraphs, images &amp; videos above to build a custom
          web-page-style detail view. Drag blocks to reorder.
        </p>
      )}

      {/* Block list (drag to reorder) */}
      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div
            key={b.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            className={`rounded-xl border p-3 bg-white dark:bg-darklight transition ${
              overIdx === i && dragIdx !== null && dragIdx !== i
                ? "border-primary ring-2 ring-primary/30"
                : "border-border/60 dark:border-dark_border/60"
            } ${dragIdx === i ? "opacity-50" : ""}`}
          >
            {/* Block header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="cursor-grab active:cursor-grabbing text-gray-400 select-none" title="Drag to reorder">
                ⠿
              </span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wide">
                {BLOCK_META[b.type].icon} {BLOCK_META[b.type].label}
              </span>
              <span className="text-[10px] text-gray-400">#{i + 1}</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer" title="Move up">
                  ▲
                </button>
                <button type="button" disabled={i === blocks.length - 1} onClick={() => move(i, i + 1)} className="p-1 text-xs text-gray-400 hover:text-primary disabled:opacity-20 cursor-pointer" title="Move down">
                  ▼
                </button>
                <button type="button" onClick={() => remove(b.id)} className="p-1 text-xs text-red-500 hover:text-red-700 cursor-pointer" title="Delete block">
                  ✕
                </button>
              </div>
            </div>

            {/* Block editor by type */}
            {b.type === "heading" && (
              <input
                type="text"
                value={b.text || ""}
                onChange={(e) => update(b.id, { text: e.target.value })}
                placeholder="Section heading"
                className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
              />
            )}

            {b.type === "text" && (
              <RichTextEditor value={b.html || ""} onChange={(html) => update(b.id, { html })} minHeight="120px" />
            )}

            {b.type === "quote" && (
              <textarea
                value={b.text || ""}
                onChange={(e) => update(b.id, { text: e.target.value })}
                rows={2}
                placeholder="Quote text"
                className="w-full px-3 py-1.5 text-sm italic rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
              />
            )}

            {(b.type === "image" || b.type === "video") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {b.src && (
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-darkmode border border-border/60 shrink-0">
                      {b.type === "video" ? (
                        <video src={getImgPath(b.src)} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <Image src={getImgPath(b.src)} alt="block" fill unoptimized className="object-cover" />
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    value={b.src || ""}
                    onChange={(e) => update(b.id, { src: e.target.value })}
                    placeholder={b.type === "video" ? "Video URL (.mp4 …)" : "Image URL"}
                    className="flex-1 px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                  />
                  <label className="px-2.5 py-1 rounded-lg bg-primary hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition shrink-0">
                    {uploading[b.id] ? "…" : "Upload"}
                    <input
                      type="file"
                      accept={b.type === "video" ? "video/*" : "image/*"}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadMedia(f, b.id, b.type === "video" ? "video" : "image");
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={b.caption || ""}
                  onChange={(e) => update(b.id, { caption: e.target.value })}
                  placeholder={b.type === "video" ? "Poster image URL (optional)" : "Caption (optional)"}
                  className="w-full px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                />
                {b.type === "video" && (
                  <label className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={!!b.autoplay} onChange={(e) => update(b.id, { autoplay: e.target.checked })} className="accent-primary" />
                    Autoplay muted loop on the page
                  </label>
                )}
              </div>
            )}

            {b.type === "gallery" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(b.images || []).map((img, gi) => (
                    <div key={gi} className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-darkmode border border-border/60 group">
                      <Image src={getImgPath(img)} alt={`g${gi}`} fill unoptimized className="object-cover" />
                      <button
                        type="button"
                        onClick={() => update(b.id, { images: (b.images || []).filter((_, x) => x !== gi) })}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-black/60 text-white text-[9px] flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-12 rounded-lg border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 cursor-pointer hover:border-primary hover:text-primary">
                    {uploading[b.id] ? "…" : "+ Add"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadMedia(f, b.id, "image", true);
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={b.caption || ""}
                  onChange={(e) => update(b.id, { caption: e.target.value })}
                  placeholder="Gallery caption (optional)"
                  className="w-full px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                />
              </div>
            )}

            {b.type === "split" && (
              <div className="space-y-3">
                {/* Split Configuration Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-darkmode border border-border/60 dark:border-dark_border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Layout:
                    </span>
                    <button
                      type="button"
                      onClick={() => update(b.id, { layout: "image_left" })}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        b.layout !== "image_right"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border border-border/70 dark:border-dark_border hover:text-primary"
                      }`}
                      title="Image on Left, Text on Right"
                    >
                      <span>🖼️ Left</span>
                      <span>|</span>
                      <span>📝 Right</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => update(b.id, { layout: "image_right" })}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        b.layout === "image_right"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white dark:bg-darklight text-gray-600 dark:text-gray-300 border border-border/70 dark:border-dark_border hover:text-primary"
                      }`}
                      title="Text on Left, Image on Right"
                    >
                      <span>📝 Left</span>
                      <span>|</span>
                      <span>🖼️ Right</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ratio:
                    </span>
                    {(["50-50", "40-60", "60-40"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => update(b.id, { splitRatio: r })}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                          (b.splitRatio || "50-50") === r
                            ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                            : "bg-white dark:bg-darklight text-gray-500 border border-border/60 hover:text-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Side-by-side editing grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  {/* Image Column Editor */}
                  <div className="p-3 rounded-xl border border-border/60 dark:border-dark_border/60 bg-gray-50/50 dark:bg-darkmode/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-dark dark:text-white flex items-center gap-1">
                        <span>🖼️</span>
                        <span>Side Image ({b.layout === "image_right" ? "Right Side" : "Left Side"})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.src && (
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-darkmode border border-border/60 shrink-0">
                          <Image src={getImgPath(b.src)} alt="split" fill unoptimized className="object-cover" />
                        </div>
                      )}
                      <input
                        type="text"
                        value={b.src || ""}
                        onChange={(e) => update(b.id, { src: e.target.value })}
                        placeholder="Image URL or upload"
                        className="flex-1 px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                      />
                      <label className="px-2.5 py-1 rounded-lg bg-primary hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition shrink-0">
                        {uploading[b.id] ? "…" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadMedia(f, b.id, "image");
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={b.caption || ""}
                      onChange={(e) => update(b.id, { caption: e.target.value })}
                      placeholder="Image caption (optional)"
                      className="w-full px-3 py-1 text-xs rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight text-dark dark:text-white"
                    />
                  </div>

                  {/* Text Column Editor */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-dark dark:text-white flex items-center gap-1">
                      <span>📝</span>
                      <span>Side Content (Rich Text / HTML)</span>
                    </span>
                    <RichTextEditor
                      value={b.html || ""}
                      onChange={(html) => update(b.id, { html })}
                      minHeight="140px"
                      placeholder="Write description or paste HTML content for this side..."
                    />
                  </div>
                </div>

                {/* Mini Preview Mockup */}
                {b.src && (
                  <div className="p-2 rounded-xl border border-dashed border-border dark:border-dark_border bg-white/40 dark:bg-darklight/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Live Mockup Preview:
                    </span>
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-2 rounded-lg bg-gray-50 dark:bg-darkmode text-xs"
                    >
                      {b.layout === "image_right" ? (
                        <>
                          <div
                            className="text-[11px] leading-relaxed line-clamp-3 text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.html || "") }}
                          />
                          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/40">
                            <Image src={getImgPath(b.src)} alt="preview" fill unoptimized className="object-cover" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/40">
                            <Image src={getImgPath(b.src)} alt="preview" fill unoptimized className="object-cover" />
                          </div>
                          <div
                            className="text-[11px] leading-relaxed line-clamp-3 text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.html || "") }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {b.type === "html" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-dark dark:text-white flex items-center gap-1.5">
                    <span>&lt;&gt;</span>
                    <span>Raw HTML Code Editor &amp; Output</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setHtmlViewMode((prev) => ({ ...prev, [b.id]: "code" }))
                      }
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        (htmlViewMode[b.id] || "code") === "code"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:text-primary"
                      }`}
                    >
                      &lt;/&gt; Code View
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setHtmlViewMode((prev) => ({ ...prev, [b.id]: "preview" }))
                      }
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        htmlViewMode[b.id] === "preview"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-gray-100 dark:bg-darkmode text-gray-600 dark:text-gray-300 hover:text-primary"
                      }`}
                    >
                      👁️ Output Preview
                    </button>
                  </div>
                </div>

                {(htmlViewMode[b.id] || "code") === "code" ? (
                  <div className="space-y-1">
                    <textarea
                      value={b.html || ""}
                      onChange={(e) => update(b.id, { html: e.target.value })}
                      rows={6}
                      placeholder="Paste your HTML code here (e.g. <div>...</div>, <table>...</table>, styled spans, etc.)..."
                      className="w-full p-3 font-mono text-xs rounded-xl border border-border dark:border-dark_border bg-gray-900/5 dark:bg-black/40 text-dark dark:text-white focus:outline-hidden focus:border-primary resize-y"
                    />
                    <span className="text-[10px] text-gray-400 block">
                      💡 Paste any HTML snippet here. Switch to &quot;Output Preview&quot; above to see the real-time rendered result.
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-darkmode/50 min-h-[100px] overflow-x-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-2">
                      Live Output Preview:
                    </span>
                    <div
                      className="text-sm text-dark dark:text-white"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.html || "") }}
                    />
                  </div>
                )}
              </div>
            )}

            {b.type === "divider" && <div className="h-px bg-border dark:bg-dark_border" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioPageBuilder;
