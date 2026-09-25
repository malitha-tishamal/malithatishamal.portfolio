"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const FONT_FAMILIES = [
  { label: "Default (Sans-Serif)", value: "inherit" },
  { label: "Inter / Modern", value: "'Inter', sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier / Monospace", value: "'Courier New', Courier, monospace" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const FONT_SIZES = [
  { label: "Small (12px)", value: "1" },
  { label: "Normal (14px)", value: "2" },
  { label: "Medium (16px)", value: "3" },
  { label: "Large (18px)", value: "4" },
  { label: "X-Large (24px)", value: "5" },
  { label: "Huge (32px)", value: "6" },
];

const COLOR_PRESETS = [
  { label: "Default Dark", color: "#1e293b" },
  { label: "Primary Blue", color: "#2563eb" },
  { label: "Cisco Blue", color: "#049fd9" },
  { label: "Emerald Green", color: "#059669" },
  { label: "Crimson Red", color: "#dc2626" },
  { label: "Amber Orange", color: "#d97706" },
  { label: "Purple Indigo", color: "#7c3aed" },
  { label: "Clean White", color: "#ffffff" },
];

const HIGHLIGHT_PRESETS = [
  { label: "None", color: "transparent" },
  { label: "Yellow", color: "#fef08a" },
  { label: "Light Green", color: "#bbf7d0" },
  { label: "Light Cyan", color: "#a5f3fc" },
  { label: "Light Pink", color: "#fbcfe8" },
  { label: "Light Orange", color: "#fed7aa" },
  { label: "Light Purple", color: "#e9d5ff" },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write description or paste formatted content from MS Word, Docs, etc...",
  minHeight = "180px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState("#2563eb");
  const [customHighlightColor, setCustomHighlightColor] = useState("#fef08a");
  const [wordCount, setWordCount] = useState(0);

  // Sync external value with editor content without resetting cursor
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
    // Update word count
    const text = (editorRef.current?.innerText || "").trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
  }, [value, isFocused]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText.trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
    // If completely empty, normalize to empty string
    if (html === "<br>" || html === "<div><br></div>" || html === "<p><br></p>") {
      onChange("");
    } else {
      onChange(html);
    }
  }, [onChange]);

  // Execute standard formatting commands
  const exec = (command: string, val: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  // Special paste handler: cleanly handle MS Word / Rich HTML pasting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const htmlData = e.clipboardData.getData("text/html");
    if (htmlData) {
      e.preventDefault();
      // Clean up common MS Word / Office junk while preserving styles, colors, tags
      let cleaned = htmlData
        .replace(/<!--[\s\S]*?-->/g, "") // remove comments
        .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "") // remove MS Office tags
        .replace(/<xml>[\s\S]*?<\/xml>/gi, "") // remove MS Office XML
        .replace(/<style[\s\S]*?<\/style>/gi, "") // remove embedded style sheets that break layout
        .replace(/<script[\s\S]*?<\/script>/gi, ""); // security scrub

      // Insert the cleaned HTML
      document.execCommand("insertHTML", false, cleaned);
      handleInput();
    }
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL (e.g. https://...):", "https://");
    if (url && url !== "https://") {
      exec("createLink", url);
    }
  };

  return (
    <div className="rounded-2xl border border-border dark:border-dark_border bg-white dark:bg-darklight overflow-hidden shadow-xs transition focus-within:border-primary/60">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/90 dark:bg-darkmode border-b border-border/80 dark:border-dark_border text-gray-700 dark:text-gray-300">
        {/* Style / Heading selector */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            exec("formatBlock", val);
            e.target.value = "";
          }}
          defaultValue=""
          className="text-xs px-2 py-1 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight cursor-pointer hover:border-primary focus:outline-none"
          title="Paragraph / Heading Style"
        >
          <option value="" disabled>Style...</option>
          <option value="<p>">Normal Text</option>
          <option value="<h1>">Heading 1</option>
          <option value="<h2>">Heading 2</option>
          <option value="<h3>">Heading 3</option>
          <option value="<blockquote>">Quote</option>
          <option value="<pre>">Code Block</option>
        </select>

        {/* Font Family selector */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              exec("fontName", e.target.value);
              e.target.value = "";
            }
          }}
          defaultValue=""
          className="text-xs px-2 py-1 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight cursor-pointer hover:border-primary focus:outline-none"
          title="Font Family"
        >
          <option value="" disabled>Font...</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size selector */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              exec("fontSize", e.target.value);
              e.target.value = "";
            }
          }}
          defaultValue=""
          className="text-xs px-2 py-1 rounded-lg border border-border dark:border-dark_border bg-white dark:bg-darklight cursor-pointer hover:border-primary focus:outline-none"
          title="Font Size"
        >
          <option value="" disabled>Size...</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="w-px h-5 bg-border dark:bg-dark_border mx-1" />

        {/* Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          onClick={() => exec("bold")}
          className="w-7 h-7 flex items-center justify-center font-bold text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="w-7 h-7 flex items-center justify-center italic font-serif text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          className="w-7 h-7 flex items-center justify-center underline text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => exec("strikeThrough")}
          className="w-7 h-7 flex items-center justify-center line-through text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Strikethrough"
        >
          S
        </button>

        <span className="w-px h-5 bg-border dark:bg-dark_border mx-1" />

        {/* Text Color Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="flex items-center gap-1 px-1.5 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-semibold"
            title="Text Color"
          >
            <span className="font-bold underline decoration-2 decoration-primary">A</span>
            <span className="text-[10px]">▼</span>
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 p-2.5 bg-white dark:bg-darkmode border border-border dark:border-dark_border rounded-xl shadow-lg w-44 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 block">Text Color</span>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => {
                      exec("foreColor", p.color);
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 transition hover:scale-110"
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border dark:border-dark_border">
                <input
                  type="color"
                  value={customTextColor}
                  onChange={(e) => setCustomTextColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    exec("foreColor", customTextColor);
                    setShowColorPicker(false);
                  }}
                  className="px-2 py-0.5 text-[11px] font-bold rounded bg-primary text-white hover:bg-blue-600 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="flex items-center gap-1 px-1.5 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-semibold"
            title="Text Highlight / Background Color"
          >
            <span className="px-1 bg-yellow-200 text-dark rounded text-[11px] font-bold">ab</span>
            <span className="text-[10px]">▼</span>
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 p-2.5 bg-white dark:bg-darkmode border border-border dark:border-dark_border rounded-xl shadow-lg w-44 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 block">Highlight Color</span>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => {
                      exec("hiliteColor", p.color);
                      setShowHighlightPicker(false);
                    }}
                    className="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] transition hover:scale-110"
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  >
                    {p.color === "transparent" ? "✕" : ""}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border dark:border-dark_border">
                <input
                  type="color"
                  value={customHighlightColor}
                  onChange={(e) => setCustomHighlightColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    exec("hiliteColor", customHighlightColor);
                    setShowHighlightPicker(false);
                  }}
                  className="px-2 py-0.5 text-[11px] font-bold rounded bg-primary text-white hover:bg-blue-600 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-border dark:bg-dark_border mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Align Left"
        >
          ⇤
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Align Center"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => exec("justifyRight")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Align Right"
        >
          ⇥
        </button>
        <button
          type="button"
          onClick={() => exec("justifyFull")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Justify"
        >
          ≣
        </button>

        <span className="w-px h-5 bg-border dark:bg-dark_border mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="px-2 py-1 flex items-center gap-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-semibold"
          title="Bulleted List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="px-2 py-1 flex items-center gap-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-semibold"
          title="Numbered List"
        >
          1. List
        </button>

        <span className="w-px h-5 bg-border dark:bg-dark_border mx-1" />

        {/* Link & Clear format */}
        <button
          type="button"
          onClick={handleLink}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-bold"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => exec("removeFormat")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition font-bold text-red-500"
          title="Clear Formatting"
        >
          🧹
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => exec("undo")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => exec("redo")}
          className="w-7 h-7 flex items-center justify-center text-xs rounded hover:bg-gray-200 dark:hover:bg-dark_border transition"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>

        {/* HTML / Visual Toggle */}
        <button
          type="button"
          onClick={() => setShowHtmlSource(!showHtmlSource)}
          className={`ml-auto px-2.5 py-1 text-xs rounded-lg font-bold border transition ${
            showHtmlSource
              ? "bg-primary text-white border-primary"
              : "bg-white dark:bg-darklight border-border text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary"
          }`}
          title="Toggle HTML Source Code View"
        >
          {showHtmlSource ? "Visual View" : "<> HTML"}
        </button>
      </div>

      {/* Editor Content Area */}
      {showHtmlSource ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs text-dark dark:text-white bg-gray-900/5 dark:bg-black/30 focus:outline-none resize-y"
          placeholder="<p>Enter HTML directly...</p>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-4 text-sm leading-relaxed text-dark dark:text-white focus:outline-none overflow-y-auto max-h-[350px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
        />
      )}

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/70 dark:bg-darkmode/70 border-t border-border/80 dark:border-dark_border text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <span>📋 MS Word &amp; rich formatting paste supported</span>
        </div>
        <div>
          <span>{wordCount} words</span>
        </div>
      </div>
    </div>
  );
};
