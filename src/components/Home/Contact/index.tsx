"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getImgPath } from "@/utils/image";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ContactSectionContent, defaultContactContent } from "@/types/contact";
import toast from "react-hot-toast";

const Contactform = () => {
  const [content, setContent] = useState<ContactSectionContent>(defaultContactContent);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    serviceCategory: "",
    message: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [serviceOptions, setServiceOptions] = useState<string[]>([
    "Full-Stack Software Engineering",
    "DevOps & Cloud Infrastructure",
    "Cybersecurity & Systems Hardening",
    "Network Engineering & Server Architecture",
    "Mobile Application Engineering",
    "Database Engineering & Optimization",
  ]);

  // Listen to select-service events from Services section
  useEffect(() => {
    const handleSelectService = (e: Event) => {
      const customEvt = e as CustomEvent<{ serviceTitle: string }>;
      if (customEvt.detail?.serviceTitle) {
        setFormData((prev) => ({
          ...prev,
          serviceCategory: customEvt.detail.serviceTitle,
        }));
      }
    };
    window.addEventListener("select-service", handleSelectService);
    return () => window.removeEventListener("select-service", handleSelectService);
  }, []);

  // Fetch available services for category dropdown
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "services"), (snap) => {
        if (!snap.empty) {
          const names: string[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if (data.title && data.published !== false) {
              names.push(data.title);
            }
          });
          if (names.length > 0) setServiceOptions(names);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("Could not fetch services for contact options:", e);
    }
  }, []);

  // Real-time sync with siteContent/contact
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, "siteContent", "contact"),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<ContactSectionContent>;
            setContent({
              ...defaultContactContent,
              ...data,
              partners: data.partners?.length ? data.partners : defaultContactContent.partners,
            });
          }
        },
        (err) => {
          console.warn("Notice: Using default contact section content:", err.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up contact listener:", err);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("Please enter your first name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please let us know about your project.");
      return;
    }
    if (!formData.consent) {
      toast.error("Please acknowledge the Terms and Conditions to proceed.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Record inquiry in Firestore for Admin Panel
      await addDoc(collection(db, "inquiries"), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country.trim(),
        serviceCategory: formData.serviceCategory.trim() || "General Consultation",
        message: formData.message.trim(),
        status: "new",
        isStarred: false,
        createdAt: serverTimestamp(),
      });

      // 2. Trigger Email Notification via API Route
      try {
        await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            country: formData.country.trim(),
            serviceCategory: formData.serviceCategory.trim() || "General Consultation",
            message: formData.message.trim(),
            notificationEmail: content.notificationEmail || "malithatishamal@gmail.com",
          }),
        });
      } catch (emailErr) {
        console.warn("Email dispatch error (inquiry still saved in DB):", emailErr);
      }

      toast.success("Thank you! Your inquiry has been submitted successfully.");
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        serviceCategory: "",
        message: "",
        consent: false,
      });
    } catch (err: any) {
      console.error("Inquiry submission error:", err);
      toast.error(err.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const enabledPartners = (content.partners || []).filter((p) => p.enabled !== false);

  return (
    <section id="contact-section" className="overflow-x-hidden bg-darkmode dark:bg-darklight scroll-mt-24 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-12 grid-cols-1 md:gap-7 gap-0">
          {/* ═══════════ LEFT COLUMN: CONTACT DETAILS ═══════════ */}
          <div
            className="row-start-1 col-start-1 row-end-2 md:col-end-7 col-end-12"
            data-aos="fade-left"
            data-aos-delay="200"
            data-aos-duration="1000"
          >
            {/* Badge */}
            <div className="flex gap-2 items-center justify-start">
              <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
              <span className="font-medium text-sm text-white">
                {content.badgeText || "build everything"}
              </span>
            </div>

            {/* Headline */}
            <h2 className="sm:text-4xl text-[28px] leading-tight font-bold text-white py-12">
              {content.heading || "Let’s discuss about your project and take it the next level."}
            </h2>

            {/* Info Grid */}
            <div className="grid grid-cols-6 pb-12 border-b border-dark_border">
              {/* Phone */}
              <div className="col-span-3">
                <span className="text-white/50 text-lg">Phone</span>
                <p className="bg-transparent border-0 text-white text-lg font-semibold mt-1">
                  {content.phone ? (
                    <a href={`tel:${content.phone.replace(/\s+/g, "")}`} className="hover:text-primary transition-colors">
                      {content.phone}
                    </a>
                  ) : (
                    "+323-25-8964"
                  )}
                </p>
              </div>

              {/* Email */}
              <div className="col-span-3">
                <span className="text-white/50 text-lg">Email</span>
                <p className="bg-transparent border-0 text-white text-lg font-semibold mt-1">
                  {content.email ? (
                    <a href={`mailto:${content.email}`} className="hover:text-primary transition-colors break-all">
                      {content.email}
                    </a>
                  ) : (
                    "me@landingpro.com"
                  )}
                </p>
              </div>

              {/* Location */}
              <div className="col-span-6 pt-8">
                <span className="text-white/50 text-lg">Location</span>
                <p className="bg-transparent border-0 text-white text-lg font-semibold mt-1">
                  {content.location || "Mark Avenue, Dalls Road, New York"}
                </p>
              </div>
            </div>

            {/* Trusted By Partners */}
            {enabledPartners.length > 0 && (
              <div className="pt-12">
                <p className="text-white/50 pb-4 text-base">
                  {content.trustedByTitle || "Trusted by"}
                </p>
                <div className="flex items-center flex-wrap md:gap-14 gap-7">
                  {enabledPartners.map((partner, idx) => (
                    <Image
                      key={idx}
                      src={getImgPath(partner.logoUrl)}
                      alt={partner.name}
                      width={100}
                      height={24}
                      style={{ width: "auto", height: "auto" }}
                      quality={100}
                      className="max-h-6 max-w-28 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                      unoptimized
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════ RIGHT COLUMN: FORM CARD ═══════════ */}
          <div
            data-aos="fade-right"
            data-aos-delay="200"
            data-aos-duration="1000"
            className="relative before:content-[''] before:absolute before:bg-[url('/images/contact/form-line.png')] before:bg-no-repeat before:w-[13rem] before:h-24 before:top-5% before:bg-contain before:left-[35%] before:z-1 before:translate-x-full lg:before:inline-block before:hidden after:content-[''] after:absolute after:bg-[url('/images/contact/from-round-line.png')] after:bg-no-repeat after:w-[6.3125rem] after:h-[6.3125rem] after:bg-contain after:top-1/2 after:-left-[25%] after:z-1 after:translate-x-1/2 after:translate-y-1/2 md:after:inline-block after:hidden md:row-start-1 row-start-2 md:col-start-8 col-start-1 row-end-2 col-end-13"
          >
            <div className="lg:mt-0 mt-8 bg-white dark:bg-darkmode max-w-[50rem] m-auto pt-[2.1875rem] pb-8 px-[2.375rem] rounded-2xl shadow-xl relative z-10 border border-border/40 dark:border-dark_border">
              <h2 className="sm:text-3xl text-lg font-bold text-midnight_text mb-3 dark:text-white">
                {content.formHeading || "Start the project"}
              </h2>

              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-midnight_text dark:text-white">
                    Inquiry Received!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                    Thank you for reaching out. Your project message has been delivered directly to Malitha. Expect a response soon!
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex w-full m-auto justify-between flex-wrap gap-4">
                  {/* First & Last Name */}
                  <div className="flex gap-4 w-full">
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="text-midnight_text w-full text-base transition-[0.5s] bg-transparent dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary placeholder:text-grey rounded-lg focus-visible:outline-0"
                      type="text"
                      placeholder="First name *"
                      required
                    />
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      type="text"
                      className="text-midnight_text w-full text-base transition-[0.5s] bg-transparent dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary placeholder:text-grey rounded-lg focus-visible:outline-0"
                      placeholder="Last name"
                    />
                  </div>

                  {/* Email */}
                  <div className="w-full">
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      className="text-midnight_text w-full text-base transition-[0.5s] bg-transparent dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary placeholder:text-grey rounded-lg focus-visible:outline-0"
                      placeholder="youremail@website.com *"
                      required
                    />
                  </div>

                  {/* Country */}
                  <div className="w-full">
                    <input
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="text-midnight_text w-full text-base transition-[0.5s] bg-transparent dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary placeholder:text-grey rounded-lg focus-visible:outline-0"
                      type="text"
                      placeholder="Country"
                    />
                  </div>

                  {/* Service / Category Selection */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
                        Interested Service / Project Category
                      </label>
                      {formData.serviceCategory && (
                        <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>✓</span> Selected: {formData.serviceCategory}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        name="serviceCategory"
                        value={formData.serviceCategory}
                        onChange={handleChange as any}
                        className="text-midnight_text w-full text-sm sm:text-base transition-[0.5s] bg-white dark:bg-darkmode dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary rounded-lg focus-visible:outline-0 appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-400">
                          -- Choose a Service Category (Optional) --
                        </option>
                        {serviceOptions.map((opt) => (
                          <option key={opt} value={opt} className="text-midnight_text dark:text-white">
                            {opt}
                          </option>
                        ))}
                        <option value="General Consultation / Other" className="text-midnight_text dark:text-white">
                          General Consultation / Other
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="w-full">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="text-midnight_text h-[9.375rem] w-full text-base transition-[0.5s] bg-transparent dark:border-dark_border dark:text-white px-[0.9375rem] py-[0.830rem] border border-border border-solid focus:border-primary dark:focus:border-primary placeholder:text-grey rounded-lg focus-visible:outline-0"
                      placeholder="Let us know about your project *"
                      required
                    />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2.5">
                    <input
                      id="wp-comment-cookies-consent"
                      name="consent"
                      type="checkbox"
                      checked={formData.consent}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <label
                      htmlFor="wp-comment-cookies-consent"
                      className="text-sm text-grey dark:text-white/70 cursor-pointer select-none"
                    >
                      {content.termsText || "I have read and acknowledge the"}{" "}
                      <a
                        href={content.termsUrl || "#"}
                        className="text-primary hover:underline font-medium"
                      >
                        Terms and Conditions
                      </a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="w-full">
                    <button
                      className="w-full bg-primary hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-md shadow-primary/25 transition duration-300 disabled:opacity-60 cursor-pointer"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting Inquiry..." : (content.submitButtonText || "Submit Inquiry")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contactform;
