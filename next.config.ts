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
    // Only run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib', 'types'],
    // Ignore ESLint errors during build (optional - can be removed if you want strict linting)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Ignore TypeScript errors during build (optional - can be removed if you want strict type checking)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
