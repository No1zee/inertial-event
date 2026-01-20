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
    type?: 'movie' | 'tv';
    season?: string;
    episode?: string;
    seasons?: any[];
    onSeasonChange?: (s: number) => void;
    onEpisodeChange?: (e: string) => void;
    contentData?: Content | null;
}

const WebviewPlayer = forwardRef<WebviewPlayerRef, WebviewPlayerProps>(({
    src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate,
    type = 'movie', season = '1', episode = '1', seasons = [], onSeasonChange, onEpisodeChange,
    contentData
}, ref) => {
    const webviewRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
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
        isSeeking: boolean;
        seekValue: number;
        tracks: { label: string; language: string; active: boolean }[];
        audioTracks: { label: string; language: string; active: boolean }[];
        qualities: { label: string; height: number; active: boolean }[];
        providerType: string;
        skipParams?: { type: 'intro' | 'credits'; to: number } | null;
    }

    const [playerState, setPlayerState] = useState<PlayerState>({
        currentTime: 0,
        duration: 0,
        volume: initialVolume,
        isMuted: false,
        isPaused: false,
        isSeeking: false,
        seekValue: 0,
        tracks: [],
        audioTracks: [],
        qualities: [],
        providerType: 'Native'
    });

    const safeExecute = (script: string, userGesture = false) => {
        if (!isReadyRef.current || !webviewRef.current) return;
        try {
            // @ts-ignore
            webviewRef.current.executeJavaScript(script, userGesture).catch((e: any) => {
                if (e.message && e.message.includes('GUEST_VIEW_MANAGER_CALL')) return;
                console.warn("[AG] Webview Exec Error:", e.message);
            });
        } catch (e) { }
    };

    useImperativeHandle(ref, () => ({
        seek: (time) => safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${time})`),
        setVolume: (vol) => safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${vol})`),
        togglePlay: () => safeExecute(`window.AG_CMD_TOGGLE && window.AG_CMD_TOGGLE()`),
        setTrack: (idx) => safeExecute(`window.AG_CMD_TRACK && window.AG_CMD_TRACK(${idx})`),
        setAudioTrack: (idx) => safeExecute(`window.AG_CMD_AUDIO_TRACK && window.AG_CMD_AUDIO_TRACK(${idx})`),
        setQuality: (idx) => safeExecute(`window.AG_CMD_QUALITY && window.AG_CMD_QUALITY(${idx})`),
        setSubtitleStyle: (style) => safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(style)})`),
        setPlaybackSpeed: (speed) => safeExecute(`window.AG_CMD_SPEED && window.AG_CMD_SPEED(${speed})`),
        togglePiP: () => safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true)
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
        safeExecute(`window.AG_CMD_TOGGLE && window.AG_CMD_TOGGLE()`);
        // Optimistic update
        setPlayerState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setPlayerState(prev => ({ ...prev, isSeeking: true, seekValue: val }));
    };

    const handleSeekCommit = () => {
        safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${playerState.seekValue})`);
        setTimeout(() => setPlayerState(prev => ({ ...prev, isSeeking: false })), 500);
    };

    const handleVolumeChange = (vol: number) => {
        safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${vol})`);
        setPlayerState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }));
        settings.setVolume(vol); // Persist
    };

    const handleToggleMute = () => {
        const newMuted = !playerState.isMuted;
        const newVol = newMuted ? 0 : (playerState.volume || 1);
        safeExecute(`window.AG_CMD_VOL && window.AG_CMD_VOL(${newVol})`);
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
                    safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${Math.max(0, playerState.currentTime - 10)})`);
                    break;
                case 'l':
                case 'arrowright':
                    e.preventDefault();
                    safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${playerState.currentTime + 10})`);
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
            safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
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
            // Delay loading dismissal to hide "Fetching data..." text from providers
            // We wait for the first State Update with valid duration instead.
            // Safety timeout:
            setTimeout(() => setIsLoading(false), 8000); 

            // Linger controls on startup
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 5000);

            const script = `
                    (function() {
                    const AG_VERSION = 8; 
                    // console.log("💉 AG Script Injected & Started (v" + AG_VERSION + ")");

                    // PREFERENCES
                    const PREFS = {
                        quality: '${settings.quality}',
                        audio: '${settings.audioLanguage}',
                        sub: '${settings.subtitleLanguage}',
                        subEnabled: ${settings.subtitleEnabled},
                        autoplay: ${settings.autoplay},
                        volume: ${initialVolume}
                    };
                    // console.log("⚙️ PREFS LOADED:", JSON.stringify(PREFS));

                    // Force volume to saved preference (Default to 100%)
                    const START_VOLUME = PREFS.volume;

                    if (window.AG_VERSION === AG_VERSION) return;
                    window.AG_INSTALLED = true;
                    window.AG_VERSION = AG_VERSION;
                    
                    if (window.AG_INTERVAL_ID) clearInterval(window.AG_INTERVAL_ID);


                    // AGGRESSIVE NATIVE OVERLAY HIDDEN & SHADOW DOM PIERCER
                    // We inject a global style sheet for maximum dominance
                    const css = \`
                        .jw-controls, .vjs-control-bar, .plyr__controls, .art-controls, .clappr-core, 
                        .ad-overlay, .ytp-chrome-bottom, .ytp-show-cards-title, .fp-ui, 
                        .shaka-controls-container, .vidstack-controls, 
                        .server-container, .servers-list, .host-select, .source-selection, .mirror-list, #server-list, .multi-server,
                        .vidsrc-controls, #player-controls, .vidlink-controls, .control-bar, #controls, .jw-display-icon-container, .jw-preview {
                            display: none !important;
                            visibility: hidden !important;
                            opacity: 0 !important;
                            pointer-events: none !important;
                        }
                    \`;
                    
                    const style = document.createElement('style');
                    style.textContent = css;
                    document.head.appendChild(style);

                    // Also aggressively hide inside shadow DOMs
                    const hideNativeControls = () => {
                         try {
                            // Apply to Shadow DOMs (Walker)
                            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
                            let node;
                            while(node = walker.nextNode()) {
                                // @ts-ignore
                                if (node.shadowRoot) {
                                    // @ts-ignore
                                    const sheet = new CSSStyleSheet();
                                    sheet.replaceSync(css);
                                    // @ts-ignore
                                    node.shadowRoot.adoptedStyleSheets = [...node.shadowRoot.adoptedStyleSheets, sheet];
                                }
                            }
                        } catch(e) {}
                    };

                    // Run periodically
                    setInterval(hideNativeControls, 1000);

                    // SEARCH FOR VIDEO (Recursive & Deep)
                    const findVideo = (root, depth = 0) => {
                        if (!root || depth > 4) return null; // Prevent infinite recursion
                        
                        // 1. Check current root
                        let v = root.querySelector('video');
                        if (v) return { v, context: root.defaultView || window };

                        // 2. Check Shadow DOM
                        if (root.createTreeWalker) {
                            const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
                            let n; 
                            while(n = w.nextNode()) {
                                if(n.shadowRoot) { 
                                    const res = findVideo(n.shadowRoot, depth + 1); 
                                    if(res) return res; 
                                } 
                            }
                        }

                        // 3. Check IFrames (Must have access)
                        const fs = root.querySelectorAll('iframe');
                        for(let f of fs) { 
                            try { 
                                let d = f.contentDocument || f.contentWindow?.document; 
                                if(d) { 
                                    const res = findVideo(d, depth + 1); 
                                    if(res) return res; 
                                } 
                            } catch(e) {
                                // Cross-origin: can't access
                            } 
                        }
                        return null;
                    };

                    // MUTATION OBSERVER (For late loaders)
                    const observer = new MutationObserver(() => {
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            const found = findVideo(document);
                            if (found) {
                                // Re-run update immediately if found
                                updateState();
                            }
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });

                    // --- ENGINE ---
                    window.AG_VIDEO = null;
                    window.AG_CTX = null; // Store the context (window) of the player
                    window.AG_APPLIED_PREFS = false;
                    window.AG_HAS_NUDGED = false;

                    const checkProviders = (v, ctx) => {
                        const win = ctx || window;
                        
                        // 1. Check for HLS.js attached to specific props
                        if (v._hls) return { type: 'hls', instance: v._hls };
                        
                        // 2. Check for global JWPlayer in context
                        if (win.jwplayer && win.jwplayer().getState) return { type: 'jw', instance: win.jwplayer() };
                        
                        // 3. Global HLS in context
                        if (win.hls && win.hls.audioTracks) return { type: 'hls', instance: win.hls };
                        
                        // 4. VideoJS
                        // @ts-ignore
                        if (v.player && v.player.tech_ && v.player.tech_.hls) return { type: 'hls', instance: v.player.tech_.hls };
                        
                        // 5. Clappr
                        if (win.player && win.player.core && win.player.core.getCurrentPlayback) {
                             const pb = win.player.core.getCurrentPlayback();
                             if (pb._hls) return { type: 'hls', instance: pb._hls };
                        }
                        
                        // 6. Plyr
                        if (win.Plyr && v.plyr) return { type: 'plyr', instance: v.plyr };
                        
                        // 7. ArtPlayer
                        if (win.Artplayer && win.Artplayer.instances.length > 0) return { type: 'art', instance: win.Artplayer.instances[0] };
                        
                        return null;
                    };

                    const applyPreferences = (s) => {
                        if (window.AG_APPLIED_PREFS) return;
                        // Avoid applying if data is empty
                        if (s.tracks.length === 0 && s.audioTracks.length === 0 && s.qualities.length === 0) return;
                        
                        console.log("⚡ APPLYING PREFERENCES...");
                        
                        // 1. Quality
                        if (PREFS.quality !== 'auto') {
                             const targetH = parseInt(PREFS.quality); // 1080, 720 etc
                             if (!isNaN(targetH) && s.qualities.length > 0) {
                                 // Find closest
                                 let bestIdx = -1;
                                 let minDiff = 9999;
                                 s.qualities.forEach((q, idx) => {
                                     if (q.height > 0) {
                                         const diff = Math.abs(q.height - targetH);
                                         if (diff < minDiff) { minDiff = diff; bestIdx = idx; }
                                     }
                                 });
                                 if (bestIdx !== -1) {
                                     // console.log("⚡ Auto-Quality:", s.qualities[bestIdx].label);
                                     window.AG_CMD_QUALITY(bestIdx); 
                                 }
                             }
                        }

                        // 2. Audio
                        if (s.audioTracks.length > 0) {
                            const match = s.audioTracks.findIndex(t => t.language.includes(PREFS.audio));
                            if (match !== -1) {
                                // console.log("⚡ Auto-Audio:", s.audioTracks[match].language);
                                window.AG_CMD_AUDIO_TRACK(match);
                            }
                        }

                        // 3. Subtitles
                        if (s.tracks.length > 0) {
                            if (PREFS.subEnabled) {
                                // Try to find matching lang
                                const match = s.tracks.findIndex(t => t.language.includes(PREFS.sub));
                                if (match !== -1) {
                                     // console.log("⚡ Auto-Sub:", s.tracks[match].language);
                                     window.AG_CMD_TRACK(match);
                                }
                            } else {
                                // Disable
                                // console.log("⚡ Auto-Sub: Disabled");
                                window.AG_CMD_TRACK(-1);
                            }
                        }
                        
                        window.AG_APPLIED_PREFS = true;
                    };

                    const updateState = () => {
                        // Find Video if missing
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            const found = findVideo(document);
                            if (found) {
                                window.AG_VIDEO = found.v;
                                window.AG_CTX = found.context;
                                
                                const v = window.AG_VIDEO;

                                // FORCE NUDGE: Quick pause/play to trigger native control timeout
                                // Trigger earlier (0.2s)
                                if (!window.AG_HAS_NUDGED && !v.paused && v.currentTime > 0.2) {
                                    window.AG_HAS_NUDGED = true;
                                    console.log("🤜 NUDGE: Force cycling playback to clear native overlays");
                                    v.pause();
                                    
                                    // Ensure volume is locked to 100 on nudge
                                    v.volume = START_VOLUME; 
                                    v.muted = false;

                                    setTimeout(() => {
                                        v.play(); 
                                        v.volume = START_VOLUME; // Set again just in case
                                        v.muted = false;
                                    }, 100);
                                }
                                
                                if (!v.hasAGListeners && v) {
                                    v.hasAGListeners = true;
                                    console.log('🎥 Video Attached');
                                    
                                    // AUTOPLAY & INITIAL VOLUME
                                    v.volume = START_VOLUME;
                                    v.muted = false; // Force unmute
                                    
                                    // Enforce volume on play events
                                    v.addEventListener('play', () => {
                                        v.volume = START_VOLUME;
                                        v.muted = false;
                                    });

                                    v.muted = false;
                                    
                                    // Robust Volume Enforcement (Fight native persist)
                                    let volChecks = 0;
                                    const volInterval = setInterval(() => {
                                        if (v.volume !== START_VOLUME && volChecks < 5) {
                                            console.log('🔊 Enforcing Volume:', START_VOLUME);
                                            v.volume = START_VOLUME;
                                            v.muted = false;
                                        }
                                        volChecks++;
                                        if (volChecks > 10) clearInterval(volInterval);
                                    }, 500);
                                    
                                    // PREF: Autoplay
                                    if (PREFS.autoplay) {
                                        const p = v.play();
                                        if(p) p.catch(() => { v.muted = true; v.play(); });
                                    } else {
                                        v.pause();
                                    }

                                    // EVENTS
                                    v.addEventListener('ended', () => {
                                        console.log('ANTIGRAVITY_ENDED');
                                    });
                                }
                                
                                // Detect Provider once attached
                                const prov = checkProviders(v, window.AG_CTX);
                                if (prov) {
                                    console.log('🔌 Provider Found:', prov.type);
                                    if (prov.type === 'hls') window.AG_HLS = prov.instance;
                                    if (prov.type === 'jw') window.AG_JW = prov.instance;
                                }
                            }
                        }
                        
                        // Retry finding video periodically
                        if (window.AG_VIDEO && !window.AG_VIDEO.isConnected) {
                            window.AG_VIDEO = null;
                            window.AG_CTX = null;
                        }
                        
                        const v = window.AG_VIDEO;
                        if (!v) return;

                        // Calculate effective volume (Native + Boost)
                        let currentVol = v.muted ? 0 : v.volume;
                        if (window.AG_GAIN && typeof window.AG_GAIN.gain.value === 'number') {
                             if (window.AG_GAIN.gain.value > 1) {
                                 currentVol = window.AG_GAIN.gain.value;
                             }
                        }

                        // Robust Duration Check
                        let duration = v.duration;
                        if (!Number.isFinite(duration)) duration = 0; // Handle Infinity/NaN

                        const s = {
                            currentTime: v.currentTime,
                            duration: duration,
                            volume: currentVol,
                            isPaused: v.paused,
                            tracks: [], audioTracks: [], qualities: [],
                            providerType: window.AG_HLS ? 'HLS' : (window.AG_JW ? 'JW' : (v._hls ? 'HLS_Attached' : 'Native'))
                        };
                        
                        // --- TRACKS MAPPING ---
                        
                        // 1. Subtitles (Standard + JW)
                        if (window.AG_JW) {
                             // JWPlayer Captions
                             const caps = window.AG_JW.getCaptionsList ? window.AG_JW.getCaptionsList() : [];
                             const currCap = window.AG_JW.getCurrentCaptions ? window.AG_JW.getCurrentCaptions() : -1;
                             s.tracks = caps.map((t, idx) => ({
                                 label: t.label || t.language || 'Sub ' + idx,
                                 language: t.language, // JW uses 'id' sometimes
                                 active: idx === currCap
                             }));
                        } else if (v.textTracks) {
                            // Standard HTML5
                            for(let i=0; i<v.textTracks.length; i++) {
                                const t = v.textTracks[i];
                                // Filter out metadata tracks if possible, mainly keep subtitles/captions
                                if (t.kind === 'subtitles' || t.kind === 'captions' || !t.kind) {
                                     s.tracks.push({ 
                                        label: t.label || t.language || 'Track ' + (i+1), 
                                        language: t.language, 
                                        active: t.mode === 'showing' 
                                    });
                                }
                            }
                        }

                        // 2. Audio Tracks
                        if (window.AG_JW) {
                            const audios = window.AG_JW.getAudioTracks ? window.AG_JW.getAudioTracks() : (window.AG_JW.getAudioTracks || []); 
                            if (typeof window.AG_JW.getAudioTracks === 'function') {
                                const list = window.AG_JW.getAudioTracks();
                                const curr = window.AG_JW.getCurrentAudioTrack();
                                s.audioTracks = list.map((t, idx) => ({
                                    label: t.label || t.language || t.name || 'Audio ' + idx,
                                    language: t.language || 'unk',
                                    active: idx === curr
                                }));
                            }
                        } else if (window.AG_HLS && window.AG_HLS.audioTracks) {
                             s.audioTracks = window.AG_HLS.audioTracks.map((t, idx) => ({
                                 label: t.name || t.lang || t.language || 'Audio ' + idx,
                                 language: t.lang || t.language || 'unk',
                                 active: idx === window.AG_HLS.audioTrack
                             }));
                        } else if (v.audioTracks) {
                            for(let i=0; i<v.audioTracks.length; i++) {
                                const t = v.audioTracks[i];
                                s.audioTracks.push({
                                    label: t.label || t.language || 'Audio ' + (i+1),
                                    language: t.language,
                                    active: t.enabled
                                });
                            }
                        }

                        // 3. Quality Levels
                        if (window.AG_JW && window.AG_JW.getQualityLevels) {
                            const q = window.AG_JW.getQualityLevels();
                            const curr = window.AG_JW.getCurrentQuality();
                            s.qualities = q.map((t, idx) => ({
                                label: t.label || t.height + 'p',
                                height: t.height || 0,
                                active: idx === curr
                            }));
                        } else if (window.AG_HLS && window.AG_HLS.levels) {
                             s.qualities = window.AG_HLS.levels.map((t, idx) => ({
                                 label: (t.height || 'Auto') + 'p',
                                 height: t.height,
                                 active: idx === window.AG_HLS.currentLevel 
                             }));
                             s.qualities.unshift({ label: 'Auto', height: 0, active: window.AG_HLS.autoLevelEnabled });
                        }

                        // Apply Preferences if enough data gathered (and provider found)
                        if (!window.AG_APPLIED_PREFS && (s.providerType !== 'Native')) {
                             applyPreferences(s);
                        }

                        // ENFORCE SUBTITLES (Aggressive Persistence)
                        if (window.AG_SUB_PREF === -1 && v.textTracks) {
                            for(let i=0; i<v.textTracks.length; i++) {
                                // Only suppress standard subtitles, not chapters
                                if (v.textTracks[i].kind !== 'chapters' && v.textTracks[i].kind !== 'metadata') {
                                    if (v.textTracks[i].mode !== 'disabled') {
                                        // console.log('🛡️ Suppressing Subtitle Track:', i);
                                        v.textTracks[i].mode = 'disabled';
                                    }
                                }
                            }
                        }

                        // --- CHAPTERS / SKIP ---
                        let skipParams = null;
                        
                        // 1. Native Chapters (TextTracks)
                        if (v.textTracks) {
                             for(let i=0; i<v.textTracks.length; i++) {
                                 const t = v.textTracks[i];
                                 if (t.kind === 'chapters' || t.label?.toLowerCase().includes('chapters')) {
                                     // Ensure it's active to read cues
                                     if (t.mode === 'disabled') t.mode = 'hidden'; 
                                     
                                     if (t.cues && t.cues.length > 0) {
                                         for(let c=0; c<t.cues.length; c++) {
                                             const cue = t.cues[c];
                                             if (v.currentTime >= cue.startTime && v.currentTime < cue.endTime) {
                                                 const text = (cue.text || "").toLowerCase();
                                                 if (text.includes('intro') || text.includes('opening')) {
                                                     skipParams = { type: 'intro', to: cue.endTime };
                                                 } else if (text.includes('credit') || text.includes('ending') || text.includes('outro')) {
                                                     skipParams = { type: 'credits', to: cue.endTime };
                                                 }
                                                 break;
                                             }
                                         }
                                     }
                                 }
                             }
                        }

                        // 2. JWPlayer Chapters
                        if (!skipParams && window.AG_JW && window.AG_JW.getPlaylist) {
                            const item = window.AG_JW.getPlaylist()[window.AG_JW.getPlaylistIndex()];
                            if (item && item.tracks) {
                                const chapters = item.tracks.find(t => t.kind === 'chapters');
                                if (chapters && chapters.entries) {
                                    // Manually check entries since we don't have cues object
                                    // Usually need to fetch the VTT but sometimes it's pre-parsed.
                                    // JW often handles this internally, but we can try.
                                    // (Skipping complex VTT fetching for now, assuming native textTrack is populated by JW)
                                }
                            }
                        }
                        
                        s.skipParams = skipParams;

                        console.log('ANTIGRAVITY_UPDATE:' + JSON.stringify(s));
                    };

                    window.AG_INTERVAL_ID = setInterval(updateState, 1000);

                    // --- COMMANDS ---
                    window.AG_CMD_SEEK = (t) => { if(window.AG_VIDEO) window.AG_VIDEO.currentTime = t; };
                    
                    window.AG_CMD_VOL = (v) => { 
                        if(window.AG_VIDEO) {
                            // Standard Volume
                            if (v <= 1) {
                                window.AG_VIDEO.volume = v;
                                if (window.AG_GAIN) window.AG_GAIN.gain.value = 1; // Reset boost
                            } 
                            // Boost Mode (Web Audio API)
                            else {
                                window.AG_VIDEO.volume = 1; // Max out native
                                
                                try {
                                    if (!window.AG_AUDIO_CTX) {
                                        const win = window.AG_CTX || window; 
                                        const AudioContext = win.AudioContext || win.webkitAudioContext;
                                        window.AG_AUDIO_CTX = new AudioContext();
                                        window.AG_src = window.AG_AUDIO_CTX.createMediaElementSource(window.AG_VIDEO);
                                        window.AG_GAIN = window.AG_AUDIO_CTX.createGain();
                                        window.AG_src.connect(window.AG_GAIN);
                                        window.AG_GAIN.connect(window.AG_AUDIO_CTX.destination);
                                        console.log('🔊 Audio Boost Initialized in context:', win === window ? 'Top' : 'Iframe');
                                    }
                                    if (window.AG_GAIN && window.AG_AUDIO_CTX) {
                                        if (window.AG_AUDIO_CTX.state === 'suspended') window.AG_AUDIO_CTX.resume();
                                        window.AG_GAIN.gain.value = v; 
                                        console.log('🚀 Boost:', v);
                                    }
                                } catch(e) {
                                    console.error('Audio Boost Error:', e);
                                }
                            }
                            window.AG_VIDEO.muted = v === 0; 
                        } 
                    };
                    
                    window.AG_CMD_TOGGLE = () => { if(window.AG_VIDEO) { if(window.AG_VIDEO.paused) window.AG_VIDEO.play(); else window.AG_VIDEO.pause(); } };
                    
                    // NEW: Track Commands
                    window.AG_CMD_TRACK = (idx) => {
                        console.log('📝 CMD_TRACK:', idx);
                        window.AG_SUB_PREF = idx; // Store preference

                        // Subtitles
                        if (window.AG_JW) {
                            window.AG_JW.setCurrentCaptions(idx);
                        } else {
                            // Native / HLS
                            if (window.AG_VIDEO && window.AG_VIDEO._hls) {
                                console.log('📝 Setting HLS subtitleTrack:', idx);
                                window.AG_VIDEO._hls.subtitleTrack = idx;
                            }
                            
                            if (window.AG_VIDEO && window.AG_VIDEO.textTracks) {
                                for(let i=0; i<window.AG_VIDEO.textTracks.length; i++) {
                                    window.AG_VIDEO.textTracks[i].mode = 'disabled';
                                }
                                if (idx >= 0 && window.AG_VIDEO.textTracks[idx]) {
                                    console.log('📝 Enabling Native Track:', idx);
                                    window.AG_VIDEO.textTracks[idx].mode = 'showing';
                                }
                            }
                        }
                    };

                    window.AG_CMD_AUDIO_TRACK = (idx) => {
                         // Audio
                         if (window.AG_JW) {
                             window.AG_JW.setCurrentAudioTrack(idx);
                         } else if (window.AG_HLS) {
                             window.AG_HLS.audioTrack = idx;
                         } else if (window.AG_VIDEO && window.AG_VIDEO.audioTracks) {
                             for(let i=0; i<window.AG_VIDEO.audioTracks.length; i++) {
                                 window.AG_VIDEO.audioTracks[i].enabled = (i === idx);
                             }
                         }
                    };

                    window.AG_CMD_QUALITY = (idx) => {
                         // Quality
                         if (window.AG_JW) {
                             window.AG_JW.setCurrentQuality(idx);
                         } else if (window.AG_HLS) {
                             // index -1 usually means Auto in UI list if shifted, but HLS uses -1 for auto
                             // If our UI list has Auto at 0, we need to map.
                             // Assuming UI passes literal index from the qualities array constructed above.
                             // If auto is present, it's usually the first item or handled specially.
                             // Let's assume idx maps to the levels array index directly, unless it's auto.
                             
                             // If we constructed: [Auto, 360p, 720p...]
                             // Then idx 0 = Auto.
                             if (idx === 0 && window.AG_HLS.autoLevelEnabled !== undefined) {
                                 window.AG_HLS.currentLevel = -1; // Auto
                             } else {
                                 // Offset by 1 if Auto is in list
                                 window.AG_HLS.currentLevel = idx - 1; 
                             }
                         }
                    };

                    window.AG_CMD_PIP = () => { if(window.AG_VIDEO) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else window.AG_VIDEO.requestPictureInPicture(); } };
                    
                    // --- BLOCKING ---
                    window.open = function() { return null; };
                    window.onbeforeunload = null; 
                    
                    // Kill popups (MutationObserver - CPU Efficient)
                    const cleanAds = () => {
                        const selectors = ['[class*="popup"]', '[id*="popup"]', 'iframe[src*="ads"]', '.ad-box', '.advertisement'];
                        selectors.forEach(sel => {
                            const els = document.querySelectorAll(sel);
                            els.forEach(el => {
                                if (el && el.parentNode && el.tagName !== 'VIDEO' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
                                    try { el.remove(); } catch(e){}
                                }
                            });
                        });
                    };

                    // Initial cleanup
                    cleanAds();

                    // Observer
                    if (window.MutationObserver) {
                        const observer = new MutationObserver((mutations) => {
                            // Debounce or just run? Run is fine if fast.
                            let shouldScan = false;
                            for(const m of mutations) {
                                if (m.addedNodes.length > 0) { shouldScan = true; break; }
                            }
                            if (shouldScan) requestAnimationFrame(cleanAds);
                        });
                        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
                    } else {
                         // Fallback for very old environments (unlikely in Electron)
                         setInterval(cleanAds, 2000); // Much slower interval
                    }
                })();
            `;

            webview.executeJavaScript(script);
            isReadyRef.current = true;
            if (subtitleStyle) safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        };

        const onConsole = (e: any) => {
            const msg = e.message;
            // Forward all logs for debugging "Shazam" issue
            // console.log('[WebView]:', msg); // Too noisy

            if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                try {
                    const data = JSON.parse(msg.substring(19));
                    if (!data) return;

                    // Release Loading Screen when we have signal
                    if (data.duration > 0 || data.currentTime > 0) {
                        setIsLoading(false);
                    }

                    setPlayerState(prev => ({
                        ...prev,
                        currentTime: data.currentTime || 0,
                        duration: data.duration || 0,
                        isPaused: data.isPaused,
                        volume: data.volume,
                        isMuted: data.volume === 0,
                        tracks: data.tracks || [],
                        audioTracks: data.audioTracks || [],
                        qualities: data.qualities || []
                    }));
                    callbacksRef.current.onStateUpdate?.(data);
                } catch (e) { }
            } else if (msg === 'ANTIGRAVITY_ENDED') {
                callbacksRef.current.onEnded?.();
                // Autoplay Next
                if (settings.autoplay) {
                    console.log("Autoplay triggering...");
                    handleNextEpisode();
                }
            } else {
                console.log('[WebView]:', msg);
            }
        };

        const onDomReady = () => {
             // STEALTH MODE: Cloak the webview
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
                } catch(e) {}
            `;
            webview.executeJavaScript(stealthScript).catch(() => {});

             // Inject CSS safely (prev loop crash)
             const css = `
                .ad, .ads, .popup, [class*="ad-"], [id*="ad-"], iframe[src*="ads"] { display: none !important; }
                video::-webkit-media-controls { display: none !important; }
                .jw-controls, .vjs-control-bar, .plyr__controls, .art-controls, .clappr-core { display: none !important; }
             `;
             webview.insertCSS(css).catch(() => {});
             onDidFinishLoad();
        };

        const onDidFinishLoadEvent = () => onDidFinishLoad();

        webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
        // webview.addEventListener('did-start-loading', onDidStartLoading); // Removed to prevent crash
        webview.addEventListener('dom-ready', onDomReady);
        webview.addEventListener('console-message', onConsole);

        // Prevent main process new-window (Fix for crash)
        // @ts-ignore
        webview.addEventListener('new-window', (e: any) => {
            console.log('[Webview] Blocked popup:', e.url);
            e.preventDefault();
        });

        return () => {
            isReadyRef.current = false;
            webview.removeEventListener('did-finish-load', onDidFinishLoadEvent);
            // webview.removeEventListener('did-start-loading', onDidStartLoading);
            webview.removeEventListener('dom-ready', onDomReady);
            webview.removeEventListener('console-message', onConsole);
        };
    }, [src, initialVolume]);

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
                autoplay="true"
                // @ts-ignore
                disablewebsecurity="true"
                webpreferences="contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required"
                // @ts-ignore
                partition="persist:youtube-player"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            />

            {/* Interaction Layer - Intercepts clicks to prevent native controls/ads from activating */}
            <div
                className="absolute inset-0 z-[50]"
                onClick={handleTogglePlay}
                onDoubleClick={handleToggleFullscreen}
            />

            <PlayerControls
                show={showControls || playerState.isPaused || isLoading}
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
                isSeeking={playerState.isSeeking}
                seekValue={playerState.seekValue}
                type={type}
                season={season}
                episode={episode}
                seasons={seasons}
                onSeasonChange={onSeasonChange}
                onEpisodeChange={onEpisodeChange}
                onNext={handleNextEpisode}
                onPrev={handlePrevEpisode}
                onTogglePlay={handleTogglePlay}
                onSeekChange={handleSeekChange}
                onSeekCommit={handleSeekCommit}
                onVolumeChange={handleVolumeChange}
                onToggleMute={handleToggleMute}
                onToggleLibrary={handleToggleLibrary}
                onDownload={() => { }}
                onToggleSettings={() => setShowSettings(!showSettings)}
                onTogglePiP={() => safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true)}
                onToggleCast={handleToggleCast}
                onToggleFullscreen={handleToggleFullscreen}
                skipParams={playerState.skipParams}
                onSkip={(t) => safeExecute(`window.AG_CMD_SEEK && window.AG_CMD_SEEK(${t})`)}
            />

            <SettingsOverlay
                show={showSettings}
                onClose={() => setShowSettings(false)}
                tracks={playerState.tracks}
                audioTracks={playerState.audioTracks}
                qualities={playerState.qualities}
                playbackSpeed={1} // Todo: sync speed
                onTrackChange={(idx) => safeExecute(`window.AG_CMD_TRACK && window.AG_CMD_TRACK(${idx})`)}
                onAudioTrackChange={(idx) => safeExecute(`window.AG_CMD_AUDIO_TRACK && window.AG_CMD_AUDIO_TRACK(${idx})`)}
                onQualityChange={(idx) => safeExecute(`window.AG_CMD_QUALITY && window.AG_CMD_QUALITY(${idx})`)}
                onSpeedChange={(speed) => safeExecute(`window.AG_CMD_SPEED && window.AG_CMD_SPEED(${speed})`)}
            />

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
