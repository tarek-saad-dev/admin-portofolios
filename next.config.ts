import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  eslint: {
    // Disable ESLint during builds to prevent build failures
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (optional - can be removed if you want strict type checking)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
