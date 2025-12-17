/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jazzweb.baseer.ca',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'admin.juicestation.com.pk',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['twilio'],
  },
  outputFileTracing: true,
  
  // Add Twilio to external packages for Turbopack
  serverExternalPackages: ['twilio'],
  
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

module.exports = nextConfig;