import React from "react";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { CertificationsList } from "@/components/Certifications/CertificationsList";
import { getCertificationsServer } from "@/lib/serverContent";

export const revalidate = 300;

export const metadata = {
  title: "Licenses & Certifications | Malitha Tishamal",
  description: "Verified technical credentials, cloud accreditations, cybersecurity certifications, and engineering qualifications.",
};

const CertificationsPage = async () => {
  const breadcrumbLinks = [
    { href: "/", text: "Home" },
    { href: "/certifications", text: "Certifications" },
  ];
  const items = await getCertificationsServer();

  return (
    <>
      <HeroSub
        title="Licenses & Certifications"
        description="Explore my verified professional credentials, vendor accreditations, and specialized technical certifications across Cybersecurity, Networking, and Cloud Computing."
        breadcrumbLinks={breadcrumbLinks}
      />
      <CertificationsList initialItems={items} />
    </>
  );
};

export default CertificationsPage;