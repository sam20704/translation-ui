// next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable Turbopack temporarily to avoid conflicts
  experimental: {
    turbo: undefined,
  },
  webpack(config) {
    config.resolve = {
      ...(config.resolve || {}),
      alias: {
        ...(config.resolve.alias || {}),
        canvas: false,
        encoding: false,
      },
      fallback: {
        ...(config.resolve.fallback || {}),
        canvas: false,
        encoding: false,
      },
    };
    return config;
  },
  // Fix the workspace root warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
