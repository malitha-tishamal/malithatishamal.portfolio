import React from "react";
import BlogList from "@/components/Blog/BlogList";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { getBlogsServer } from "@/lib/serverContent";

export const revalidate = 300;

export const metadata = {
  title: { absolute: "Blog & News | Malitha Tishamal" },
  description: "Discover in-depth engineering articles, cloud architecture insights, and the latest tech developments.",
};

const BlogPage = async () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/blog", text: "Blog & News" },
  ];
  const posts = await getBlogsServer();
  return (
    <>
      <HeroSub
        title="Blog & News"
        description="Discover in-depth engineering articles, cloud architecture breakdowns, and tech tutorials crafted with real-world industry experience."
        breadcrumbLinks={breadcrumbLinks}
      />
      <BlogList initialPosts={posts} />
    </>
  );
};

export default BlogPage;