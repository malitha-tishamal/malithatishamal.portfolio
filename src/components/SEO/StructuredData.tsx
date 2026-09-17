import React from "react";

interface StructuredDataProps {
  siteUrl?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.com",
}) => {
  // Person Schema (Malitha Tishamal)
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: "Malitha Tishamal",
    alternateName: ["Malitha", "Malitha Tishamal Portfolio", "Tishamal"],
    jobTitle: "Full Stack Developer, DevOps & Network Engineer, AI & Cybersecurity Specialist",
    description:
      "Malitha Tishamal is a Full Stack Software Developer, DevOps Engineer, Network Specialist, and Cybersecurity Practitioner with expertise in scalable web systems, Linux server infrastructure, cloud automation, and software development.",
    url: siteUrl,
    image: `${siteUrl}/images/hero/hero-image.png`,
    email: "mailto:malithatishamal@gmail.com",
    gender: "Male",
    nationality: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Software & Network Engineering",
    },
    knowsAbout: [
      "Software Development",
      "Software Engineering",
      "Computer Networking",
      "Network Engineering",
      "DevOps",
      "Cybersecurity",
      "Cloud Infrastructure",
      "Full Stack Development",
      "Next.js",
      "React",
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Docker",
      "Linux Server Administration",
      "Nginx",
      "PostgreSQL",
      "MongoDB",
      "Firebase",
      "RESTful APIs",
      "System Architecture",
      "Network Security",
      "Penetration Testing"
    ],
    sameAs: [
      "https://github.com/malitha-tishamal",
      "https://www.linkedin.com/in/malithatishamal",
      "https://twitter.com/malithatishamal",
      "https://facebook.com/malithatishamal",
      "https://instagram.com/malithatishamal"
    ],
  };

  // WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "Malitha Tishamal – Full Stack Software Developer & Network Engineer",
    alternateName: "Malitha Tishamal Official Portfolio",
    description:
      "Explore software systems, networking topologies, cloud architectures, licenses, certifications, and technical blogs by Malitha Tishamal.",
    publisher: {
      "@id": `${siteUrl}/#person`,
    },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/projects?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // ProfessionalService Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#service`,
    name: "Malitha Tishamal – Software Development & Network Engineering Services",
    url: siteUrl,
    image: `${siteUrl}/images/hero/hero-image.png`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
    },
    provider: {
      "@id": `${siteUrl}/#person`,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Engineering & Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Full Stack Software Engineering",
            description: "End-to-end web and software application development using Next.js, React, Node.js, Python, and modern architectures.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "DevOps & Cloud Infrastructure",
            description: "CI/CD pipelines, Docker containerization, cloud deployment, and automated systems management.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Computer Networking & Server Architecture",
            description: "Network configuration, Linux server administration, reverse proxies, DNS routing, and resilient infrastructure.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Cybersecurity & Systems Hardening",
            description: "Security audits, vulnerability assessments, server hardening, and secure software development practices.",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
};

export default StructuredData;
