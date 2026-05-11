'use client';

import { useEffect, useState } from 'react';
import { initializeTheme, usePreferencesStore, useUIStore } from '@/lib/stores';
import { useLocalDataStore } from '@/lib/stores/localDataStore';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import 'core-js/stable';
import 'resize-observer-polyfill';

export default function BrowserInit() {
  const [showDebug, setShowDebug] = useState(false);

  const { activeProfileId, profiles, deleteProfile } = useLocalDataStore();
  const { setHasCompletedOnboarding } = usePreferencesStore();

  useEffect(() => {
    // Explicit Polyfill Binding
    if (!window.ResizeObserver && ResizeObserver) {
      window.ResizeObserver = ResizeObserver;
    }

    initializeTheme();

    // Guest Mode Reset Logic (Resets after every visit)
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    
    if (activeProfile?.isGuest) {
      console.log('🧹 [AG] Guest Session detected in BrowserInit. checking route...');
      // Only reset if we are NOT on the onboarding page (prevents loop during onboarding)
      if (window.location.pathname !== '/onboarding') {
        console.log('🧹 [AG] Resetting guest session for new visit...');
        deleteProfile(activeProfileId!);
        setHasCompletedOnboarding(false);
      }
    }

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Global uncaught error logging
    window.onerror = (message, source, lineno, colno, error) => {
      // Filter out known player/image noise to prevent excessive console clutter
      const messageStr = message?.toString() || '';
      const errorStr = error?.toString() || '';
      if (
        messageStr.includes('media is not ready') || 
        messageStr.includes('OptimizedImage') ||
        errorStr.includes('media is not ready') ||
        errorStr.includes('OptimizedImage')
      ) {
        return true; // Silent suppression
      }

      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error;

      console.error('[AG] Global Uncaught Error:', messageStr || 'No message', {
        source,
        lineno,
        colno,
        error: errorDetails
      });
      
      // NovaStream Stability: Prevent "Empty Object" logging by ensuring we capture the message
      if (!error && message === 'Script error.') {
        console.warn('[AG] External Script Error detected. This is usually cross-origin noise.');
      }
      
      // NovaStream Recovery Logic: Handle ChunkLoadError
      const isChunkError = 
        (message && message.toString().includes('ChunkLoadError')) || 
        (error && error.name === 'ChunkLoadError');
        
      if (isChunkError) {
        const hasReloaded = sessionStorage.getItem('ag_chunk_reload');
        if (!hasReloaded) {
          sessionStorage.setItem('ag_chunk_reload', 'true');
          console.log('[AG] ChunkLoadError detected. Attempting automatic recovery reload...');
          window.location.reload();
          return;
        }
      }

      const el = document.getElementById('ag-debug-log');
      if (el) el.innerHTML += `<div class="debug-err">ERR: ${message}</div>`;
    };

    window.onunhandledrejection = event => {
      // Filter out known player/image noise in promises
      const reasonStr = event.reason?.toString() || '';
      if (
        reasonStr.includes('media is not ready') || 
        reasonStr.includes('OptimizedImage')
      ) {
        event.preventDefault();
        return;
      }

      console.error('[AG] Global Unhandled Rejection:', event.reason);
      
      // NovaStream Recovery Logic: Handle ChunkLoadError in promises
      if (reasonStr.includes('ChunkLoadError')) {
        const hasReloaded = sessionStorage.getItem('ag_chunk_reload');
        if (!hasReloaded) {
          sessionStorage.setItem('ag_chunk_reload', 'true');
          console.log('[AG] Promise ChunkLoadError detected. Attempting recovery reload...');
          window.location.reload();
          return;
        }
      }

      const el = document.getElementById('ag-debug-log');
      if (el) el.innerHTML += `<div class="debug-rej">REJ: ${event.reason}</div>`;
    };

    // Keyboard listener for 'D' key to toggle debug overlay
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const activeElement = document.activeElement;
      const isTyping =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable;
      if (isTyping) return;

      if (e.key.toLowerCase() === 'd') {
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // NovaStream In-App Browser Listener
    if (window.electron?.ipcRenderer) {
      const handleOpenExternal = (_event: any, data: { url: string; title?: string }) => {
        console.log('🌐 [AG] Opening In-App Browser:', data.url);
        useUIStore.getState().openBrowserModal(data.url, data.title);
      };

      window.electron.ipcRenderer?.on?.('OPEN_EXTERNAL_LINK', handleOpenExternal);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.electron?.ipcRenderer?.off?.('OPEN_EXTERNAL_LINK', handleOpenExternal);
      };
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfileId, deleteProfile, profiles, setHasCompletedOnboarding]);

  // Safe "process" check
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Active TMDB & Google Ping
  useEffect(() => {
    if (!showDebug) return;

    const ping = async () => {
      const el = document.getElementById('ag-debug-log');
      if (!el) return;

      el.innerHTML += `<div class="debug-meta">--- DIAGNOSTIC ---</div>`;
      el.innerHTML += `<div>Date: ${new Date().toLocaleTimeString()}</div>`;

      // 1. Google Ping (Internet Check)
      try {
        const start = Date.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
        el.innerHTML += `<div class="debug-ok">NET: INTERNET OK (${Date.now() - start}ms)</div>`;
      } catch {
        el.innerHTML += `<div class="debug-err">NET: NO INTERNET</div>`;
      }

      // 2. TMDB Ping (Image Check)
      try {
        const start = Date.now();
        // Fetch a small known image via proxy
        const testUrl = getOptimizedImageUrl('qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'ambiance');
        await fetch(testUrl, { mode: 'no-cors' });
        el.innerHTML += `<div class="debug-ok">TMDB PROXY: REACHABLE (${Date.now() - start}ms)</div>`;
      } catch {
        el.innerHTML += `<div class="debug-err">TMDB PROXY: BLOCKED/UNREACHABLE</div>`;
      }
    };

    setTimeout(ping, 500);
  }, [showDebug]);

  if (!showDebug) return null;

  return (
    <div id="ag-debug-log" className="debug-overlay">
      <div className="debug-header">
        DEBUG OVERLAY v3 <span className="text-[10px] opacity-60">(Press D to hide)</span>
      </div>
      <div>API: {apiUrl}</div>
      <div id="log-container"></div>
    </div>
  );
}
