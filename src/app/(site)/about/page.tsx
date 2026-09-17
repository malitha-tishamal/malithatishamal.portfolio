import React from "react";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { Metadata } from "next";
import Counter from "@/components/Home/Counter";
import TechStack from "@/components/Home/TechStack";
import ExperienceEducation from "@/components/SharedComponent/ExperienceEducation";

export const metadata: Metadata = {
  title: "About Malitha Tishamal – Full Stack Software Developer & Network Engineer",
  description:
    "Learn more about Malitha Tishamal: Full Stack Software Developer, DevOps Engineer, Computer Network Specialist, and Cybersecurity Practitioner. Background, technical philosophy, and experience.",
  keywords: [
    "About Malitha Tishamal",
    "Malitha Tishamal Background",
    "Malitha Software Developer",
    "Malitha Network Engineer",
    "Malitha Tishamal Bio",
    "Sri Lanka Software Engineer"
  ],
};

const AboutPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/about", text: "About" },
  ];
  return (
    <>
      <HeroSub
        title="About Malitha Tishamal"
        description="Full Stack Software Developer, Computer Network Engineer, DevOps practitioner, and Cybersecurity specialist passionate about engineering high-performance systems."
        breadcrumbLinks={breadcrumbLinks}
      />
      <Counter isColorMode={true} />
      <TechStack />
      <ExperienceEducation />
    </>
  );
};

export default AboutPage;
