import React from "react";
import ProjectsList from "@/components/Projects/ProjectsList";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { getFeaturedProjectsSettingsServer, getProjectsServer } from "@/lib/serverContent";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Engineering Projects & Software Systems | Malitha Tishamal",
  description: "Browse our production-grade software applications, mobile apps, DevOps architectures, and cloud solutions.",
};

const ProjectsPage = async () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/projects", text: "Projects" },
  ];
  const [projects, settings] = await Promise.all([
    getProjectsServer(),
    getFeaturedProjectsSettingsServer(),
  ]);

  return (
    <>
      <HeroSub
        title="Engineering Projects & Architecture"
        description="Explore production-grade software systems, cross-platform mobile apps, cloud architectures, and open-source contributions."
        breadcrumbLinks={breadcrumbLinks}
      />
      <ProjectsList initialProjects={projects} initialSettings={settings} />
    </>
  );
};

export default ProjectsPage;
