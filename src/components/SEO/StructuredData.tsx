import React from "react";

interface StructuredDataProps {
  siteUrl?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://malithatishamal.vercel.app",
}) => {
  // Person Schema (Malitha Tishamal)
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: "Malitha Tishamal",
    alternateName: ["Malitha", "Malitha Tishamal Portfolio", "Tishamal", "Software Developer Sri Lanka"],
    jobTitle: "Full Stack Developer, DevOps Engineer, Network Specialist, AI & Cybersecurity Expert",
    description:
      "Malitha Tishamal is an industry-leading Full Stack Software Developer, DevOps Engineer, Network Specialist, and Cybersecurity Expert with extensive experience in scalable web systems, enterprise software development, Linux server infrastructure, cloud automation, AI solutions, and network security.",
    url: siteUrl,
    image: `${siteUrl}/images/hero/hero-image.png`,
    email: "mailto:malithatishamal@gmail.com",
    gender: "Male",
    nationality: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
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
      "DevOps Engineering",
      "Cybersecurity",
      "Network Security",
      "Cloud Infrastructure",
      "Cloud Computing",
      "Full Stack Development",
      "Web Development",
      "Enterprise Software",
      "Next.js",
      "React",
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Docker",
      "Kubernetes",
      "Linux Server Administration",
      "Nginx",
      "PostgreSQL",
      "MongoDB",
      "Firebase",
      "RESTful APIs",
      "GraphQL",
      "Microservices",
      "System Architecture",
      "Network Security",
      "Penetration Testing",
      "AI Development",
      "Machine Learning",
      "Artificial Intelligence",
      "AWS",
      "Azure",
      "Google Cloud",
      "CI/CD",
      "Software Architecture",
      "Technical Consulting"
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
    name: "Malitha Tishamal – Expert Software Developer, DevOps Engineer & Network Specialist",
    alternateName: "Malitha Tishamal Official Portfolio",
    description:
      "Industry-leading software development and network engineering services. Expert in full-stack development, DevOps, AI, cybersecurity, cloud infrastructure, and enterprise software solutions.",
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
    name: "Malitha Tishamal – Expert Software Development & Network Engineering Services",
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
      name: "Industry Engineering & Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Full Stack Software Engineering",
            description: "Enterprise-grade web and software application development using Next.js, React, Node.js, Python, and modern microservices architectures for scalable business solutions.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "DevOps & Cloud Infrastructure",
            description: "Professional CI/CD pipelines, Docker containerization, Kubernetes orchestration, AWS/Azure/GCP cloud deployment, and automated systems management for enterprise operations.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Computer Networking & Server Architecture",
            description: "Advanced network configuration, Linux server administration, reverse proxies, DNS routing, load balancing, and resilient infrastructure design for high-availability systems.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Cybersecurity & Systems Hardening",
            description: "Comprehensive security audits, vulnerability assessments, penetration testing, server hardening, secure software development practices, and enterprise security solutions.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI & Machine Learning Solutions",
            description: "Custom AI development, machine learning model implementation, data processing pipelines, and intelligent automation solutions for business optimization.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Technical Consulting & Architecture",
            description: "Enterprise software architecture consulting, technology stack optimization, digital transformation strategy, and technical leadership for complex software projects.",
          },
        },
      ],
    },
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Malitha Tishamal – Software Development & Network Engineering",
    url: siteUrl,
    logo: `${siteUrl}/images/logo/malitha-logo-white.png`,
    description: "Industry-leading software development and network engineering services specializing in full-stack development, DevOps, AI, cybersecurity, and cloud infrastructure solutions.",
    founder: {
      "@id": `${siteUrl}/#person`,
    },
    foundingDate: "2020",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+94-XX-XXX-XXXX",
      contactType: "customer service",
      email: "malithatishamal@gmail.com",
    },
    sameAs: [
      "https://github.com/malitha-tishamal",
      "https://www.linkedin.com/in/malithatishamal",
      "https://twitter.com/malithatishamal",
      "https://facebook.com/malithatishamal",
      "https://instagram.com/malithatishamal"
    ],
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Portfolio",
        item: `${siteUrl}/#portfolio`,
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
};

export default StructuredData;
