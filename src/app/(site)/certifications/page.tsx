import React from "react";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { CertificationsList } from "@/components/Certifications/CertificationsList";

export const metadata = {
  title: "Licenses & Certifications | Malitha Tishamal",
  description: "Verified technical credentials, cloud accreditations, cybersecurity certifications, and engineering qualifications.",
};

const CertificationsPage = () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/certifications", text: "Certifications" },
  ];

  return (
    <>
      <HeroSub
        title="Licenses & Certifications"
        description="Explore my verified professional credentials, vendor accreditations, and specialized technical certifications across Cybersecurity, Networking, and Cloud Computing."
        breadcrumbLinks={breadcrumbLinks}
      />
      <CertificationsList />
    </>
  );
};

export default CertificationsPage;