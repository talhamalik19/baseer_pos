// /** @type {import('next').NextConfig} */

// const nextConfig = {
//   images: {
//     formats: ['image/avif', 'image/webp'],
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'web.baseer.ca',
//         pathname: '/media/**',
//       },
//       {
//         protocol: 'https',
//         hostname: 'web.baseer.ca',
//         pathname: '/static/**',
//       },
//     ],
//   },
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.zaafoo.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
