const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'export',
  reactStrictMode: false,
  compress: true,
  productionBrowserSourceMaps: true,

  images: {
    unoptimized: true,
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  experimental: {
    optimizePackageImports: ['@headlessui/react'],
  },
  transpilePackages: [
    'lucide-react', 
    '@headlessui/react', 
    'framer-motion', 
    'zustand', 
    'axios', 
    '@radix-ui/react-dialog', 
    '@vidstack/react',
    'hls.js',
    'dashjs',
    '@tanstack/react-query',
    '@tanstack/query-core',
    'uuid',
    'zod',
    'react-hook-form',
    'maverick.js',
    'media-captions',
    'media-icons',
    'tailwind-merge',
    'clsx'
  ],
  swcMinify: true,
  webpack: (config, options) => {
    // Force react-hook-form to use CJS via absolute path alias
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-hook-form': path.join(__dirname, 'node_modules/react-hook-form/dist/index.cjs.js'),
      'tailwind-merge': path.join(__dirname, 'node_modules/tailwind-merge/dist/es5/bundle-cjs.js'),
    };

    // Force transpilation for Vidstack dependencies
    config.module.rules.push({
      test: /\.(js|mjs)$/,
      include: [
        path.join(__dirname, 'node_modules/@vidstack'),
        path.join(__dirname, 'node_modules/media-captions'),
        path.join(__dirname, 'node_modules/lucide-react'),
        path.join(__dirname, 'node_modules/tailwind-merge'),
        path.join(__dirname, 'node_modules/clsx'),
        path.join(__dirname, 'node_modules/react-hook-form'),
      ],
      use: [options.defaultLoaders.babel],
    });

    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
