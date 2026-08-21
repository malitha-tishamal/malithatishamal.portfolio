import { getImgPath } from '@/utils/image';
import Image from 'next/image';
import Link from 'next/link';

const Logo: React.FC = () => {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src={getImgPath("/images/logo/malitha-logo.png")}
        alt="Malitha"
        width={160}
        height={45}
        style={{ width: 'auto', height: '40px' }}
        quality={100}
        priority
        unoptimized
      />
    </Link>
  );
};

export default Logo;
