"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ServiceItem,
  ServicesSectionContent,
  defaultServices,
  defaultServicesContent,
} from "@/types/service";

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [sectionContent, setSectionContent] = useState<ServicesSectionContent>(defaultServicesContent);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // 1. Subscribe to Services Collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "services"),
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: ServiceItem[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({
                ...(docSnap.data() as ServiceItem),
                id: docSnap.id,
              });
            });
            fetched.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setServices(fetched.filter((s) => s.published !== false));
          } else {
            setServices(defaultServices);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Services listener warning:", err);
          setServices(defaultServices);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.error("Error setting up services listener:", e);
      setServices(defaultServices);
      setLoading(false);
    }
  }, []);

  // 2. Subscribe to Section Settings
  useEffect(() => {
    try {
      const unsubSettings = onSnapshot(
        doc(db, "siteContent", "services"),
        (snap) => {
          if (snap.exists()) {
            setSectionContent({
              ...defaultServicesContent,
              ...(snap.data() as Partial<ServicesSectionContent>),
            });
          }
        },
        (err) => {
          console.warn("Services settings warning:", err);
        }
      );
      return () => unsubSettings();
    } catch (e) {
      console.warn("Could not fetch services section settings:", e);
    }
  }, []);

  // 3. Body scroll lock + Escape key to close modal
  useEffect(() => {
    if (selectedService) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedService(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedService]);

  const handleContactService = (e: React.MouseEvent, serviceTitle: string) => {
    e.stopPropagation(); // prevent modal opening
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("select-service", { detail: { serviceTitle } })
      );
      const contactSection = document.getElementById("contact-section");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleInquireService = (service: ServiceItem) => {
    setSelectedService(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("select-service", { detail: { serviceTitle: service.title } })
      );
      const contactSection = document.getElementById("contact-section");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section id="services" className="bg-section dark:bg-darklight py-16 md:py-24 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-6xl px-4">
        {/* Section Badge & Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3.5"
            data-aos="fade-up"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider text-xs text-primary">
              {sectionContent.badgeText || "Core Engineering Capabilities"}
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-extrabold text-midnight_text dark:text-white leading-tight tracking-tight mb-3"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {sectionContent.heading || "Services Specifically Designed For Your Technical Needs"}
          </h2>

          <p
            className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {sectionContent.subheading ||
              "From full-stack development to automated cloud infrastructure and security hardening, engineered for high reliability."}
          </p>
        </div>

        {/* Services Grid (Compact, modern cards) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-darkmode rounded-2xl p-6 border border-border/70 dark:border-dark_border animate-pulse space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-darklight" />
                <div className="h-5 bg-gray-200 dark:bg-darklight rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-darklight rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-darklight rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {services.map((item, index) => {
              const accent = item.colorAccent || "#0a66c2";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedService(item)}
                  data-aos="fade-up"
                  data-aos-delay={`${(index % 3) * 100}`}
                  className="group relative cursor-pointer bg-white dark:bg-darkmode rounded-2xl border border-slate-200/80 dark:border-dark_border p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 dark:hover:border-primary/50 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top subtle highlight gradient on hover */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                    style={{ backgroundColor: accent }}
                  />

                  <div>
                    {/* Top Row: Icon + Category Badge + Arrow */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${accent}18`,
                          border: `1px solid ${accent}30`,
                        }}
                      >
                        {item.icon || "⚡"}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${accent}12`,
                            color: accent,
                            border: `1px solid ${accent}25`,
                          }}
                        >
                          {item.category || "Service"}
                        </span>
                        <span className="text-gray-400 group-hover:text-primary transition-colors text-xs font-bold p-0.5">
                          ↗
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-base sm:text-lg font-bold text-midnight_text dark:text-white leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.tagline && (
                      <p
                        className="text-[11px] font-semibold mt-1"
                        style={{ color: accent }}
                      >
                        {item.tagline}
                      </p>
                    )}

                    {/* Short Description */}
                    <p className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-300 mt-2.5 leading-relaxed line-clamp-3">
                      {item.shortDescription}
                    </p>
                  </div>

                  {/* Bottom: Tech Stack Chips & Click Teaser */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-dark_border/60">
                    {item.technologies && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {item.technologies.slice(0, 3).map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-darklight text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-dark_border/60"
                          >
                            {tech}
                          </span>
                        ))}
                        {item.technologies.length > 3 && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ color: accent }}
                          >
                            +{item.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-gray-400 group-hover:text-primary transition-colors flex items-center gap-1">
                        <span>🔍</span>
                        <span>Inspect in detail</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleContactService(e, item.title)}
                        className="px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
                        style={{ backgroundColor: accent }}
                      >
                        <span>💬</span>
                        <span>Contact</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════ DETAILED SERVICE MODAL POPUP ═══════════ */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md transition-all duration-300 animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Bar */}
            <div
              className="h-2 w-full shrink-0"
              style={{
                backgroundColor: selectedService.colorAccent || "#0a66c2",
              }}
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-dark dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-base font-bold transition cursor-pointer z-10"
              aria-label="Close dialog"
            >
              ✕
            </button>

            {/* Scrollable Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 pr-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md shrink-0"
                  style={{
                    backgroundColor: `${selectedService.colorAccent || "#0a66c2"}20`,
                    border: `1px solid ${selectedService.colorAccent || "#0a66c2"}40`,
                  }}
                >
                  {selectedService.icon || "⚡"}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1"
                    style={{
                      backgroundColor: `${selectedService.colorAccent || "#0a66c2"}15`,
                      color: selectedService.colorAccent || "#0a66c2",
                      border: `1px solid ${selectedService.colorAccent || "#0a66c2"}30`,
                    }}
                  >
                    {selectedService.category}
                  </span>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                    {selectedService.title}
                  </h3>

                  {selectedService.tagline && (
                    <p
                      className="text-xs sm:text-sm font-semibold mt-0.5"
                      style={{ color: selectedService.colorAccent || "#0a66c2" }}
                    >
                      {selectedService.tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* In-depth Description */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Service Overview &amp; Execution
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedService.fullDescription || selectedService.shortDescription}
                </p>
              </div>

              {/* Deliverables / What's Included */}
              {selectedService.deliverables && selectedService.deliverables.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>📋</span> Key Deliverables &amp; Inclusions ({selectedService.deliverables.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedService.deliverables.map((item, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 mt-0.5 font-bold"
                          style={{
                            backgroundColor: selectedService.colorAccent || "#0a66c2",
                          }}
                        >
                          ✓
                        </span>
                        <span className="font-medium leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technologies & Tools */}
              {selectedService.technologies && selectedService.technologies.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span>🛠️</span> Tech Stack &amp; Tools Used
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedService.technologies.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-3 py-1 rounded-xl text-xs font-bold border transition hover:scale-105"
                        style={{
                          backgroundColor: `${selectedService.colorAccent || "#0a66c2"}12`,
                          color: selectedService.colorAccent || "#0a66c2",
                          borderColor: `${selectedService.colorAccent || "#0a66c2"}35`,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-400 font-medium">
                Tailored for enterprise &amp; startup projects
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleInquireService(selectedService)}
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                  style={{
                    backgroundColor: selectedService.colorAccent || "#0a66c2",
                  }}
                >
                  <span>💬</span>
                  Inquire About This Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
