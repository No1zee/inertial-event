"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from "lucide-react";
import PlayerControls from './overlay/PlayerControls';
import SettingsOverlay from './overlay/SettingsOverlay';
import CastModal from './overlay/CastModal';
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useWatchlistStore } from "@/lib/store/watchlistStore";
import { Content } from "@/lib/types/content";

export interface WebviewPlayerRef {
    // !!! DO NOT MODIFY: Seek function is critical for player functionality !!!
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    togglePlay: () => void;
    setTrack: (index: number) => void;
    setAudioTrack: (index: number) => void;
    setQuality: (index: number) => void;
    setSubtitleStyle: (style: { fontSize?: number, bgOpacity?: number, color?: string }) => void;
    setPlaybackSpeed: (speed: number) => void;
    togglePiP: () => void;
}

interface WebviewPlayerProps {
    src: string;
    title?: string;
    isSaved?: boolean;
    initialVolume?: number;
    subtitleStyle?: { fontSize?: number; bgOpacity?: number; color?: string };
    onEnded?: () => void;
    onStateUpdate?: (state: any) => void;
    // Series Props
    type?: 'movie' | 'tv' | 'anime';
    season?: string;
    episode?: string;
    seasons?: any[];
    onSeasonChange?: (s: number) => void;
    onEpisodeChange?: (e: string) => void;
    contentData?: Content | null;
    episodeDetails?: any[];
}

