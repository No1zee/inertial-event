'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RotateCcw, ExternalLink, Shield, Lock, Globe } from 'lucide-react';
import { useUIStore } from '@/lib/stores/uiStore';
import { cn } from '@/lib/utils';
import { PretextHeadline } from '@/components/Common/PretextHeadline';

export function ExternalBrowserModal() {
  const { browserModal, closeBrowserModal } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    if (browserModal.isOpen && browserModal.url) {
      setCurrentUrl(browserModal.url);
      setIsLoading(true);
    }
  }, [browserModal.isOpen, browserModal.url]);

  const handleBack = () => {
    if (webviewRef.current?.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (webviewRef.current?.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const handleRefresh = () => {
    webviewRef.current?.reload();
  };

  const handleOpenExternal = () => {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('OPEN_IN_SHELL', currentUrl);
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const updateState = () => {
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
      setCurrentUrl(webview.getURL());
    };

    const handleStartLoading = () => setIsLoading(true);
    const handleStopLoading = () => {
      setIsLoading(false);
      updateState();
    };
    const handleDomReady = () => {
      updateState();
    };

    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-navigate', updateState);
    webview.addEventListener('did-navigate-in-page', updateState);

    return () => {
      webview.removeEventListener('did-start-loading', handleStartLoading);
      webview.removeEventListener('did-stop-loading', handleStopLoading);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-navigate', updateState);
      webview.removeEventListener('did-navigate-in-page', updateState);
    };
  }, [browserModal.isOpen]);

  if (!browserModal.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full h-full max-w-6xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black"
        >
          {/* Browser Header */}
          <div className="h-16 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4 flex-1 mr-4">
              {/* Navigation Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    canGoBack ? "text-white hover:bg-white/10" : "text-white/20"
                  )}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleForward}
                  disabled={!canGoForward}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    canGoForward ? "text-white hover:bg-white/10" : "text-white/20"
                  )}
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleRefresh}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-all"
                >
                  <RotateCcw size={18} className={cn(isLoading && "animate-spin")} />
                </button>
              </div>

              {/* URL Bar */}
              <div className="flex-1 max-w-2xl bg-black/40 border border-white/5 rounded-2xl h-10 flex items-center px-4 gap-3 overflow-hidden group hover:border-white/20 transition-all">
                <Lock size={14} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-400 truncate select-all">{currentUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenExternal}
                title="Open in System Browser"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <ExternalLink size={18} />
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button
                onClick={closeBrowserModal}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500 transition-all group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Webview Area */}
          <div className="flex-1 relative bg-white">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <PretextHeadline 
                  text="SECURE SANDBOX ACTIVE" 
                  fontSize={8} 
                  fontWeight={900} 
                  letterSpacing="0.3em" 
                  className="text-primary uppercase"
                />
              </div>
            )}
            <webview
              ref={webviewRef}
              src={browserModal.url || ''}
              className="w-full h-full"
              style={{ background: 'white' }}
              // Hardened Security for external links
              webpreferences="contextIsolation=yes,sandbox=yes"
            />
          </div>

          {/* Security Footer */}
          <div className="h-10 bg-zinc-900/80 border-t border-white/5 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Protected View: Ads and Popups are strictly isolated
              </span>
            </div>
            <div className="flex items-center gap-4 text-zinc-500">
               <div className="flex items-center gap-1.5">
                  <Globe size={12} />
                  <span className="text-[10px] font-medium uppercase tracking-tight">Encrypted Session</span>
               </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
