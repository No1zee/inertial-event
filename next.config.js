/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: '**.anilist.co',
      },
      {
        protocol: 'https',
        hostname: '**.jikan.moe',
      },
      {
        protocol: 'https',
        hostname: '**.consumet.org',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data:",
              "img-src 'self' https: data: blob: https://image.tmdb.org",
              "connect-src 'self' http://localhost:* ws://localhost:* https://sentry.io https://api.themoviedb.org https://vidsrc.me https://vidlink.pro",
              "media-src 'self' blob: https:",
              "frame-src 'self' https:"
            ].join('; '),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/:path*',
      },
    ];
  },



  experimental: {
    optimizePackageImports: ['@headlessui/react', 'lucide-react'],
  },
};

module.exports = nextConfig;