const WebviewPlayer = forwardRef<WebviewPlayerRef, WebviewPlayerProps>(({
    src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate,
    type = 'movie', season = '1', episode = '1', seasons = [], onSeasonChange, onEpisodeChange,
    contentData, episodeDetails
}, ref) => {
    const webviewRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [preloadError, setPreloadError] = useState<string | null>(null);
    const isReadyRef = useRef(false);
    const callbacksRef = useRef({ onStateUpdate, onEnded, subtitleStyle });
    const settings = useSettingsStore();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();

    const isSaved = contentData ? isInWatchlist(String(contentData.id)) : false;

    const handleToggleLibrary = () => {
        if (!contentData) return;
        if (isSaved) {
            removeFromWatchlist(String(contentData.id));
        } else {
            addToWatchlist(contentData);
        }
    };

    // --- Overlay State ---
    const [showControls, setShowControls] = useState(true); // Always start visible
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const [showSettings, setShowSettings] = useState(false);
    
    // Casting State
    const [showCastModal, setShowCastModal] = useState(false);
    const [castDevices, setCastDevices] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [playerPreloadPath, setPlayerPreloadPath] = useState<string>("");
    const [showDebug, setShowDebug] = useState(false);

    // FORCE CONTROLS TOP-MOST: Prevent provider from ever overlapping
    const uiZIndex = "z-[9999]"; // Maximum safe z-index

    // Fetch Player Preload Path
    useEffect(() => {        
        if (typeof window !== 'undefined' && (window as any).electron) {
             const ipc = (window as any).electron.ipcRenderer;
             // Race v2 vs Timeout to prevent hanging (Increased to 10s)
             Promise.race([
                 ipc.invoke('get-player-preload-path-v2'),
                 new Promise(resolve => setTimeout(() => resolve("TIMEOUT"), 10000)) 
             ])
             .then((path: string) => {
                 if (path === "TIMEOUT") {
                     console.error('[AG] IPC Timeout: Preload path fetch took too long.');
                     setPreloadError("IPC Timeout (10s)");
                     setPlayerPreloadPath("");
                 } else {
                     console.log('[AG] Preload Path:', path);
                     setPlayerPreloadPath(path);
                 }
             })
             .catch(err => {
                 console.error('[AG] IPC Error:', err);
                 setPreloadError(err.message || "IPC Failure");
                 setPlayerPreloadPath("");
             });
        }
    }, []);

    const handleToggleCast = () => {
        if (!showCastModal) {
            setShowCastModal(true);
            setIsScanning(true);
            setCastDevices([]);
            // @ts-ignore
            window.electron?.ipcRenderer?.send('CAST_SCAN_START');
            
            // Listen for results
            // @ts-ignore
            const removeListener = window.electron?.ipcRenderer?.on('CAST_DEVICE_LIST', (devices: any) => {
                setCastDevices(devices);
            });
            // Store cleaner if needed, but we rely on unmount/close for now
        } else {
            handleCloseCast();
        }
    };

    const handleCloseCast = () => {
        setShowCastModal(false);
        setIsScanning(false);
        // @ts-ignore
        window.electron?.ipcRenderer?.send('CAST_SCAN_STOP');
        // We should ideally remove the listener, but our preload wrapper's 'on' returns a subscription we can't easily clear without ref
        // For now, stopping the scan on backend is enough.
    };

    const handleCastSelect = async (device: any) => {
        console.log("Casting to:", device);
        try {
            // Determine URL
            // If src is a local torrent stream (http://localhost:...), use it directly.
            // If src is a webview URL (embed), we might not be able to cast easily yet.
            // For now, we assume src is valid or we use a fallback if we can extract it.
            
            const metadata = {
                title: title || contentData?.title || 'Unknown Title',
                poster: contentData?.poster || '',
            };

            // @ts-ignore
            const result = await window.electron?.ipcRenderer?.invoke('CAST_PLAY', {
                deviceId: device.id,
                url: src, // Send the current source URL
                metadata
            });

            if (result.success) {
                // Determine what to do with local player?
                // Pause local player?
                // webviewRef.current?.executeJavaScript('if(document.querySelector("video")) document.querySelector("video").pause()');
                alert(`Casting to ${device.name}...`);
            } else {
                alert(`Failed to cast: ${result.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Cast failed');
        }
        handleCloseCast();
    };

    interface PlayerState {
        currentTime: number;
        duration: number;
        volume: number;
        isMuted: boolean;
        isPaused: boolean;

        tracks: { label: string; language: string; active: boolean }[];
        audioTracks: { label: string; language: string; active: boolean }[];
        qualities: { label: string; height: number; active: boolean }[];
        providerType: string;
        skipParams?: { type: 'intro' | 'credits'; to: number } | null;
        frameId?: string;
    }

    const [playerState, setPlayerState] = useState<PlayerState>({
        currentTime: 0,
        duration: 0,
        volume: initialVolume,
        isMuted: false,
        isPaused: false,

        tracks: [],
        audioTracks: [],
        qualities: [],
        providerType: 'Native'
    });

    const broadcast = (type: string, data: any = null) => {
        if (!webviewRef.current) return;
        if (!isReadyRef.current) console.warn('[AG] Broadcasting while not ready:', type);
        
        console.log(`[AG] 📡 Broadcasting: ${type}`, data);
        const script = `
            (function() {
                try {
                    const msg = { type: '${type}', data: ${JSON.stringify(data)} };
                    console.log('[AG Injected] Dispatching:', msg);
                    window.postMessage(msg, '*');
                    
                    // Recursive frame dispatch
                    const frames = document.querySelectorAll('iframe');
                    frames.forEach(f => {
                         try { f.contentWindow.postMessage(msg, '*'); } catch(e){}
                    });
                } catch(e) { console.error('[AG Injected] Error:', e); }
            })();
        `;
        // @ts-ignore
        webviewRef.current.executeJavaScript(script).catch((e) => console.error('[AG] Broadcast Exec Error:', e));
    };

    useImperativeHandle(ref, () => ({
        // !!! DO NOT MODIFY: Seek implementation is critical and must be preserved !!!
        seek: (time) => broadcast('AG_CMD_SEEK', time),
        setVolume: (vol) => broadcast('AG_CMD_VOL', vol),
        togglePlay: () => broadcast('AG_CMD_TOGGLE'),
        setTrack: (idx) => broadcast('AG_CMD_TRACK', idx),
        setAudioTrack: (idx) => broadcast('AG_CMD_AUDIO_TRACK', idx),
        setQuality: (idx) => broadcast('AG_CMD_QUALITY', idx),
        setSubtitleStyle: (style) => broadcast('AG_CMD_SUB_STYLE', style),
        setPlaybackSpeed: (speed) => broadcast('AG_CMD_SPEED', speed),
        togglePiP: () => broadcast('AG_CMD_PIP')
    }));

    // --- Overlay Handlers ---
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (!playerState.isPaused) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 8000); // 8s linger (Slower hide)
        }
    };

    const handleTogglePlay = () => {
        broadcast('AG_CMD_TOGGLE');
        // Optimistic update
        setPlayerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    };

    const handleSeek = (time: number) => {
        broadcast('AG_CMD_SEEK', time);
        // Optimistic update
        setPlayerState(prev => ({ ...prev, currentTime: time }));
    };

    const handleVolumeChange = (vol: number) => {
        broadcast('AG_CMD_VOL', vol);
        setPlayerState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }));
        settings.setVolume(vol); // Persist
    };

    const handleToggleMute = () => {
        const newMuted = !playerState.isMuted;
        const newVol = newMuted ? 0 : (playerState.volume || 1);
        broadcast('AG_CMD_VOL', newVol);
        setPlayerState(prev => ({ ...prev, isMuted: newMuted, volume: newVol }));
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => console.error("Fullscreen error:", e));
        } else {
            document.exitFullscreen().catch((e) => console.error("Exit Fullscreen error:", e));
        }
    };

    // --- NAVIGATION HANDLERS ---
    const handleNextEpisode = () => {
        if (!seasons || !onEpisodeChange) return;
        const currentS = parseInt(season);
        const currentE = parseInt(episode);
        
        const seasonData = seasons.find((s: any) => s.season_number === currentS);
        if (!seasonData) return;

        if (currentE < seasonData.episode_count) {
            onEpisodeChange((currentE + 1).toString());
        } else if (onSeasonChange) {
            // Next Season
            const nextS = seasons.find((s: any) => s.season_number === currentS + 1);
            if (nextS) {
                onSeasonChange(currentS + 1);
            }
        }
    };

    const handlePrevEpisode = () => {
        if (!onEpisodeChange) return;
        const currentE = parseInt(episode);
        const currentS = parseInt(season);

        if (currentE > 1) {
            onEpisodeChange((currentE - 1).toString());
        } else if (currentS > 1 && onSeasonChange) {
            onSeasonChange(currentS - 1);
        }
    };

    // Keyboard Shortcuts for Player
    useEffect(() => {
        const handlePlayerKeyDown = (e: KeyboardEvent) => {
            if (!isReadyRef.current) return;
            
            // Ignore if typing in an input
            const activeElement = document.activeElement;
            const isTyping = activeElement?.tagName === 'INPUT' || 
                             activeElement?.tagName === 'TEXTAREA' || 
                             (activeElement as HTMLElement)?.isContentEditable;
            if (isTyping) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    handleTogglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    handleToggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    handleToggleMute();
                    break;
                case 'j':
                case 'arrowleft':
                    e.preventDefault();
                    broadcast('AG_CMD_SEEK', Math.max(0, playerState.currentTime - 10));
                    break;
                case 'l':
                case 'arrowright':
                    e.preventDefault();
                    broadcast('AG_CMD_SEEK', playerState.currentTime + 10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    handleVolumeChange(Math.min(2, playerState.volume + 0.1));
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    handleVolumeChange(Math.max(0, playerState.volume - 0.1));
                    break;
            }
        };

        window.addEventListener('keydown', handlePlayerKeyDown);
        return () => window.removeEventListener('keydown', handlePlayerKeyDown);
    }, [isReadyRef.current, playerState.currentTime, playerState.volume]);

    // Keep refs updated
    useEffect(() => {
        callbacksRef.current = { onStateUpdate, onEnded, subtitleStyle };
        if (isReadyRef.current && subtitleStyle) {
            broadcast('AG_CMD_SUB_STYLE', subtitleStyle);
        }
    }, [onStateUpdate, onEnded, subtitleStyle]);

    // Auto-hide controls when playback starts
    useEffect(() => {
        if (!playerState.isPaused && !isLoading) {
            // Use the shared ref so mouse movements can cancel this timer
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000); 
        } else if (playerState.isPaused) {
            // Keep controls visible while paused
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
    }, [playerState.isPaused, isLoading]);

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;



        const onDidFinishLoad = () => {
            if (isReadyRef.current) return;
            isReadyRef.current = true;
            // Delay loading dismissal to hide "Fetching data..." text from providers
            setTimeout(() => setIsLoading(false), 2000); 

            // Linger controls on startup
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 5000);

            // Legacy Injection Removed - Using electron/player-preload.js
            isReadyRef.current = true;
            if (subtitleStyle) broadcast('AG_CMD_SUB_STYLE', subtitleStyle);
        };


        const onConsole = (e: any) => {
            const msg = e.message;
            // Forward all logs for debugging "Shazam" issue
            console.log('[WebView]:', msg); 

            if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                try {
                    const json = msg.substring(19);
                    const data = JSON.parse(json);
                    if (!data) return;
                    
                    // RICHARD (Richness Filter): Only update if this frame is "better" or same as current
                    const currentRichness = (playerState.qualities.length * 2) + (playerState.audioTracks?.length || 0);
                    const newRichness = ((data.qualities?.length || 0) * 2) + (data.audioTracks?.length || 0);

                    if (newRichness < currentRichness && playerState.providerType !== 'native' && data.currentTime > 0) {
                        return;
                    }

                    if (data.duration > 0 || data.currentTime > 0) {
                        setIsLoading(false);
                    }

                    setPlayerState(prev => ({
                        ...prev,
                        currentTime: data.currentTime,
                        duration: data.duration || 0,
                        isPaused: data.isPaused,
                        volume: data.volume,
                        isMuted: data.volume === 0,
                        tracks: data.tracks || [],
                        audioTracks: data.audioTracks || [],
                        qualities: data.qualities || [],
                        providerType: data.providerType,
                        frameId: data.frameId
                    }));
                    callbacksRef.current.onStateUpdate?.(data);
                } catch (e) { }
            } else if (msg === 'ANTIGRAVITY_ENDED') {
                callbacksRef.current.onEnded?.();
                if (settings.autoplay) handleNextEpisode();
            } else {
                // console.log('[WebView Diagnostic]:', msg);
            }
        };

        const onDomReady = () => {
             // STEALTH MODE: Cloak the webview (Electron only)
            const stealthScript = `
                try {
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                    if (navigator.plugins.length === 0) {
                        Object.defineProperty(navigator, 'plugins', { 
                            get: () => [
                                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                                { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
                                { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client Executable' }
                            ] 
                        });
                    }
                    if (!navigator.languages || navigator.languages.length === 0) {
                        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                    }

                    // AUTO-HIDE OVERLAY: Simulate double click at center to hide native controls
                    // AUTO-HIDE OVERLAY: Simulate double click at center to hide native controls
                    // Attempt multiple times as some players aren't ready at 1.5s
                    const hideUI = () => {
                        const centerX = window.innerWidth / 2;
                        const centerY = window.innerHeight / 2;
                        const clickEvent = (type) => new MouseEvent(type, {
                            view: window, bubbles: true, cancelable: true,
                            clientX: centerX, clientY: centerY
                        });
                        
                        const simulateClick = () => {
                            const el = document.elementFromPoint(centerX, centerY);
                            if (!el) return;
                            el.dispatchEvent(clickEvent('mousedown'));
                            el.dispatchEvent(clickEvent('mouseup'));
                            el.dispatchEvent(clickEvent('click'));
                        };

                        simulateClick();
                        setTimeout(simulateClick, 50);
                    };

                    setTimeout(hideUI, 1000);
                    setTimeout(hideUI, 2500);
                    setTimeout(hideUI, 4000);
                    console.log('[AG] Overlay Mask Click Sequence Scheduled');
                } catch(e) {}
            `;
            // @ts-ignore
            if (webview?.executeJavaScript) {
                webview.executeJavaScript(stealthScript).catch(() => {});
            }

             // Inject CSS safely
             const css = `
                .ad, .ads, .popup, [class*="ad-"], [id*="ad-"], iframe[src*="ads"] { display: none !important; pointer-events: none !important; opacity: 0 !important; }
                video::-webkit-media-controls { display: none !important; }
                
                /* Aggressive VJS / Native UI Hiding */
                .vjs-control-bar, .vjs-big-play-button, .vjs-loading-spinner, .vjs-error-display, .vjs-modal-dialog,
                .vjs-control, .vjs-button, .vjs-progress-control, .vjs-remaining-time, .vjs-poster,
                .jw-controls, .jw-display-container, .plyr__controls, .art-controls, .art-mask, .art-layers,
                .clappr-core, .liquid-controls, .player-controls, .controls-container, .overlay-container,
                .vidlink-controls, .vidsrc-controls, [class*="controls-wrapper"],
                .v-controls, .v-control, .v-play-btn, .v-progress-bar, .v-ui, .v-overlay, .v-bg, .v-middle-controls, .v-center-controls,
                [class*="vjs-"], [class*="Vjs"], [class*="player-ui"], [class*="video-ui"], [class*="playing-controls"],
                [class*="progress-bar"], [class*="timeline"], [class*="big-play"] { 
                   display: none !important; 
                   opacity: 0 !important;
                   pointer-events: none !important;
                   visibility: hidden !important;
                   z-index: -1000 !important;
                   background: transparent !important;
                }
                
                /* Hide logos and branding that might overlap */
                img[src*="logo"], .player-logo, [class*="branding"], .v-branding, [class*="watermark"] { display: none !important; }
                
                /* Force transparency on backgrounds that might cover our UI */
                div[class*="overlay"], div[class*="background"] { background: transparent !important; }
             `;
             // Inject CSS safely and recursively into IFRAMES
             const runCSS = () => {
                 const js = `
                    (function startMasking() {
                        const css = ${JSON.stringify(css)};
                        const inject = (win) => {
                            try {
                                const doc = win.document;
                                if (doc && !doc.getElementById('ag-mask-style')) {
                                    const style = doc.createElement('style');
                                    style.id = 'ag-mask-style';
                                    style.textContent = css;
                                    (doc.head || doc.documentElement).appendChild(style);
                                }
                                for (let i = 0; i < win.frames.length; i++) {
                                    inject(win.frames[i]);
                                }
                            } catch(e) {}
                        };
                        
                        // Run immediately and every 3s to catch dynamic UI
                        inject(window);
                        if (!window._agMaskInterval) {
                            window._agMaskInterval = setInterval(() => inject(window), 3000);
                        }
                    })();
                 `;
                 
                 if (webview?.executeJavaScript) {
                    webview.executeJavaScript(js).catch(() => {});
                 }
                 
                 // Also try native Electron injection for the top frame
                 if (webview?.insertCSS) {
                    webview.insertCSS(css).catch(() => {});
                 }
             };

             runCSS();
             // Re-run after delay for dynamic players
             setTimeout(runCSS, 2000);
             setTimeout(runCSS, 5000);
             onDidFinishLoad();
        };

        const onDidFinishLoadEvent = () => onDidFinishLoad();

        // FAILSAFE: Force show video after 5s if events fail
        const loadFailsafe = setTimeout(() => {
             console.warn('[Webview] Failsafe: Forcing UI visible & enabling controls');
             setIsLoading(false);
             isReadyRef.current = true;
             onDidFinishLoadEvent();
        }, 5000);

        if (webview?.addEventListener) {
            webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
            webview.addEventListener('dom-ready', onDomReady);
            webview.addEventListener('console-message', onConsole);
            
            // IPC Listener for Preload Sync
            webview.addEventListener('ipc-message', (event: any) => {
                const { channel, args } = event;
                if (channel === 'AG_UPDATE') {
                    const data = args[0];
                    if (data) {
                        if (data.duration > 0 || data.currentTime > 0) setIsLoading(false);
                        
                        setPlayerState(prev => ({
                            ...prev,
                            currentTime: data.currentTime,
                            duration: data.duration || 0,
                            isPaused: data.isPaused,
                            volume: data.volume,
                            isMuted: data.isMuted,
                            // tracks: data.tracks || [], // TODO: mapping
                            // qualities: data.qualities || [],
                            providerType: data.providerType
                        }));
                        callbacksRef.current.onStateUpdate?.(data);
                    }
                } else if (channel === 'AG_ENDED') {
                    callbacksRef.current.onEnded?.();
                    if (settings.autoplay) handleNextEpisode();
                }
            });

            // Prevent main process new-window
            webview.addEventListener('new-window', (e: any) => {
                console.log('[Webview] Blocked popup:', e.url);
                e.preventDefault();
            });
        } else {
            // Browser Fallback: Just trigger load after 1s or via iframe onLoad
            setTimeout(onDidFinishLoad, 2000);
        }

        // Diagnosis: Broadcast the current source for StatsOverlay
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ag-player-source', { detail: src }));
        }

        return () => {
            clearTimeout(loadFailsafe);
            isReadyRef.current = false;
            // Clean up listeners
            if (webview?.removeEventListener) {
                try {
                    webview.removeEventListener('did-finish-load', onDidFinishLoadEvent);
                    webview.removeEventListener('dom-ready', onDomReady);
                    webview.removeEventListener('console-message', onConsole);
                } catch (e) { /* ignore */ }
            }
        };
    }, [src, initialVolume, playerPreloadPath]);

    useEffect(() => {
        // RESET STATE ON SOURCE CHANGE (Critical for Richness Filter)
        setPlayerState({
            currentTime: 0,
            duration: 0,
            volume: initialVolume,
            isMuted: false,
            isPaused: false,

            tracks: [],
            audioTracks: [],
            qualities: [],
            providerType: 'Native'
        });
        
        setIsLoading(true);
        setPreloadError(null);
        isReadyRef.current = false;

        // Safety Valve: Force loader to hide after 5s max (Per Source)
        const timer = setTimeout(() => {
            console.log('[AG] Loader Safety Valve Triggered (Source Timeout)');
            setIsLoading(false);
            isReadyRef.current = true;
        }, 5000); // 5s to allow slower streams

        return () => clearTimeout(timer);
    }, [src, initialVolume]);

    // Debug Loading State
    useEffect(() => {
        console.log('[AG] isLoading changed:', isLoading);
    }, [isLoading]);

    // @ts-ignore
    const isElectron = typeof window !== 'undefined' && !!window.electron;

    return (
        <div
            className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowControls(false)}
        >
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}

            {isElectron ? (
                /* @ts-ignore */
                playerPreloadPath ? (
                    <webview
                        ref={webviewRef}
                        src={src}
                        className="w-full h-full border-0 transition-opacity duration-500 ease-in-out z-[1] relative"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            background: '#000',
                            opacity: isLoading ? 0 : 1
                        }}
                        // @ts-ignore
                        allowpopups="false"
                        // @ts-ignore
                        autoPlay={true}
                        // @ts-ignore
                        disablewebsecurity="true"
                        // @ts-ignore
                        preload={playerPreloadPath}
                        webpreferences="contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required, nodeIntegrationInSubFrames=yes"
                        // @ts-ignore
                        partition="persist:youtube-player"
                        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    />
                ) : (
                    <div className="absolute inset-0 bg-black flex items-center justify-center flex-col gap-2">
                         {preloadError ? (
                             <>
                                <span className="text-red-500 text-xs font-mono">Core Initialization Failed</span>
                                <span className="text-zinc-600 text-[10px]">{preloadError}</span>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700"
                                >
                                    Reload App
                                </button>
                             </>
                         ) : (
                            <span className="text-zinc-500 text-sm animate-pulse font-medium tracking-widest uppercase">Initializing NovaSync...</span>
                         )}
                    </div>
                )
            ) : (
                <iframe
                    src={src}
                    className="w-full h-full border-0 z-[1] relative"
                    style={{
                        width: '100vw',
                        height: '100vh',
                        background: '#000',
                        opacity: isLoading ? 0 : 1
                    }}
                    allow="autoplay; encrypted-media; fullscreen"
                    onLoad={() => {
                        console.log('[Iframe] Content Loaded');
                        setIsLoading(false);
                    }}
                />
            )}

            {/* UI LAYER - Forced to stay top-most and capture interactions */}
            <div className={`absolute inset-0 pointer-events-none ${uiZIndex}`}>
                {/* Interaction Layer - Force focus capture for our UI */}
                {isElectron && (
                    <div
                        className="absolute inset-0 pointer-events-auto"
                        onClick={handleTogglePlay}
                        onDoubleClick={handleToggleFullscreen}
                    />
                )}

                <div className="pointer-events-auto">
                    <PlayerControls
                        show={(showControls || playerState.isPaused || isLoading || showSettings)}
                        hideBottom={!isElectron} 
                        // @ts-ignore
                        providerType={playerState.providerType}
                        tracks={playerState.tracks}
                        audioTracks={playerState.audioTracks}
                        qualities={playerState.qualities}
                        title={title || ""}
                        currentTime={playerState.currentTime}
                        duration={playerState.duration}
                        isPaused={playerState.isPaused}
                        volume={playerState.volume}
                        isMuted={playerState.isMuted}
                        isSaved={isSaved}
                        downloadUrl={null}
                        type={type}
                        season={season}
                        episode={episode}
                        seasons={seasons}
                        episodeDetails={episodeDetails}
                        onSeasonChange={onSeasonChange}
                        onEpisodeChange={onEpisodeChange}
                        onNext={handleNextEpisode}
                        onPrev={handlePrevEpisode}
                        onTogglePlay={handleTogglePlay}
                        onSeek={handleSeek}
                        onVolumeChange={handleVolumeChange}
                        onToggleMute={handleToggleMute}
                        onToggleLibrary={handleToggleLibrary}
                        onDownload={() => { }}
                        onToggleSettings={() => setShowSettings(!showSettings)}
                        onTogglePiP={() => broadcast('AG_CMD_PIP')}
                        onToggleCast={handleToggleCast}
                        onToggleFullscreen={handleToggleFullscreen}
                        skipParams={playerState.skipParams}
                        onSkip={(t) => broadcast('AG_CMD_SEEK', t)}
                    />
                </div>

                <div className="pointer-events-auto">
                    <SettingsOverlay
                        show={showSettings}
                        onClose={() => setShowSettings(false)}
                        tracks={playerState.tracks}
                        audioTracks={playerState.audioTracks}
                        qualities={playerState.qualities}
                        playbackSpeed={1} 
                        onTrackChange={(idx) => broadcast('AG_CMD_TRACK', idx)}
                        onAudioTrackChange={(idx) => broadcast('AG_CMD_AUDIO_TRACK', idx)}
                        onQualityChange={(idx) => {
                            console.log('[AG] Quality Change Requested:', idx);
                            broadcast('AG_CMD_QUALITY', idx);
                        }}
                        onSpeedChange={(speed) => {
                            console.log('[AG] Speed Change Requested:', speed);
                            broadcast('AG_CMD_SPEED', speed);
                        }}
                    />
                </div>

                {/* Diagnostics Overlay */}
                {showDebug && (
                    <div className="absolute top-20 right-4 bg-black/80 p-4 rounded-lg border border-red-500/50 text-[10px] font-mono text-green-400 pointer-events-none">
                        <div className="font-bold text-red-400 mb-1 underline">SHAZAM DIAGNOSTICS</div>
                        <div>Provider: {playerState.providerType}</div>
                        <div>Qualities: {playerState.qualities.length}</div>
                        <div>Audio: {playerState.audioTracks.length}</div>
                        <div>Subs: {playerState.tracks.length}</div>
                        <div className="mt-2 text-zinc-500 text-[8px]">Frame: {playerState.frameId || 'top'}</div>
                    </div>
                )}
            </div>

            <CastModal
                isOpen={showCastModal}
                onClose={handleCloseCast}
                devices={castDevices}
                isScanning={isScanning}
                onSelect={handleCastSelect}
            />

        </div>
    );
});

WebviewPlayer.displayName = "WebviewPlayer";
export default WebviewPlayer;
