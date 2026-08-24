export interface HeroContent {
  badgeText: string;
  title: string;
  description: string;
  getStartedText: string;
  getStartedLink: string;
  heroImageUrl: string;
  signatureImageUrl: string;
  needHelpText: string;
  atsCvUrl: string;
  atsCvFileName?: string;
  creativeCvUrl: string;
  creativeCvFileName?: string;
  updatedAt?: any;
}

export const defaultHeroContent: HeroContent = {
  badgeText: "build everything",
  title: "Unveiling My Professional Odyssey: Portfolio Highlights",
  description: "A brief introduction about myself and my professional objectives.",
  getStartedText: "Get Started",
  getStartedLink: "#contact-section",
  heroImageUrl: "/images/hero/malitha-hero.png",
  signatureImageUrl: "/images/hero/signature.png",
  needHelpText: "Need help? Contact Me Tell about your project",
  atsCvUrl: "",
  atsCvFileName: "Malitha_Tishamal_ATS_CV.pdf",
  creativeCvUrl: "",
  creativeCvFileName: "Malitha_Tishamal_Creative_CV.pdf",
};
