const { ipcRenderer } = require('electron');

// --- PRELOAD SCRIPT FOR VIDEO PLAYER ---
// This script runs with privileges inside the <webview> and can bypass CSP for state extraction.

const AG_VERSION = 9;
console.log(`[NovaSync] Preload Injecting (v${AG_VERSION})...`);

// --- 1. GLOBAL STATE & UTILS ---
window.AG_VIDEO = null;
window.AG_CTX = null;
window.AG_APPLIED_PREFS = false;
window.AG_HAS_NUDGED = false;
window.AG_INSTALLED = true;
window.AG_VERSION = AG_VERSION;
window.AG_SUB_PREF = -1; // Default off

// --- 2. COMMANDS EXPORT (For WebviewPlayer.tsx executeJavaScript) ---
// We attach these to window so the host can still call them via legacy executeJavaScript if desired, 
// OR simpler IPC messages (which we can listen to here).

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
                }
                if (window.AG_GAIN && window.AG_AUDIO_CTX) {
                    if (window.AG_AUDIO_CTX.state === 'suspended') window.AG_AUDIO_CTX.resume();
                    window.AG_GAIN.gain.value = v; 
                }
            } catch(e) {
                console.error('Audio Boost Error:', e);
            }
        }
        window.AG_VIDEO.muted = v === 0; 
    } 
};

window.AG_CMD_TOGGLE = () => { if(window.AG_VIDEO) { if(window.AG_VIDEO.paused) window.AG_VIDEO.play(); else window.AG_VIDEO.pause(); } };

window.AG_CMD_TRACK = (idx) => {
    window.AG_SUB_PREF = idx;
    if (window.AG_JW) {
        window.AG_JW.setCurrentCaptions(idx + 1);
    } else {
        if (window.AG_VIDEO && window.AG_VIDEO._hls) window.AG_VIDEO._hls.subtitleTrack = idx;
        if (window.AG_VIDEO && window.AG_VIDEO.textTracks) {
            for(let i=0; i<window.AG_VIDEO.textTracks.length; i++) {
                window.AG_VIDEO.textTracks[i].mode = i === idx ? 'showing' : 'disabled';
            }
        }
    }
};

window.AG_CMD_AUDIO_TRACK = (idx) => {
     if (window.AG_JW) { window.AG_JW.setCurrentAudioTrack(idx); }
     else if (window.AG_HLS) { window.AG_HLS.audioTrack = idx; }
     else if (window.AG_VIDEO && window.AG_VIDEO.audioTracks) {
         for(let i=0; i<window.AG_VIDEO.audioTracks.length; i++) window.AG_VIDEO.audioTracks[i].enabled = (i === idx);
     }
};

window.AG_CMD_QUALITY = (idx) => {
     if (window.AG_JW) { window.AG_JW.setCurrentQuality(idx); }
     else if (window.AG_VJS && window.AG_VJS.qualityLevels) {
        const ql = window.AG_VJS.qualityLevels();
        if (idx === 0) { for(let i=0; i<ql.length; i++) ql[i].enabled = true; } 
        else { for(let i=0; i<ql.length; i++) ql[i].enabled = (i === idx - 1); }
     } else if (window.AG_HLS) {
         window.AG_HLS.currentLevel = idx === 0 ? -1 : idx - 1;
     }
};

window.AG_CMD_PIP = () => { if(window.AG_VIDEO) { if (document.pictureInPictureElement) document.exitPictureInPicture(); else window.AG_VIDEO.requestPictureInPicture(); } };

window.AG_CMD_SPEED = (s) => { if(window.AG_VIDEO) window.AG_VIDEO.playbackRate = s; };

// LISTENER: Handle messages from Host (WebviewPlayer.tsx -> broadcast)
// This supports the existing 'broadcast' mechanism if it uses postMessage,
// OR we can add an IPC listener for a cleaner approach.
window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.type) return;
    if (typeof window[msg.type] === 'function') {
        window[msg.type](msg.data);
    }
});

// --- 3. VIDEO DISCOVERY (SHAZAM) ---

const findVideo = (root, depth = 0) => {
    if (!root || depth > 5) return null;
    
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
        } catch(e) {} 
    }
    return null;
};

// Check for Providers (HLS.js, JWPlayer, etc.)
const checkProviders = (v, ctx) => {
    const win = ctx || window;
    
    if (win.jwplayer && typeof win.jwplayer === 'function') {
        try {
            const jw = win.jwplayer();
            if (jw && jw.getState) return { type: 'jw', instance: jw };
        } catch(e) {}
    }
    const vjs = win.videojs || v.player;
    if (vjs && typeof vjs === 'function' && vjs(v)) return { type: 'vjs', instance: vjs(v) };
    else if (v.player && v.player.qualityLevels) return { type: 'vjs', instance: v.player };
    
    if (v._hls) return { type: 'hls', instance: v._hls };
    if (win.hls && win.hls.levels) return { type: 'hls', instance: win.hls };
    if (v.player && v.player.tech_ && v.player.tech_.hls) return { type: 'hls', instance: v.player.tech_.hls };
    
    return null;
};

// --- 4. STATE UPDATE LOOP ---

const updateState = () => {
    // Find Video
    if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
        const found = findVideo(document);
        if (found) {
            window.AG_VIDEO = found.v;
            window.AG_CTX = found.context;
            
            const v = window.AG_VIDEO;
            // Setup listeners only once
            if (!v.hasAGListeners) {
                v.hasAGListeners = true;
                v.addEventListener('ended', () => ipcRenderer.sendToHost('AG_ENDED'));
                v.addEventListener('play', () => { v.muted = false; }); // Force unmute
            }
            
            const prov = checkProviders(v, window.AG_CTX);
            if (prov) {
                if (prov.type === 'hls') window.AG_HLS = prov.instance;
                if (prov.type === 'jw') window.AG_JW = prov.instance;
                if (prov.type === 'vjs') window.AG_VJS = prov.instance;
            }
        }
    }

    const v = window.AG_VIDEO;
    if (!v) return;

    // Build State Object
    const s = {
        currentTime: v.currentTime,
        duration: Number.isFinite(v.duration) ? v.duration : 0,
        volume: v.muted ? 0 : v.volume,
        isPaused: v.paused,
        isMuted: v.muted,
        tracks: [], audioTracks: [], qualities: [],
        providerType: window.AG_HLS ? 'HLS' : (window.AG_JW ? 'JW' : (v._hls ? 'HLS_Attached' : 'Native')),
        frameId: window.location.host
    };

    // ... (Extraction logic for tracks/qualities omitted for brevity, can be added if crucial)
    // For now, let's ensure basic time/duration works first.

    // Send to Host via IPC
    ipcRenderer.sendToHost('AG_UPDATE', s);
};

// Run loop
setInterval(updateState, 800);

// --- 5. AD BLOCKING & CSS INJECTION ---
// (Simplified version of the heavy script)

const css = `
    .ad, .ads, .popup, [class*="ad-"], [id*="ad-"], iframe[src*="ads"] { display: none !important; pointer-events: none !important; opacity: 0 !important; }
    .jw-controls, .vjs-control-bar, .plyr__controls { display: none !important; }
    div[class*="overlay"] { background: transparent !important; }
`;

const style = document.createElement('style');
style.textContent = css;
(document.head || document.documentElement).appendChild(style);

// Kill popups
window.open = function() { return null; };
const cleanAds = () => {
    const selectors = ['[class*="popup"]', 'iframe[src*="ads"]', '.ad-box'];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));
};
setInterval(cleanAds, 2000);

console.log('[NovaSync] Preload Ready.');
