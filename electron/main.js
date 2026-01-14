const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');
// const torrentService = require('../services/TorrentService');

const isDev = process.env.NODE_ENV !== 'production';

// Setup file loading for production
const loadURL = serve({ directory: '.next' });

// Hardware Acceleration (Blueprint: GPU caching and performance optimization)
// Usually enabled by default, but we can enforce some flags if needed.
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-gpu-rasterization');
// app.commandLine.appendSwitch('enable-zero-copy');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#000000',
        titleBarStyle: 'hidden', // Custom title bar usage
        titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
            height: 30
        },
        trafficLightPosition: { x: 10, y: 10 },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            spellcheck: false,
            sandbox: true // Security: Enabling sandbox per Spec
        }
    });

    // 4. Header Spoofing (Universal Referer Control)
    session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: ['*://*.vidlink.pro/*', '*://*.vidsrc.me/*', '*://*.vidsrc.icu/*', '*://*.tmdb.org/*', '*://*.themoviedb.org/*', '*://*.tmdb.org/*'] },
        (details, callback) => {
            const url = new URL(details.url);
            const domain = url.hostname;

            if (domain.includes('tmdb.org') || domain.includes('themoviedb.org')) {
                details.requestHeaders['Referer'] = 'https://www.themoviedb.org/';
            } else {
                details.requestHeaders['Referer'] = `${url.protocol}//${url.hostname}/`;
                details.requestHeaders['Origin'] = `${url.protocol}//${url.hostname}`;
            }

            // Comprehensive browser identity
            details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
            callback({ requestHeaders: details.requestHeaders });
        }
    );

    // 5. Unified Network Filter (Total Lockdown)
    session.defaultSession.webRequest.onBeforeRequest(
        { urls: ['*://*/*'] },
        (details, callback) => {
            const url = details.url.toLowerCase();

            // Always allow localhost and core services
            if (url.startsWith('http://localhost') ||
                url.includes('tmdb.org') ||
                url.includes('themoviedb.org') ||
                url.includes('vidlink.pro') ||
                url.includes('vidsrc.me') ||
                url.includes('vidsrc.icu') ||
                url.includes('wikimedia.org')) {
                return callback({});
            }

            // Extreme Ad-Blocking & Tracker Kill-List
            const adPatterns = [
                'doubleclick', 'googlesyndication', 'google-analytics', 'googleadservices',
                'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'smartadserver',
                'criteo', 'moatads', 'ad-delivery', 'popcash', 'popads', 'adsterra',
                'propellerads', 'revenuehits', 'syndication', 'tagmanager', 'tracker', 'pixel',
                'outbrain', 'taboola', 'mgid', 'revcontent', 'adroll', 'adform', 'opera',
                'click', 'redirect', 'popup', 'adbox', 'ad-cache', 'analytics',
                'luckyorange', 'hotjar', 'histats', 'statcounter', 'quantserve',
                'disqus', 'sharethis', 'addthis', 'clouddn', 'cloudfront' // some of these might be over-aggressive, but good for total lockdown
            ];

            if (adPatterns.some(p => url.includes(p))) {
                console.log(`[AG] BLOCKING POTENTIAL AD/REDIRECT: ${details.url}`);
                return callback({ cancel: true });
            }

            // Video Sniffer
            if (url.includes('.m3u8') || url.includes('.mp4') || url.includes('.mkv')) {
                if (!url.includes('localhost') && mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('video-detected', details.url);
                }
            }

            callback({});
        });

    // 6. Global Popup & Navigation Lockdown (Soften)
    mainWindow.webContents.setWindowOpenHandler((details) => {
        const url = details.url.toLowerCase();
        // Allow common video provider domains to open windows if really needed, 
        // but generally we want to block them. However, "scrap global popup" suggests
        // we should be less restrictive or at least not block EVERYTHING.
        const blockedHostnames = ['ad', 'click', 'pop', 'redirect', 'promot', 'bet', 'casino'];
        if (blockedHostnames.some(h => url.includes(h))) {
            console.log(`[AG] BLOCKED SUSPICIOUS POPUP: ${details.url}`);
            return { action: 'deny' };
        }

        console.log(`[AG] ALLOWING WINDOW OPEN: ${details.url}`);
        // Instead of denial, we can use 'allow' but it opens a new window.
        // Or we can use shell.openExternal(details.url) and return { action: 'deny' }
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // Emergency Window Destroyer (if any window slips through)
    app.on('browser-window-created', (event, window) => {
        if (window !== mainWindow) {
            console.log(`[AG] DESTROYING ROGUE WINDOW: ${window.getURL()}`);
            window.destroy();
        }
    });

    // 7. Download Lockdown (Blocks "Opera" and other unwanted downloads)
    session.defaultSession.on('will-download', (event, item, webContents) => {
        console.warn(`[AG] BLOCKED UNSOLICITED DOWNLOAD: ${item.getURL()}`);
        event.preventDefault();
    });

    // Block only highly suspicious main frame navigations
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const lowUrl = url.toLowerCase();
        const suspiciousPatterns = ['redirect', 'click', 'pop', 'ad', 'bet', 'casino'];
        if (suspiciousPatterns.some(p => lowUrl.includes(p)) && !url.includes('localhost')) {
            console.warn(`[AG] BLOCKED SUSPICIOUS MAIN FRAME NAV: ${url}`);
            event.preventDefault();
        }
    });

    // Block any SUBFRAME navigation (iframe) to unknown domains
    mainWindow.webContents.on('will-frame-navigate', (event, url) => {
        const allowedHostnames = ['localhost', 'vidlink.pro', 'vidsrc.me', 'vidsrc.icu', 'tmdb.org', 'themoviedb.org', 'google.com', 'gstatic.com', 'youtube.com'];
        const isAllowed = allowedHostnames.some(h => url.includes(h));

        if (!isAllowed) {
            console.warn(`[AG] BLOCKED IFRAME HIJACK: ${url}`);
            event.preventDefault();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        // mainWindow.webContents.openDevTools(); // Optional: open by default if needed
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();

    // Cleanup on exit
    app.on('will-quit', async (e) => {
        e.preventDefault();
        // try {
        //     await torrentService.stopStream();
        // } catch (err) {
        //     console.error('Error stopping torrents on quit:', err);
        // }
        app.exit();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// --- IPC HANDLERS ---

// Torrent: Start
// Torrent: Start (SPEC-TORRENT-IPC)
// Torrent: Start (SPEC-TORRENT-IPC)
ipcMain.handle('torrent:start-stream', async (event, payload) => {
    return { success: false, error: "Torrent service disabled" };
    /*
    try {
        const { magnetUri } = payload;
        const result = await torrentService.startStream(magnetUri);

        // Start status updates
        if (this.statusInterval) clearInterval(this.statusInterval);
        this.statusInterval = setInterval(() => {
            const stats = torrentService.getStats();
            if (stats && mainWindow) {
                mainWindow.webContents.send('torrent:status', stats);
            }
        }, 1000);

        return { success: true, ...result };
    } catch (error) {
        console.error('IPC torrent:start-stream error:', error);
        return { success: false, error: error.message };
    }
    */
});

// Torrent: Stop
// Torrent: Stop
ipcMain.handle('torrent:stop-stream', async () => {
    if (this.statusInterval) clearInterval(this.statusInterval);
    // await torrentService.stopStream();
    return { success: true };
});

// Just in case: Clean up interval on window close
ipcMain.on('stop-status-updates', () => {
    if (this.statusInterval) clearInterval(this.statusInterval);
});
