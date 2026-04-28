import type { Metadata } from 'next';
import { Outfit, Inter, Playfair_Display, Bebas_Neue, Montserrat, Raleway, PT_Sans, Koulen } from 'next/font/google';
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

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
});

const ptsans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-ptsans',
  display: 'swap',
});

const koulen = Koulen({
  weight: '400',
  subsets: ['khmer'],
  variable: '--font-koulen',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://MaiWatch.media'),
  title: {
    default: 'MaiWatch',
    template: '%s | MaiWatch',
  },
  description: 'Streaming platform for movies, TV shows, and anime.',
  keywords: ['streaming', 'movies', 'tv', 'anime', 'MaiWatch'],
  authors: [{ name: 'MaiWatchTeam' }],
  creator: 'MaiWatch',
  publisher: 'MaiWatch',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://MaiWatch.media',
    siteName: 'MaiWatch',
    title: 'MaiWatch',
    description: 'Streaming platform for movies, TV shows, and anime.',
    images: [
      {
        url: '/OG_BANNER.png',
        width: 1200,
        height: 630,
        alt: 'MaiWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MaiWatch',
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
