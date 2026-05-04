import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import BrowserInit from '../components/Common/BrowserInit';
import { AppProviders } from '../components/providers/AppProviders';
import { StatsOverlay } from '../components/debug/StatsOverlay';
import { LivingBackground } from '../components/layout/LivingBackground';
import { SeriesTracker } from '../components/Common/SeriesTracker';
import { RouteInterceptor } from '../components/Common/RouteInterceptor';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const outfit = localFont({
  src: '../../node_modules/@fontsource/outfit/files/outfit-latin-400-normal.woff2',
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = localFont({
  src: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2',
  variable: '--font-playfair',
  display: 'swap',
});

const inter = localFont({
  src: '../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2',
  variable: '--font-inter',
  display: 'swap',
});

const bebas = localFont({
  src: '../../node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2',
  variable: '--font-bebas',
  display: 'swap',
});

const montserrat = localFont({
  src: '../../node_modules/@fontsource/montserrat/files/montserrat-latin-400-normal.woff2',
  variable: '--font-montserrat',
  display: 'swap',
});

const raleway = localFont({
  src: '../../node_modules/@fontsource/raleway/files/raleway-latin-400-normal.woff2',
  variable: '--font-raleway',
  display: 'swap',
});

const ptsans = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/pt-sans/files/pt-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/pt-sans/files/pt-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-ptsans',
  display: 'swap',
});

const koulen = localFont({
  src: '../../node_modules/@fontsource/koulen/files/koulen-latin-400-normal.woff2',
  variable: '--font-koulen',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://novastream.media'),
  title: {
    default: 'NovaStream',
    template: '%s | NovaStream',
  },
  description: 'Streaming platform for movies, TV shows, and anime.',
  keywords: ['streaming', 'movies', 'tv', 'anime', 'NovaStream'],
  authors: [{ name: 'NovaStream Team' }],
  creator: 'NovaStream',
  publisher: 'NovaStream',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://novastream.media',
    siteName: 'NovaStream',
    title: 'NovaStream',
    description: 'Streaming platform for movies, TV shows, and anime.',
    images: [
      {
        url: '/OG_BANNER.png',
        width: 1200,
        height: 630,
        alt: 'NovaStream',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaStream',
    description: 'Streaming platform for movies, TV shows, and anime.',
    images: ['/OG_BANNER.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${playfair.variable} ${bebas.variable} ${montserrat.variable} ${raleway.variable} ${ptsans.variable} ${koulen.variable}`}
    >
      <head>
        <link rel="dns-prefetch" href="https://wsrv.nl" />
        <link rel="preconnect" href="https://wsrv.nl" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
                        (function() {
                            if (typeof globalThis === 'undefined') {
                                if (typeof self !== 'undefined') { self.globalThis = self; }
                                else if (typeof window !== 'undefined') { window.globalThis = window; }
                                else { (function() { return this; })().globalThis = (function() { return this; })(); }
                            }
                        })();
                        `,
          }}
        />
      </head>
      <body className="font-outfit selection:bg-primary selection:text-white antialiased bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('Loading chunk') || e.message.includes('ChunkLoadError'))) {
                  console.warn('[NovaStream] ChunkLoadError detected. Rehydrating session...');
                  window.location.reload();
                }
              }, true);
            `
          }}
        />
        <AppProviders>
          <RouteInterceptor />
          <Toaster position="top-right" richColors theme="light" />
          <SeriesTracker />
          <LivingBackground />
          <BrowserInit />
          {process.env.NODE_ENV === 'development' && <StatsOverlay />}
          {children}
          <Analytics />
          <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
