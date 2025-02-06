import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/v1/attachments/**',
      },
      {
        protocol: 'https',
        hostname: '0ce8-2401-4900-1f26-548a-3543-fc81-2071-bb9f.ngrok-free.app',
        pathname: '/api/v1/attachments/**',
      },
    ],
  },
};

export default nextConfig;
