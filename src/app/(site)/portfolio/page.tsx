import React from "react";
import Portfolio from "@/components/portfolio/PortfolioList";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { getPortfolioCategoriesServer, getPortfolioServer } from "@/lib/serverContent";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio Showcase | Malitha Tishamal – Software, Engineering & Work",
  description:
    "Explore the official portfolio of Malitha Tishamal. Showcasing software development competitions, event achievements, mobile applications, and technical highlights.",
  keywords: [
    "Malitha Tishamal Portfolio",
    "Malitha Portfolio",
    "Malitha Tishamal Work",
    "Software Engineering Showcase",
    "Malitha Competitions",
    "Sri Lanka Software Developer"
  ],
};

const PortfolioListPage = async () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/portfolio", text: "Portfolio" },
  ];
  const items = await getPortfolioServer();
  const categories = await getPortfolioCategoriesServer();
  return (
    <>
      <HeroSub
        title="Portfolio Showcase"
        description="A curated gallery of engineering milestones, competition wins, technical events, and software highlights by Malitha Tishamal."
        breadcrumbLinks={breadcrumbLinks}
      />
      <Portfolio initialItems={items} initialCategories={categories} />
    </>
  );
};

export default PortfolioListPage;