import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Malitha Tishamal – Full Stack Developer & Network Engineer",
    short_name: "Malitha",
    description:
      "Official portfolio of Malitha Tishamal. Full Stack Software Developer, DevOps Engineer, Computer Network Specialist, and Cybersecurity Practitioner.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a66c2",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
