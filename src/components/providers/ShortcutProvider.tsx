"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store/uiStore';

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { setSidebarOpen } = useUIStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Ignore if typing in an input
            const activeElement = document.activeElement;
            const isTyping = activeElement?.tagName === 'INPUT' || 
                             activeElement?.tagName === 'TEXTAREA' || 
                             (activeElement as HTMLElement)?.isContentEditable;

            if (isTyping && e.key !== 'Escape') return;

            // 2. Navigation Shortcuts
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'h':
                        e.preventDefault();
                        router.push('/');
                        break;
                    case 's':
                        e.preventDefault();
                        router.push('/settings');
                        break;
                }
            }

            // 3. Search & Modals
            switch (e.key) {
                case '/':
                case 'k':
                    if (e.ctrlKey || e.key === '/') {
                        e.preventDefault();
                        router.push('/search');
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setSidebarOpen(false);
                    // Modals are usually handled by headless-ui, but this is a safety net
                    break;
                case 'Backspace':
                    // Prevent backspace from navigating back if typing
                    if (!isTyping) {
                        e.preventDefault();
                        router.back();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, setSidebarOpen]);

    return <>{children}</>;
}
