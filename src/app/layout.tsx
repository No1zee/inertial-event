import type { Metadata } from "next";
import "./globals.css";
import BrowserInit from "../components/Common/BrowserInit";
import { AppProviders } from "../components/providers/AppProviders";
import { StatsOverlay } from "../components/debug/StatsOverlay";
import { LivingBackground } from "../components/layout/LivingBackground";
import { SeriesTracker } from "../components/Common/SeriesTracker";
import { Toaster } from "sonner";

// const outfit = Outfit({ subsets: ["latin"] }); -> Replaced with manual link


export const metadata: Metadata = {
    title: {
        default: "NovaStream | The Future of Intelligent Streaming",
        template: "%s | NovaStream"
    },
    description: "Experience the next generation of streaming with NovaStream. Premium selection of Movies, TV Shows, and Anime powered by local AI discovery.",
    keywords: ["streaming", "movies", "tv shows", "anime", "ai search", "semantic discovery", "novastream", "home theater"],
    authors: [{ name: "NovaTeam" }],
    creator: "NovaStream",
    publisher: "NovaStream",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://novastream.app",
        siteName: "NovaStream",
        title: "NovaStream | Intelligent Streaming Platform",
        description: "The next generation of content discovery and visual excellence in streaming.",
        images: [
            {
                url: "/OG_BANNER.png", // We'll generate this next
                width: 1200,
                height: 630,
                alt: "NovaStream Preview",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "NovaStream | Intelligent Streaming",
        description: "Experience AI-powered content discovery and a stunning glassmorphism interface.",
        images: ["/OG_BANNER.png"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function() {
                            if (typeof globalThis === 'undefined') {
                                if (typeof self !== 'undefined') { self.globalThis = self; }
                                else if (typeof window !== 'undefined') { window.globalThis = window; }
                                else { (function() { return this; })().globalThis = (function() { return this; })(); }
                            }
                            console.log('GlobalThis Polyfill Executed');
                        })();
                        `,
                    }}
                />
                <meta
                    httpEquiv="Content-Security-Policy"
                    content="default-src 'self' app: proxy: http://localhost:3000 ws://localhost:3000; script-src 'self' 'unsafe-eval' 'unsafe-inline' app: http://localhost:3000; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com app: http://localhost:3000; font-src 'self' https://fonts.gstatic.com data: app: http://localhost:3000; img-src 'self' data: blob: https://*.tmdb.org https://*.themoviedb.org https://*.youtube.com https://i.ytimg.com https://* app: proxy: http://localhost:3000; connect-src 'self' ws: wss: https://inertial-event.vercel.app https://*.themoviedb.org https://*.tmdb.org https://*.vidlink.pro https://*.vidsrc.me https://*.vidsrc.icu http://localhost:3000 ws://localhost:3000 http://localhost:5000 app: proxy:; media-src 'self' blob: https: http: app: proxy: http://localhost:3000; frame-src 'self' https://*.youtube.com https://*.vidlink.pro https://*.vidsrc.me https://*.vidsrc.icu app: http://localhost:3000; object-src 'none'; child-src 'none'; worker-src 'self' blob: app: http://localhost:3000; manifest-src 'self' app: http://localhost:3000; upgrade-insecure-requests;"
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
            </head>
            <body style={{ fontFamily: "'Outfit', sans-serif" }}>
                <AppProviders>
                    <Toaster position="top-right" richColors theme="dark" />
                    <SeriesTracker />
                    <LivingBackground />
                    <BrowserInit />
                    <StatsOverlay />
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
