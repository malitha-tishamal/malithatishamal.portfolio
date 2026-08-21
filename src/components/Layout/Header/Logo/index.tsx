import { getImgPath } from '@/utils/image';
import Image from 'next/image';
import Link from 'next/link';

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center">
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
