import React from "react";
import BlogList from "@/components/Blog/BlogList";
import HeroSub from "@/components/SharedComponent/HeroSub";

export const metadata = {
  title: "Blog & News | Malitha Tishamal",
  description: "Discover in-depth engineering articles, cloud architecture insights, and the latest tech developments.",
};

const BlogPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/blog", text: "Blog & News" },
  ];
  return (
    <>
      <HeroSub
        title="Blog & News"
        description="Discover in-depth engineering articles, cloud architecture breakdowns, and tech tutorials crafted with real-world industry experience."
        breadcrumbLinks={breadcrumbLinks}
      />
      <BlogList />
    </>
  );
};

export default BlogPage;