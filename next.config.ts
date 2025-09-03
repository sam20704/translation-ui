// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Other existing Next.js config...
  webpack(config) {
    // Alias the 'canvas' module to false (empty) for browser build
    config.resolve = {
      ...(config.resolve || {}),
      alias: {
        ...(config.resolve.alias || {}),
        canvas: false,
      },
    };
    return config;
  },
};

export default nextConfig;
