const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_PUBLIC_ELECTRON === 'true' ? 'export' : undefined, // Enabled for Electron static build
  reactStrictMode: false,
  compress: true,
  productionBrowserSourceMaps: false, // Re-enable only for deep production debugging

  images: {
    loader: 'custom',
    loaderFile: './src/lib/utils/imageLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.transparenttextures.com',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, 
  },

  experimental: {
    optimizePackageImports: [
      '@headlessui/react', 
      'lucide-react', 
      'framer-motion'
    ],
  },
  transpilePackages: [
    '@vidstack/react',
    'hls.js',
    'dashjs'
  ],
  swcMinify: true,
  webpack: (config, options) => {
    // Force react-hook-form to use CJS via absolute path alias
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-hook-form': path.join(__dirname, 'node_modules/react-hook-form/dist/index.cjs.js'),
      'tailwind-merge': path.join(__dirname, 'node_modules/tailwind-merge/dist/es5/bundle-cjs.js'),
    };

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
