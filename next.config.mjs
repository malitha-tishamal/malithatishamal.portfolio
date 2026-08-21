/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingExcludes: {
    '*': ['./venus-nextjs-1.0.0/**', './venus-nextjs-1.0.0.zip'],
  },
};

export default nextConfig;

