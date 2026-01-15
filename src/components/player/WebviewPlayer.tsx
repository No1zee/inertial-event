"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from "lucide-react";
import PlayerControls from './overlay/PlayerControls';
import SettingsOverlay from './overlay/SettingsOverlay';

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
}

const WebviewPlayer = forwardRef<WebviewPlayerRef, WebviewPlayerProps>(({
    src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate,
    type = 'movie', season = '1', episode = '1', seasons = [], onSeasonChange, onEpisodeChange
}, ref) => {
    const webviewRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isReadyRef = useRef(false);
    const callbacksRef = useRef({ onStateUpdate, onEnded, subtitleStyle });

    // --- Overlay State ---
    const [showControls, setShowControls] = useState(true); // Always start visible
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const [showSettings, setShowSettings] = useState(false);

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
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 5000); // 5s linger
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

    // Keep refs updated
    useEffect(() => {
        callbacksRef.current = { onStateUpdate, onEnded, subtitleStyle };
        if (isReadyRef.current && subtitleStyle) {
            safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        }
    }, [onStateUpdate, onEnded, subtitleStyle]);

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const onDidFinishLoad = () => {
            if (isReadyRef.current) return;
            setIsLoading(false);

            // Linger controls on startup
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 5000);

            const script = `
                (function() {
                    const AG_VERSION = 7; 
                    console.log("💉 AG Script Injected & Started (v" + AG_VERSION + ")");
                    const START_VOLUME = ${initialVolume};
                    
                    if (window.AG_VERSION === AG_VERSION) return;
                    window.AG_INSTALLED = true;
                    window.AG_VERSION = AG_VERSION;
                    
                    if (window.AG_INTERVAL_ID) clearInterval(window.AG_INTERVAL_ID);

                    // --- HELPERS ---
                    
                    // DEBUG PROBE
                    setTimeout(() => {
                        console.log("🕵️ STARTING PROBE...");
                        const globals = Object.keys(window).filter(k => 
                            k.includes('player') || k.includes('jw') || k.includes('hls') || k.includes('vid') || k.includes('media')
                        );
                        console.log("🕵️ GLOBALS:", globals);
                        
                        const v = document.querySelector('video');
                        if (v) {
                            console.log("🕵️ VIDEO PROPS:", Object.keys(v).filter(k => !k.startsWith('on') && !k.startsWith('webkit')));
                            console.log("🕵️ VIDEO SRC:", v.src);
                            console.log("🕵️ VIDEO TRACKS:", v.audioTracks ? v.audioTracks.length : 'N/A', v.textTracks ? v.textTracks.length : 'N/A');
                        } else {
                            console.log("🕵️ NO VIDEO ELEMENT FOUND IN MAIN FRAME");
                            // Check frames
                            const frames = document.querySelectorAll('iframe');
                            console.log("🕵️ IFRAMES FOUND:", frames.length);
                            frames.forEach((f, i) => console.log('🕵️ IFRAME ' + i + ':', f.src));
                        }
                    }, 5000);

                    const findVideo = (root, depth = 0) => {
                        if (!root) return null;
                        
                        // Check current root
                        let v = root.querySelector('video');
                        if (v) return { v, context: root.defaultView || window }; // Return video + window context

                        // Check Shadow DOM
                        if (root.createTreeWalker) {
                            const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
                            if (w) { 
                                let n; 
                                while(n = w.nextNode()) {
                                    if(n.shadowRoot) { 
                                        const res = findVideo(n.shadowRoot, depth + 1); 
                                        if(res) return res; 
                                    } 
                                } 
                            }
                        }

                        // Check IFrames (Must have access)
                        const fs = root.querySelectorAll('iframe');
                        for(let f of fs) { 
                            try { 
                                let d = f.contentDocument || f.contentWindow?.document; 
                                if(d) { 
                                    const res = findVideo(d, depth + 1); 
                                    if(res) return res; 
                                } 
                            } catch(e){} 
                        }
                        return null;
                    };

                    // --- ENGINE ---
                    window.AG_VIDEO = null;
                    window.AG_CTX = null; // Store the context (window) of the player

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

                    const updateState = () => {
                        // Find Video if missing
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            const found = findVideo(document);
                            if (found) {
                                window.AG_VIDEO = found.v;
                                window.AG_CTX = found.context;
                                
                                const v = window.AG_VIDEO;
                                if (!v.hasAGListeners && v) {
                                    v.hasAGListeners = true;
                                    console.log('🎥 Video Attached');
                                    
                                    // AUTOPLAY & INITIAL VOLUME
                                    v.volume = START_VOLUME;
                                    v.muted = false;
                                    const p = v.play();
                                    if(p) p.catch(() => { v.muted = true; v.play(); });
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

                        const s = {
                            currentTime: v.currentTime,
                            duration: v.duration,
                            volume: v.muted ? 0 : v.volume,
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
                                        const win = window.AG_CTX || window; // Use the video's window context
                                        const AudioContext = win.AudioContext || win.webkitAudioContext;
                                        window.AG_AUDIO_CTX = new AudioContext();
                                        window.AG_src = window.AG_AUDIO_CTX.createMediaElementSource(window.AG_VIDEO);
                                        window.AG_GAIN = window.AG_AUDIO_CTX.createGain();
                                        window.AG_src.connect(window.AG_GAIN);
                                        window.AG_GAIN.connect(window.AG_AUDIO_CTX.destination);
                                        console.log('🔊 Audio Boost Initialized in context:', win === window ? 'Top' : 'Iframe');
                                    }
                                    if (window.AG_GAIN && window.AG_AUDIO_CTX) {
                                        // Resume context if suspended (browser autoplay policy)
                                        if (window.AG_AUDIO_CTX.state === 'suspended') {
                                            window.AG_AUDIO_CTX.resume();
                                        }
                                        window.AG_GAIN.gain.value = v; // Apply boost (e.g., 2.5)
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
                        // Subtitles
                        if (window.AG_JW) {
                            window.AG_JW.setCurrentCaptions(idx);
                        } else {
                            // Native / HLS
                            // 1. Try HLS specific controller if attached
                            if (window.AG_VIDEO && window.AG_VIDEO._hls) {
                                console.log('📝 Setting HLS subtitleTrack:', idx);
                                window.AG_VIDEO._hls.subtitleTrack = idx;
                            }
                            
                            // 2. Fallback to Native TextTracks (Aggressive)
                            if (window.AG_VIDEO && window.AG_VIDEO.textTracks) {
                                for(let i=0; i<window.AG_VIDEO.textTracks.length; i++) {
                                    // Disable all first
                                    window.AG_VIDEO.textTracks[i].mode = 'disabled';
                                }
                                if (idx >= 0 && window.AG_VIDEO.textTracks[idx]) {
                                    console.log('📝 Enabling Native Track:', idx);
                                    window.AG_VIDEO.textTracks[idx].mode = 'showing';
                                } else {
                                    console.log('📝 All Native Tracks Disabled');
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
                    
                    const blockCss = \`
                        .ad, .ads, .popup, [class*="ad-"], [id*="ad-"], iframe[src*="ads"] { display: none !important; }
                        video::-webkit-media-controls { display: none !important; }
                    \`;
                    const styleEl = document.createElement('style');
                    styleEl.textContent = blockCss;
                    document.head.appendChild(styleEl);

                    // Kill popups
                    setInterval(() => {
                        const selectors = ['[class*="popup"]', '[id*="popup"]', 'iframe[src*="ads"]'];
                        selectors.forEach(sel => {
                            try {
                                document.querySelectorAll(sel).forEach(el => {
                                    if (el && el.parentNode && el.tagName !== 'VIDEO') {
                                        try { el.remove(); } catch(e){}
                                    }
                                });
                            } catch(e){}
                        });
                    }, 500);
                })();
            `;

            webview.executeJavaScript(script);
            isReadyRef.current = true;
            if (subtitleStyle) safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        };

        const onConsole = (e: any) => {
            const msg = e.message;
            // Forward all logs for debugging "Shazam" issue
            console.log('[WebView]:', msg);

            if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                try {
                    const data = JSON.parse(msg.substring(19));
                    if (!data) return;
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
            }
        };

        const onDomReady = () => onDidFinishLoad();
        const onDidFinishLoadEvent = () => onDidFinishLoad();

        webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
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
                className="w-full h-full border-0 transition-opacity duration-500 ease-in-out"
                style={{
                    width: '100vw',
                    height: '100vh',
                    background: '#000',
                    opacity: isLoading ? 0 : 1
                }}
                // @ts-ignore
                allowpopups="false"
                // @ts-ignore
                disablewebsecurity="true"
                webpreferences="contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            />

            {/* Interaction Layer - Intercepts clicks to prevent native controls/ads from activating */}
            <div
                className="absolute inset-0 z-10"
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
                isSaved={false} // Todo: connect to store
                downloadUrl={null}
                isSeeking={playerState.isSeeking}
                seekValue={playerState.seekValue}
                type={type}
                season={season}
                episode={episode}
                seasons={seasons}
                onSeasonChange={onSeasonChange}
                onEpisodeChange={onEpisodeChange}
                onTogglePlay={handleTogglePlay}
                onSeekChange={handleSeekChange}
                onSeekCommit={handleSeekCommit}
                onVolumeChange={handleVolumeChange}
                onToggleMute={handleToggleMute}
                onToggleLibrary={() => { }}
                onDownload={() => { }}
                onToggleSettings={() => setShowSettings(!showSettings)}
                onTogglePiP={() => safeExecute(`window.AG_CMD_PIP && window.AG_CMD_PIP()`, true)}
                onToggleFullscreen={handleToggleFullscreen}
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
        </div>
    );
});

WebviewPlayer.displayName = "WebviewPlayer";
export default WebviewPlayer;
