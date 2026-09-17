import React from "react";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { Metadata } from "next";
import Services from "@/components/Home/Services";

export const metadata: Metadata = {
  title: "Engineering Services & Solutions | Malitha Tishamal – Software, DevOps & Networking",
  description:
    "Explore professional engineering services offered by Malitha Tishamal: Full-Stack Software Development, Computer Networking, DevOps & Cloud Infrastructure, and Cybersecurity Systems Hardening.",
  keywords: [
    "Malitha Tishamal Services",
    "Software Development Services",
    "Network Engineering Solutions",
    "DevOps Consulting Sri Lanka",
    "Cybersecurity Hardening",
    "Full Stack Web Applications"
  ],
};

const ServicesPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/services", text: "Services" },
  ];
  return (
    <>
      <HeroSub
        title="Engineering Services"
        description="Comprehensive technical capabilities across full-stack software development, cloud infrastructure automation, computer networking, and cybersecurity systems."
        breadcrumbLinks={breadcrumbLinks}
      />
      <Services />
    </>
  );
};

export default ServicesPage;
