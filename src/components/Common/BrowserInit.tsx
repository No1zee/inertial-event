"use client";

import { useEffect, useState } from "react";
import { initializeTheme } from "@/lib/store/themeStore";
import 'core-js/stable';
import 'resize-observer-polyfill';

export default function BrowserInit() {
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Explicit Polyfill Binding
        // @ts-ignore
        if (!window.ResizeObserver && ResizeObserver) {
            // @ts-ignore
            window.ResizeObserver = ResizeObserver;
        }

        initializeTheme();

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
            const el = document.getElementById('ag-debug-log');
            if (el) el.innerHTML += `<div style="color:red; margin-top:4px; border-bottom:1px solid #333">ERR: ${message}</div>`;
        };

        window.onunhandledrejection = (event) => {
            console.error('[AG] Global Unhandled Rejection:', event.reason);
            const el = document.getElementById('ag-debug-log');
            if (el) el.innerHTML += `<div style="color:orange; margin-top:4px; border-bottom:1px solid #333">REJ: ${event.reason}</div>`;
        };

        // Keyboard listener for 'D' key to toggle debug overlay
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            const activeElement = document.activeElement;
            const isTyping = activeElement?.tagName === 'INPUT' || 
                             activeElement?.tagName === 'TEXTAREA' || 
                             (activeElement as HTMLElement)?.isContentEditable;
            if (isTyping) return;

            if (e.key.toLowerCase() === 'd') {
                setShowDebug(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Safe "process" check
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Active TMDB & Google Ping
    useEffect(() => {
        if (!showDebug) return;
        
        const ping = async () => {
            const el = document.getElementById('ag-debug-log');
            if (!el) return;
            
            el.innerHTML += `<div style="color:white">--- DIAGNOSTIC ---</div>`;
            el.innerHTML += `<div>Date: ${new Date().toLocaleTimeString()}</div>`;
            
            // 1. Google Ping (Internet Check)
            try {
                const start = Date.now();
                await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
                el.innerHTML += `<div style="color:#0f0">NET: INTERNET OK (${Date.now() - start}ms)</div>`;
            } catch (e) {
                el.innerHTML += `<div style="color:red">NET: NO INTERNET</div>`;
            }

            // 2. TMDB Ping (Image Check)
            try {
                const start = Date.now();
                // Fetch a small known image
                await fetch('https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg', { mode: 'no-cors' });
                el.innerHTML += `<div style="color:#0f0">TMDB: REACHABLE (${Date.now() - start}ms)</div>`;
            } catch (e) {
                el.innerHTML += `<div style="color:red">TMDB: BLOCKED/UNREACHABLE</div>`;
            }
        };
        
        setTimeout(ping, 500);
    }, [showDebug]);

    if (!showDebug) return null;

    return (
        <div 
            id="ag-debug-log"
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(50, 0, 0, 0.95)',
                border: '2px solid white',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '12px',
                zIndex: 999999,
                width: '400px',
                maxHeight: '400px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                boxShadow: '0 0 20px rgba(0,0,0,0.8)'
            }}
        >
            <div style={{borderBottom:'1px solid #666', marginBottom:'8px', paddingBottom:'4px'}}>
                DEBUG OVERLAY v3 <span style={{fontSize:'10px', opacity:0.6}}>(Press D to hide)</span>
            </div>
            <div>API: {apiUrl}</div>
            <div id="log-container"></div>
        </div>
    );
}

