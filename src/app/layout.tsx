import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BrowserInit from "../components/Common/BrowserInit";
import { AppProviders } from "../components/providers/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Inertial Event",
    description: "Advanced Streaming Client",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta
                    httpEquiv="Content-Security-Policy"
                    content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai data:; img-src 'self' https: data: blob: https://image.tmdb.org; connect-src 'self' http://localhost:* ws://localhost:* https://sentry.io https://api.themoviedb.org https://vidsrc.me https://vidlink.pro; media-src 'self' blob: https:; frame-src 'self' https:;"
                />
            </head>
            <body className={inter.className}>
                <AppProviders>
                    <BrowserInit />
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
