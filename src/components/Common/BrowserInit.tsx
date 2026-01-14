"use client";

import { useEffect } from "react";

export default function BrowserInit() {
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then((registration) => {
                    console.log('SW registered: ', registration);
                }).catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }

        // Global uncaught error logging
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('[AG] Global Uncaught Error:', { message, source, lineno, colno, error });
        };

        window.onunhandledrejection = (event) => {
            console.error('[AG] Global Unhandled Rejection:', event.reason);
        };
    }, []);

    return null;
}
