import { getImgPath } from '@/utils/image';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ href = "/", className = "" }) => {
  return (
    <Link href={href} aria-label="Malitha Tishamal – home" className={`flex items-center ${className}`}>
      {/* Both variants share one 10:3 box and swap by opacity, so the rendered
          aspect ratio always matches the 200×60 source (no 0×0 hidden node). */}
      <span className="relative block h-[52px] aspect-[10/3]">
        <Image
          src={getImgPath("/images/logo/malitha-logo.png")}
          alt="Malitha Tishamal"
          fill
          sizes="174px"
          loading="eager"
          fetchPriority="low"
          className="object-contain transition-opacity dark:opacity-0"
        />
        <Image
          src={getImgPath("/images/logo/malitha-logo-white.png")}
          alt=""
          fill
          sizes="174px"
          loading="eager"
          fetchPriority="low"
          aria-hidden="true"
          className="object-contain opacity-0 transition-opacity dark:opacity-100"
        />
      </span>
    </Link>
  );
};

export default Logo;
