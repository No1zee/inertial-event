"use client";

import { QueryProvider } from "./QueryProvider";
// import { ZustandProvider } from "./ZustandProvider"; // Will implement later if needed, mostly Zustand is global hook

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            {/* <ZustandProvider> */}
            {children}
            {/* </ZustandProvider> */}
        </QueryProvider>
    );
}
