import React from "react";
import TestimonialsList from "@/components/Testimonials/TestimonialsList";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonials & Client Reviews | Malitha Tishamal",
  description: "Discover what industry leaders, clients, and partners say about our technical collaborations, delivery quality, and results.",
};

const TestimonialsPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/testimonials", text: "Testimonials" },
  ];

  return (
    <>
      <HeroSub
        title="Client Testimonials & Reviews"
        description="Explore genuine feedback and reviews from our valued clients, collaborators, and tech leaders."
        breadcrumbLinks={breadcrumbLinks}
      />
      <TestimonialsList />
    </>
  );
};

export default TestimonialsPage;
