const { ipcRenderer } = require('electron');

// --- PRELOAD SCRIPT FOR VIDEO PLAYER ---
// Version 12: Frame-Aware Autoplay & Aggressive Video Discovery

const AG_VERSION = 12;
console.log(`[NovaSync] Aegis Preload Hardening (v${AG_VERSION})...`);

// 1. Critical: Disable window.open immediately
window.open = function() { console.warn('[AG] Blocked window.open'); return null; };
window.alert = function() { return true; };
window.confirm = function() { return true; };
window.prompt = function() { return null; };

// 2. Click Hijack Protection
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'A' && (target.target === '_blank' || target.href.includes('redirect') || target.href.includes('popup'))) {
        console.warn('[AG] Blocked Link Click:', target.href);
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// 3. Global State
window.AG_VIDEO = null;
window.AG_CTX = null;
window.LAST_AG_SOURCE = null;
window.AG_PLAYED = false;
window.AG_VISUAL_BOOST = false;

// 4. Video Discovery (Shazam) - Enhanced
const findVideo = (root, depth = 0) => {
    if (!root || depth > 5) return null;
    let v = root.querySelector('video');
    if (v) return { v, context: root.defaultView || window };
    
    // Check Shadow DOM
    if (root.createTreeWalker) {
        const w = root.createTreeWalker((root.body || root), NodeFilter.SHOW_ELEMENT, null, false);
        let n; while(n = w.nextNode()) {
            if(n.shadowRoot) { 
                const res = findVideo(n.shadowRoot, depth + 1); 
                if(res) return res; 
            } 
        }
    }
    
    // Check local IFrames (Recursion into same-origin iframes)
    const fs = root.querySelectorAll('iframe');
    for(let f of fs) { 
        try { 
            let d = f.contentDocument || f.contentWindow?.document; 
            if(d) { const res = findVideo(d, depth + 1); if(res) return res; } 
        } catch(e) {} 
    }
    return null;
};

// 5. State Loop
const updateState = () => {
    if (!window.AG_VIDEO || !window.AG_VIDEO.isConnected) {
        const found = findVideo(document);
        if (found) {
            window.AG_VIDEO = found.v;
            window.AG_CTX = found.context;
            if (!window.AG_VIDEO.hasAGListeners) {
                window.AG_VIDEO.hasAGListeners = true;
                window.AG_VIDEO.addEventListener('ended', () => ipcRenderer.sendToHost('AG_ENDED'));
                window.AG_VIDEO.addEventListener('play', () => { 
                    if (!window.AG_PLAYED) {
                        window.AG_PLAYED = true;
                        ipcRenderer.sendToHost('AG_PLAYBACK_STARTED');
                    }
                    window.AG_VIDEO.muted = false; 
                    window.AG_VIDEO.volume = 1.0;
                });
                
                // Initial check for play state
                if (!window.AG_VIDEO.paused && !window.AG_PLAYED) {
                    window.AG_PLAYED = true;
                    ipcRenderer.sendToHost('AG_PLAYBACK_STARTED');
                }
            }
        }
    }

    if (window.AG_VIDEO) {
        // Aggressive Autoplay Fallback
        if (window.AG_VIDEO.paused && !window.AG_VIDEO.ended) {
            // Attempt muted playback first (bypasses most policies)
            window.AG_VIDEO.muted = true;
            window.AG_VIDEO.play().then(() => {
                // Success! Now try to unmute after a short delay
                setTimeout(() => { if (window.AG_VIDEO) window.AG_VIDEO.muted = false; }, 1000);
            }).catch(e => {
                // Truly blocked. We'll wait for user interaction.
            });
        } else if (!window.AG_VIDEO.paused && window.AG_VIDEO.muted) {
            // If playing but muted, try to unmute
            window.AG_VIDEO.muted = false;
            window.AG_VIDEO.volume = 1.0;
        }

        // Apply Visual Boost
        if (window.AG_VISUAL_BOOST) {
            window.AG_VIDEO.style.filter = 'contrast(1.08) saturate(1.12) brightness(1.05)';
        } else {
            window.AG_VIDEO.style.filter = 'none';
        }
        window.AG_VIDEO.style.transition = 'filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

        // Aegis Source Interceptor
        const currentSrc = window.AG_VIDEO.currentSrc || window.AG_VIDEO.src;
        if (currentSrc && (currentSrc.includes('.m3u8') || currentSrc.includes('.mp4')) && !currentSrc.startsWith('blob:')) {
            if (window.LAST_AG_SOURCE !== currentSrc) {
                window.LAST_AG_SOURCE = currentSrc;
                ipcRenderer.sendToHost('AG_SOURCE_FOUND', { 
                    url: currentSrc,
                    type: currentSrc.includes('.m3u8') ? 'hls' : 'mp4'
                });
            }
        }

        ipcRenderer.sendToHost('AG_UPDATE', {
            currentTime: window.AG_VIDEO.currentTime,
            duration: window.AG_VIDEO.duration || 0,
            isPaused: window.AG_VIDEO.paused,
            volume: window.AG_VIDEO.volume,
            isMuted: window.AG_VIDEO.muted
        });
    }
};
setInterval(updateState, 500);

// Listen for Commands from Host
ipcRenderer.on('AG_SET_VISUAL_BOOST', (event, enabled) => {
    window.AG_VISUAL_BOOST = enabled;
});

ipcRenderer.on('AG_SET_TIME', (event, time) => {
    if (window.AG_VIDEO) window.AG_VIDEO.currentTime = time;
});

ipcRenderer.on('AG_PLAY', () => {
    if (window.AG_VIDEO) window.AG_VIDEO.play().catch(() => {});
});

ipcRenderer.on('AG_PAUSE', () => {
    if (window.AG_VIDEO) window.AG_VIDEO.pause();
});

// 6. Aggressive Ad Sanitization
const adCss = `
    .ad, .ads, .popup, .overlay, [class*="ad-"], [id*="ad-"], 
    iframe[src*="ads"], iframe[src*="pop"], 
    div[style*="z-index: 999999"], div[style*="z-index: 2147483647"] { 
        display: none !important; 
        pointer-events: none !important; 
        visibility: hidden !important;
        opacity: 0 !important; 
        height: 0 !important;
        width: 0 !important;
    }
`;

const injectAdBlock = () => {
    const style = document.createElement('style');
    style.textContent = adCss;
    (document.head || document.documentElement).appendChild(style);
    
    setInterval(() => {
        const suspicious = document.querySelectorAll('iframe:not([id*="player"]):not([class*="player"]), [class*="popup"], [id*="pop"]');
        suspicious.forEach(el => {
            if (el.offsetWidth < 50 || el.offsetHeight < 50) {
                 el.remove();
            } else if (el.tagName === 'IFRAME' && !el.src.includes('vidlink') && !el.src.includes('vidsrc')) {
                 el.remove();
            }
        });
    }, 1000);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAdBlock);
} else {
    injectAdBlock();
}

const relayActivity = () => { 
    ipcRenderer.sendToHost('AG_WAKE'); 
    if (window.AG_VIDEO && window.AG_VIDEO.paused) {
        window.AG_VIDEO.play().catch(() => {});
    }
};
document.addEventListener('mousemove', relayActivity, { passive: true });
document.addEventListener('mousedown', relayActivity, { passive: true });
document.addEventListener('keydown', relayActivity, { passive: true });
