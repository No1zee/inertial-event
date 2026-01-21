import type { Metadata } from "next";
import "./globals.css";
import BrowserInit from "../components/Common/BrowserInit";
import { AppProviders } from "../components/providers/AppProviders";

// const outfit = Outfit({ subsets: ["latin"] }); -> Replaced with manual link


export const metadata: Metadata = {
    title: "NovaStream",
    description: "Next Generation Streaming",
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
                    content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: app: proxy:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live app:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com app:; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data: app:; img-src 'self' http: https: data: blob: app: proxy:; connect-src 'self' http://localhost:* http://192.168.100.13:* ws://localhost:* app: proxy: https:; media-src 'self' blob: app: proxy: https: http: http://localhost:*; frame-src 'self' https: app: proxy:;"
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
            </head>
            <body style={{ fontFamily: "'Outfit', sans-serif" }}>
                <AppProviders>
                    <BrowserInit />
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
