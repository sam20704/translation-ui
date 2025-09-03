// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
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
