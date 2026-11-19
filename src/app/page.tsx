import React from 'react'
import { Metadata } from "next";
import dynamic from 'next/dynamic';
import Hero from '@/components/Home/Hero';
import Counter from '@/components/Home/Counter'
import Services from '@/components/Home/Services';
import TechStack from '@/components/Home/TechStack';

const ExperienceEducation = dynamic(() => import('@/components/SharedComponent/ExperienceEducation'));
const Certifications = dynamic(() => import('@/components/SharedComponent/Certifications'));
const Portfolio = dynamic(() => import('@/components/SharedComponent/portfollio'));
const Projects = dynamic(() => import('@/components/SharedComponent/Projects'));
const Testimonial = dynamic(() => import('@/components/SharedComponent/Testimonial'));
const Blog = dynamic(() => import('@/components/SharedComponent/Blog'));
const Contactform = dynamic(() => import('@/components/Home/Contact'));
import {
  getHeroServer,
  getCounterServer,
  getServicesServer,
  getTechStackServer,
  getExperiencesServer,
  getCertificationsServer,
  getPortfolioServer,
  getProjectsServer,
  getFeaturedProjectsSettingsServer,
  getTestimonialsServer,
  getBlogsServer,
} from '@/lib/serverContent';

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Malitha Tishamal – Full Stack Developer & DevOps Engineer | AI & Cybersecurity Specialist",
};

export default async function Home() {
  const [
    heroData,
    counterData,
    servicesData,
    techStackData,
    experiences,
    certifications,
    portfolio,
    projects,
    featuredProjectsSettings,
    testimonials,
    blogs,
  ] = await Promise.all([
    getHeroServer(),
    getCounterServer(),
    getServicesServer(),
    getTechStackServer(),
    getExperiencesServer(),
    getCertificationsServer(),
    getPortfolioServer(),
    getProjectsServer(),
    getFeaturedProjectsSettingsServer(),
    getTestimonialsServer(),
    getBlogsServer(),
  ]);

  return (
    <main>
      <Hero initialData={heroData} />
      <Counter initialData={counterData} isColorMode={false} />
      <Services initialServices={servicesData.services} initialContent={servicesData.content} />
      <TechStack initialItems={techStackData.items} initialCategories={techStackData.categories} initialSection={techStackData.section} />
      <ExperienceEducation initialExperiences={experiences} />
      <Certifications initialItems={certifications} />
      <Portfolio initialItems={portfolio} />
      <Projects initialProjects={projects} initialSettings={featuredProjectsSettings} />
      <Testimonial initialItems={testimonials} />
      <Blog initialPosts={blogs} />
      <Contactform />
    </main>
  );
}
