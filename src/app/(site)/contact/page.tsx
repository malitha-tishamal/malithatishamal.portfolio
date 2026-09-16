import React from "react";
import { Metadata } from "next";
import HeroSub from "@/components/SharedComponent/HeroSub";
import Contactform from "@/components/Home/Contact";

export const metadata: Metadata = {
  title: "Contact | Malitha Tishamal – Full Stack Developer & DevOps Engineer",
  description:
    "Get in touch with Malitha Tishamal for software development, DevOps, cybersecurity, and networking projects. Let's build something great together.",
};

const ContactPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/contact", text: "Contact" },
  ];

  return (
    <>
      <HeroSub
        title="Get In Touch"
        description="Have a project in mind? Let's talk — whether it's software development, cloud infrastructure, cybersecurity, or networking, I'm here to help."
        breadcrumbLinks={breadcrumbLinks}
      />
      <Contactform />
    </>
  );
};

export default ContactPage;
