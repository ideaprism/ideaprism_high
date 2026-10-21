import type { NextConfig } from "next";
import dotenv from 'dotenv';
import path from 'path';

// Force load env vars from file to override polluted shell envs
// This fixes the issue where the terminal session is holding incorrect old DB configs
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
  console.log('[Config] Enforced environment variables from .env files.');
} catch (e) {
  console.error('Failed to load env files manually:', e);
}

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'www.kipris.or.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.kipris.or.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
