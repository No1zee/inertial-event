"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from "lucide-react";

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
    initialVolume?: number;
    subtitleStyle?: { fontSize?: number; bgOpacity?: number; color?: string };
    onEnded?: () => void;
    onStateUpdate?: (state: any) => void;
}

const WebviewPlayer = forwardRef<WebviewPlayerRef, WebviewPlayerProps>(({ src, title, initialVolume = 1, subtitleStyle, onEnded, onStateUpdate }, ref) => {
    const webviewRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isReadyRef = useRef(false);
    const callbacksRef = useRef({ onStateUpdate, onEnded, subtitleStyle });

    const safeExecute = (script: string, userGesture = false) => {
        if (!isReadyRef.current || !webviewRef.current) return;
        try {
            // @ts-ignore
            webviewRef.current.executeJavaScript(script, userGesture).catch((e: any) => {
                // Ignore specific lifecycle errors
                if (e.message && e.message.includes('GUEST_VIEW_MANAGER_CALL')) return;
                console.warn("[AG] Webview Exec Error:", e.message);
            });
        } catch (e) { /* ignore sync errors */ }
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

    // Keep refs updated with latest props
    useEffect(() => {
        callbacksRef.current = { onStateUpdate, onEnded, subtitleStyle };
    }, [onStateUpdate, onEnded, subtitleStyle]);

    useEffect(() => {
        if (isReadyRef.current && subtitleStyle) {
            safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        }
    }, [subtitleStyle]);

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const onDidFinishLoad = () => {
            if (isReadyRef.current) return;
            setIsLoading(false);

            const script = `
                (function() {
                    const AG_VERSION = 5; // Bump this to force update
                    console.log("💉 AG Script Injected & Started (v" + AG_VERSION + ")");
                    const START_VOLUME = ${initialVolume};
                    
                    if (window.AG_VERSION === AG_VERSION) {
                         console.log("⚠️ AG Script v" + AG_VERSION + " already installed, skipping");
                         return;
                    }
                    window.AG_INSTALLED = true;
                    window.AG_VERSION = AG_VERSION;
                    
                    if (window.AG_INTERVAL_ID) clearInterval(window.AG_INTERVAL_ID);

                    // --- HELPERS ---
                    const getFiber = (n) => {
                        if (!n) return null;
                        const k = Object.keys(n).find(k => k.startsWith('__reactFiber$'));
                        return k ? n[k] : null;
                    };

                    const scanFiber = (f) => {
                        if(!f) return null;
                        let c = f;
                        let d = 0;
                        while(c && d < 25) {
                            const p = c.memoizedProps || c.pendingProps;
                            if (p && (p.sources || p.tracks || p.qualityLevels || p.audioTracks || p.playlist || (p.config && (p.config.sources || p.config.tracks)))) return p.config || p;
                            c = c.return; d++;
                        }
                        return null;
                    };

                    const findVideo = (root, depth = 0) => {
                        if (!root) return null;
                        let v = root.querySelector('video');
                        if (v) { console.log("🎥 Video Found at depth " + depth); return v; }
                        
                        // TreeWalker (Shadow DOM)
                        const w = root.createTreeWalker ? root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false) : null;
                        if (w) {
                            let n; while(n = w.nextNode()) if(n.shadowRoot) { v = findVideo(n.shadowRoot, depth + 1); if(v) return v; }
                        }
                        
                        // IFrames
                        const fs = root.querySelectorAll('iframe');
                        if (fs.length > 0 && depth < 2) console.log('🔍 Scanning ' + fs.length + ' iframes at depth ' + depth);
                        for(let f of fs) { 
                            try { 
                                let d = f.contentDocument || f.contentWindow?.document; 
                                if(d) { v = findVideo(d, depth + 1); if(v) return v; }
                            } catch(e){ console.log("⛔ Frame Access Blocked at depth " + depth); } 
                        }
                        return null;
                    };

                    const sanitizeAudio = (label, lang, idx, src) => {
                        const generic = ['SoundHandler', 'GPAC ISO Audio Handler', 'mp4a', 'iso2'];
                        
                        // If we have a good label, use it
                        if (label && !generic.some(g => label.includes(g))) return label;
                        
                        // Try to extract language from src URL patterns
                        let detectedLang = lang;
                        if (!detectedLang && src) {
                            const s = src.toLowerCase();
                            if (s.includes('/en/') || s.includes('_eng') || s.includes('-english')) detectedLang = 'en';
                            else if (s.includes('/es/') || s.includes('_esp') || s.includes('-spanish')) detectedLang = 'es';
                            else if (s.includes('/fr/') || s.includes('_fre') || s.includes('-french')) detectedLang = 'fr';
                            else if (s.includes('/de/') || s.includes('_ger') || s.includes('-german')) detectedLang = 'de';
                            else if (s.includes('/it/') || s.includes('_ita') || s.includes('-italian')) detectedLang = 'it';
                            else if (s.includes('/pt/') || s.includes('_por') || s.includes('-portuguese')) detectedLang = 'pt';
                            else if (s.includes('/ja/') || s.includes('_jpn') || s.includes('-japanese')) detectedLang = 'ja';
                            else if (s.includes('/ko/') || s.includes('_kor') || s.includes('-korean')) detectedLang = 'ko';
                            else if (s.includes('/zh/') || s.includes('_chi') || s.includes('-chinese')) detectedLang = 'zh';
                            else if (s.includes('/ru/') || s.includes('_rus') || s.includes('-russian')) detectedLang = 'ru';
                        }
                        
                        // Convert language code to display name
                        let displayName = detectedLang || 'Unknown';
                        if (detectedLang && detectedLang.length >= 2) {
                            try {
                                const intlName = new Intl.DisplayNames(['en'], { type: 'language' }).of(detectedLang);
                                if (intlName && intlName !== 'root' && intlName !== 'und') displayName = intlName;
                            } catch(e) {}
                        }
                        
                        return displayName.charAt(0).toUpperCase() + displayName.slice(1) + ' ' + (idx + 1);
                    };

                    // --- ENGINE ---
                    window.AG_VIDEO = null;
                    const updateState = () => {
                        if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
                            window.AG_VIDEO = findVideo(document);
                            if (window.AG_VIDEO) {
                                const v = window.AG_VIDEO;
                                if (!v.hasAGListeners) {
                                    v.hasAGListeners = true;
                                    console.log('🎥 Video Attached (v5): src=' + (v.currentSrc || v.src) + ', readyState=' + v.readyState + ', networkState=' + v.networkState);
                                    
                                    ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'error', 'ended'].forEach(evt => {
                                        v.addEventListener(evt, (e) => {
                                            let detail = "";
                                            if (evt === 'error' && v.error) detail = " Code: " + v.error.code + " Msg: " + v.error.message;
                                            console.log('🎬 Video Event (v5): ' + evt + detail);
                                        });
                                    });

                                    // Attempt muted autoplay first
                                    v.muted = true;
                                    v.volume = 0;
                                    v.autoplay = true;
                                    v.setAttribute('autoplay', 'true');
                                    
                                    const attemptPlay = () => {
                                        v.play().then(() => {
                                            console.log("▶️ Playback started (muted)");
                                        }).catch(e => {
                                            console.log("⚠️ Playback failed: " + e.message);
                                            // Aggressive retry on interactions
                                            const trigger = () => {
                                                v.play().then(() => {
                                                    console.log("▶️ Playback recovered on interaction");
                                                    window.removeEventListener('click', trigger);
                                                }).catch(() => {});
                                            };
                                            window.addEventListener('click', trigger, { once: true });
                                        });
                                    };
                                    
                                    if (v.readyState > 2) attemptPlay();
                                    else v.addEventListener('canplay', attemptPlay, { once: true });
                                }
                            }
                        }
                        // Retry finding video periodically if current one is invalid
                        if (window.AG_VIDEO && !window.AG_VIDEO.isConnected) window.AG_VIDEO = null;
                        
                        // Monitor Player State (JW / HLS)
                        const v = window.AG_VIDEO;
                        if (v) {
                            if (window.jwplayer) {
                                try {
                                    const state = window.jwplayer().getState();
                                    if (window.AG_LAST_JW_STATE !== state) {
                                        console.log("📺 JWPlayer State:", state);
                                        window.AG_LAST_JW_STATE = state;
                                    }
                                } catch(e) {}
                            }
                            if (v.paused && !v.ended && v.readyState > 2 && !v.dataset.manualPause) {
                                 v.play().catch(() => {});
                            }
                        }
                        if (!v) return;

                        const s = {
                            currentTime: v.currentTime,
                            duration: v.duration,
                            volume: v.muted ? 0 : v.volume,
                            isPaused: v.paused,
                            tracks: [], audioTracks: [], qualities: []
                        };

                        // Native
                        if(v.textTracks) for(let i=0; i<v.textTracks.length; i++) {
                            const t = v.textTracks[i];
                            s.tracks.push({ label: t.label || t.language || 'Track ' + (i+1), language: t.language, active: t.mode === 'showing' });
                        }
                        if(v.audioTracks) for(let i=0; i<v.audioTracks.length; i++) {
                            const t = v.audioTracks[i];
                            s.audioTracks.push({ label: sanitizeAudio(t.label, t.language, i, v.currentSrc || v.src), language: t.language, active: t.enabled });
                        }

                        // Player Wrappers (JW / HLS / Fiber)
                        const jw = window.jwplayer ? window.jwplayer() : null;
                        const hls = window.hls || window.Hls || v.__hls__;

                        if (jw) {
                            try {
                                if (s.tracks.length === 0 && jw.getCaptionsList) (jw.getCaptionsList() || []).forEach((c, i) => s.tracks.push({ label: c.label || c.name || 'Track ' + (i+1), active: i === jw.getCurrentCaptions() }));
                                if (s.audioTracks.length === 0 && jw.getAudioTracks) (jw.getAudioTracks() || []).forEach((a, i) => s.audioTracks.push({ label: sanitizeAudio(a.label, a.language, i, v.currentSrc || v.src), active: i === jw.getCurrentAudioTrack() }));
                                if (jw.getQualityLevels) (jw.getQualityLevels() || []).forEach((q, i) => s.qualities.push({ label: q.label, height: q.height, active: i === jw.getCurrentQuality() }));
                            } catch(e) { console.log('⚠️ JW Error:', e.message); }
                        }
                        if (hls && s.audioTracks.length === 0) hls.audioTracks.forEach((t, i) => s.audioTracks.push({ label: sanitizeAudio(t.name || t.label, t.lang, i, v.currentSrc || v.src), active: i === hls.audioTrack }));
                        
                        // Fiber Probe
                        if (s.audioTracks.length === 0 || s.qualities.length === 0) {
                            const p = scanFiber(getFiber(v) || getFiber(v.parentElement));
                            if (p) {
                                if (s.audioTracks.length === 0 && p.audioTracks) p.audioTracks.forEach((t, i) => s.audioTracks.push({ label: sanitizeAudio(t.label || t.name, t.language, i, v.currentSrc || v.src), active: t.active || t.enabled }));
                                if (s.qualities.length === 0 && p.qualityLevels) p.qualityLevels.forEach((q, i) => s.qualities.push({ label: q.label || q.name, height: q.height, active: q.active || i === p.currentQuality }));
                            }
                        }

                        console.log('ANTIGRAVITY_UPDATE:' + JSON.stringify(s));
                    };

                    window.AG_INTERVAL_ID = setInterval(updateState, 1000);

                    // --- COMMANDS ---
                    window.AG_CMD_SEEK = (t) => { 
                        console.log('🎯 AG_CMD_SEEK called with time:', t, 'AG_VIDEO exists:', !!window.AG_VIDEO);
                        if(window.AG_VIDEO) {
                            console.log('Current time before seek:', window.AG_VIDEO.currentTime);
                            window.AG_VIDEO.currentTime = t;
                            console.log('Current time after seek:', window.AG_VIDEO.currentTime);
                        } else {
                            console.error('❌ AG_VIDEO not found, cannot seek');
                        }
                    };
                    window.AG_CMD_VOL = (v) => { if(window.AG_VIDEO) { window.AG_VIDEO.volume = v; window.AG_VIDEO.muted = v === 0; } };
                    window.AG_CMD_TOGGLE = () => { if(window.AG_VIDEO) { if(window.AG_VIDEO.paused) window.AG_VIDEO.play(); else window.AG_VIDEO.pause(); } };
                    window.AG_CMD_SPEED = (s) => { if(window.AG_VIDEO) window.AG_VIDEO.playbackRate = s; };
                    window.AG_CMD_PIP = () => { if(window.AG_VIDEO) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else window.AG_VIDEO.requestPictureInPicture(); } };
                    window.AG_CMD_TRACK = (idx) => {
                        const v = window.AG_VIDEO; if(!v) return;
                        if(v.textTracks) for(let i=0; i<v.textTracks.length; i++) v.textTracks[i].mode = (i === idx) ? 'showing' : 'hidden';
                        if(window.jwplayer) try { window.jwplayer().setCurrentCaptions(idx); } catch(e){}
                    };
                    window.AG_CMD_AUDIO_TRACK = (idx) => {
                        const v = window.AG_VIDEO; if(!v) return;
                        if(v.audioTracks) for(let i=0; i<v.audioTracks.length; i++) v.audioTracks[i].enabled = (i === idx);
                        if(window.jwplayer) try { window.jwplayer().setCurrentAudioTrack(idx); } catch(e){}
                        const h = window.hls || window.Hls; if(h) h.audioTrack = idx;
                    };
                    window.AG_CMD_QUALITY = (idx) => {
                        if(window.jwplayer) try { window.jwplayer().setCurrentQuality(idx); } catch(e){}
                        const h = window.hls || window.Hls; if(h) h.currentLevel = idx;
                    };

                    window.AG_CMD_SUB_STYLE = (s) => {
                        const id = 'ag-sub-style';
                        const css = \`
                            video::cue, video::-webkit-media-text-track-display { 
                                font-size: \${s.fontSize || 18}px !important; 
                                background-color: rgba(0,0,0,\${s.bgOpacity ?? 0.5}) !important; 
                                color: \${s.color || '#fff'} !important; 
                            }
                            [class*="subtitle"], [class*="caption"] { font-size: \${s.fontSize || 18}px !important; color: \${s.color || '#fff'} !important; }
                        \`;
                        const inject = (root) => {
                            if(!root) return;
                            try {
                                let el = root.getElementById(id);
                                if(!el) { el = document.createElement('style'); el.id = id; (root.head || root.body || root).appendChild(el); }
                                el.textContent = css;
                            } catch(e){}
                            root.querySelectorAll?.('iframe').forEach(f => { try { inject(f.contentDocument || f.contentWindow?.document); } catch(e){} });
                            if(root.createTreeWalker) {
                                const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
                                let n; while(n = w.nextNode()) if(n.shadowRoot) inject(n.shadowRoot);
                            }
                        };
                        inject(document);
                    };

                    // 1. Softened popup blocking
                    // Instead of blocking everything, we'll let Electron's setWindowOpenHandler handle it
                    // window.alert = function() {}; // Keep alert blocked as it's rarely used legitimately in embeds
                    // window.confirm = function() { return false; };
                    window.onbeforeunload = null; 
                    
                    // 2. Comprehensive CSS blocking
                    const blockCss = \`
                        /* Native Controls */
                        video::-webkit-media-controls-panel,
                        video::-webkit-media-controls-play-button,
                        video::-webkit-media-controls-start-playback-button { 
                            display: none !important; 
                        }
                        
                        /* Ads & Popups & Overlays */
                        .ad, .ads, .advertisement, [class*="ad-"], [id*="ad-"],
                        .popup, [class*="popup"], [id*="popup"],
                        .modal, [class*="modal"], [id*="modal"],
                        .overlay, [class*="overlay"], [id*="overlay"],
                        [class*="watermark"], [id*="watermark"],
                        [class*="promo"], [id*="promo"],
                        [class*="banner"], [id*="banner"],
                        iframe[src*="google"], iframe[src*="ads"], iframe[src*="doubleclick"], iframe[src*="pop"],
                        #logo, .logo, [class*="logo"], [id*="logo"],
                        a[href*="chaturbate"], a[href*="faphouse"], a[href*="bet"], a[href*="casino"],
                        [class*="chat"], [id*="chat"],
                        [class*="register"], [id*="register"],
                        [class*="sign-up"], [id*="signup"],
                        [class*="browser"], [id*="browser"],
                        [class*="download"], [id*="download"],
                        #preloader, .preloader, [class*="loading-overlay"] {
                            display: none !important;
                            opacity: 0 !important;
                            visibility: hidden !important;
                            pointer-events: none !important;
                            width: 0 !important;
                            height: 0 !important;
                            position: absolute !important;
                            left: -9999px !important;
                            top: -9999px !important;
                            transform: scale(0) !important;
                        }
                        
                        /* Fix potential Z-index issues for video */
                        video {
                            z-index: 2147483647 !important;
                        }

                        /* Page Styling */
                        body, html { 
                            background: #000 !important; 
                            overflow: hidden !important; 
                        }
                        video { 
                            object-fit: contain !important; 
                            background: #000 !important; 
                        }
                    \`;
                    
                    const styleEl = document.createElement('style');
                    styleEl.id = 'ag-block-all';
                    styleEl.textContent = blockCss;
                    document.head.appendChild(styleEl);
                    
                    // 3. Continuously remove popup elements (DOM Observer)
                    const killPopups = () => {
                        const selectors = [
                            '[class*="popup"]', '[id*="popup"]',
                            '[class*="modal"]', '[id*="modal"]',
                            '[class*="overlay"]', '[id*="overlay"]',
                            '[class*="ad"]', '[id*="ad"]',
                            'iframe[src*="ads"]', 'iframe[src*="chat"]', 'iframe[src*="pop"]',
                            '[class*="banner"]', '[id*="banner"]',
                            '[class*="notice"]', '[id*="notice"]',
                            'a[target="_blank"]',
                            '[style*="z-index: 2147483647"]', // Often used by ads, but be careful with video
                            '[style*="position: fixed; top: 0; left: 0; width: 100%; height: 100%"]' // Full screen overlays
                        ];
                        selectors.forEach(sel => {
                            try {
                                document.querySelectorAll(sel).forEach(el => {
                                    if (el && el.parentNode && el !== document.body && el !== document.documentElement && el.tagName !== 'VIDEO') {
                                        // Specific check to not kill the video container if it uses these styles
                                        if (el.contains(window.AG_VIDEO)) return;
                                        el.remove();
                                    }
                                });
                            } catch(e) {}
                        });
                    };
                    
                    // Run frequently
                    setInterval(killPopups, 250);
                    killPopups();
                    
                    // 4. Click Blocking removed (Requested to scrap global popup)
                    /*
                    document.addEventListener('click', (e) => {
                        if (e.target.tagName !== 'VIDEO' && e.target.closest('video') === null) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        }
                    }, true);
                    */
                    
                    // 5. MutationObserver to kill popups as they're added
                    const observer = new MutationObserver(() => killPopups());
                    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
                })();
            `;

            webview.executeJavaScript(script);
            isReadyRef.current = true;
            if (subtitleStyle) safeExecute(`window.AG_CMD_SUB_STYLE && window.AG_CMD_SUB_STYLE(${JSON.stringify(subtitleStyle)})`);
        };

        const onConsole = (e: any) => {
            const msg = e.message;
            // Ignore benign ad-block errors
            if (msg.includes('Refused to execute script') && msg.includes('MIME type')) return;

            if (msg.startsWith('ANTIGRAVITY_UPDATE:')) {
                try {
                    const data = JSON.parse(msg.substring(19));
                    callbacksRef.current.onStateUpdate?.(data);
                } catch (e) { }
            } else if (msg === 'ANTIGRAVITY_ENDED') {
                callbacksRef.current.onEnded?.();
            } else {
                // Ignore security and ad-related noise
                if (msg.includes('Electron Security Warning')) return;
                if (msg.includes('Content-Security-Policy')) return;
                if (msg.includes('preloaded using link preload but not used')) return;
                if (msg.includes('yandex.ru')) return;
                if (msg.includes('google-analytics')) return;
                if (msg.includes('Failed to load resource')) return; // Generic noise
                if (msg.includes('The resource was requested using a link that was not recognized')) return;
                if (msg.includes('Autoplay is only allowed')) return;

                // Determine log level
                if (e.level === 2) console.warn('[Webview]', msg);
                else if (e.level === 3) console.error('[Webview]', msg);
                else console.log('[Webview]', msg);
            }
        };

        const onDomReady = () => {
            console.log('✅ Webview: dom-ready');
            onDidFinishLoad();
        };
        const onDidFinishLoadEvent = () => {
            console.log('✅ Webview: did-finish-load');
            onDidFinishLoad();
        };
        const onDidFailLoad = (e: any) => console.log('❌ Webview: did-fail-load', e.errorCode, e.errorDescription);
        const onCrashed = (e: any) => console.log('💥 Webview: crashed', e);

        webview.addEventListener('did-finish-load', onDidFinishLoadEvent);
        webview.addEventListener('dom-ready', onDomReady);
        webview.addEventListener('did-fail-load', onDidFailLoad);
        webview.addEventListener('crashed', onCrashed);
        webview.addEventListener('console-message', onConsole);

        return () => {
            isReadyRef.current = false;
            webview.removeEventListener('did-finish-load', onDidFinishLoadEvent);
            webview.removeEventListener('dom-ready', onDomReady);
            webview.removeEventListener('did-fail-load', onDidFailLoad);
            webview.removeEventListener('crashed', onCrashed);
            webview.removeEventListener('console-message', onConsole);
        };
    }, [src, initialVolume]); // Only re-run if src or volume changes (volume is usually static initially)

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}
            <webview
                ref={webviewRef}
                src={src}
                className="w-full h-full border-0"
                style={{ width: '100vw', height: '100vh', background: '#000' }}
                // @ts-ignore
                // @ts-ignore
                allowpopups="false"
                // @ts-ignore
                disablewebsecurity="true"
                webpreferences="contextIsolation=no, nodeIntegration=no, webSecurity=no, autoplayPolicy=no-user-gesture-required"
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            />
        </div>
    );
});

WebviewPlayer.displayName = "WebviewPlayer";
export default WebviewPlayer;
