import { getImgPath } from '@/utils/image';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ href = "/", className = "" }) => {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      {/* Light Mode Logo (Dark text) */}
      <Image
        src={getImgPath("/images/logo/malitha-logo.png")}
        alt="Malitha"
        width={200}
        height={60}
        style={{ width: 'auto', height: '52px' }}
        quality={100}
        priority
        unoptimized
        className="dark:hidden block transition-all"
      />
      {/* Dark Mode Logo (White text) */}
      <Image
        src={getImgPath("/images/logo/malitha-logo-white.png")}
        alt="Malitha"
        width={200}
        height={60}
        style={{ width: 'auto', height: '52px' }}
        quality={100}
        priority
        unoptimized
        className="dark:block hidden transition-all"
      />
    </Link>
  );
};

export default Logo;
