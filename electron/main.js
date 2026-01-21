const { app, BrowserWindow, ipcMain, session, shell, dialog, protocol, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const { fork } = require('child_process');
const path = require('path');
// app.name is now 'novastream' from package.json
// const serve = require('electron-serve');
const axios = require('axios');
const fs = require('fs');
const licenseManager = require('./licenseManager');
const castService = require('./services/castService');
const torrentService = require('../services/TorrentService');

const isDev = !app.isPackaged;
const { pathToFileURL } = require('url');

// Register custom protocol privileges early
// ONLY register 'proxy' here. 'app' is handled by electron-serve or defaults.
// registering 'app' as standard manually can sometimes break electron-serve's host-less '-' mapping.
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, allowServiceWorkers: true } },
    { scheme: 'proxy', privileges: { secure: true, standard: true, supportFetchAPI: true, allowServiceWorkers: true, corsEnabled: true } }
]);

// Setup file loading for production
// const loadURL = serve({ directory: 'out' });

// Hardware Acceleration (Blueprint: GPU caching and performance optimization)
// Usually enabled by default, but we can enforce some flags if needed.
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-gpu-rasterization');
// app.commandLine.appendSwitch('enable-zero-copy');

// Hardware Acceleration (Blueprint: GPU caching and performance optimization)
// Usually enabled by default, but we can enforce some flags if needed.
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-gpu-rasterization');
// app.commandLine.appendSwitch('enable-zero-copy');

ipcMain.on('frontend-log', (event, msg) => {
    console.log(`[Frontend] ${msg}`);
});

const log = (msg, ...args) => console.log(`[Main] ${msg}`, ...args);

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
            allowRunningInsecureContent: true, // Allow http://localhost media in app://
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            spellcheck: false,
            sandbox: true, // Security: Enabling sandbox per Spec
            autoplayPolicy: 'no-user-gesture-required' // Critical for background trailers
        }
    });

    // Initialize Auto-updater logic
    initAutoUpdater();

    // 4. Header Spoofing (Universal Referer Control)
    // 4. Header Spoofing (Universal Referer Control)
    const applyRequestHeaders = (sess) => {
        sess.webRequest.onBeforeSendHeaders(
            { urls: ['*://*.vidlink.pro/*', '*://*.vidsrc.me/*', '*://*.vidsrc.icu/*', '*://*.tmdb.org/*', '*://*.themoviedb.org/*', '*://*.youtube.com/*', '*://*.googlevideo.com/*'] },
            (details, callback) => {
                const url = new URL(details.url);
                const domain = url.hostname;

                if (domain.includes('tmdb.org') || domain.includes('themoviedb.org')) {
                    details.requestHeaders['Referer'] = 'https://www.themoviedb.org/';
                } else if (domain.includes('youtube.com') || domain.includes('googlevideo.com')) {
                    // Critical Fix for Error 152: 
                    // DO NOT send Origin. Sending a fake 'youtube.com' Origin triggers strict CORS checks.
                    // Sending NO Origin allows the embed to play as if it were a direct browser nav.
                    details.requestHeaders['Referer'] = 'https://www.youtube.com/';
                    if (details.requestHeaders['Origin']) delete details.requestHeaders['Origin'];
                    // [DEBUG] Log packet to help user debug functionality
                    console.log(`[AG Debug] YouTube Req: ${url.pathname} | Ref: ${details.requestHeaders['Referer']} | Origin: ${details.requestHeaders['Origin'] || 'REMOVED'}`);
                } else {
                    details.requestHeaders['Referer'] = `${url.protocol}//${url.hostname}/`;
                    details.requestHeaders['Origin'] = `${url.protocol}//${url.hostname}`;
                }

                // Comprehensive browser identity (Downgraded to Chrome 120)
                details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
                
                // Remove 'sec-ch-ua-form-factors' request header
                if (details.requestHeaders['sec-ch-ua-form-factors']) delete details.requestHeaders['sec-ch-ua-form-factors'];
                
                callback({ requestHeaders: details.requestHeaders });
            }
        );
    };

    applyRequestHeaders(session.defaultSession);
    applyRequestHeaders(session.fromPartition('persist:youtube-player'));

    // 5. Response Header Cleaning (Agreesive Fix for "Unrecognized feature" & CSP)
    // 5. Consolidated Response Header Handling
    // Handles BOTH YouTube Policy Stripping (Fix Error 153/Unrecognized Feature) AND General CSP Injection
    // 5. Consolidated Response Header Handling
    // Handles BOTH YouTube Policy Stripping (Fix Error 153/Unrecognized Feature) AND General CSP Injection
    const applyResponseHeaders = (sess) => {
        sess.webRequest.onHeadersReceived(
            { urls: ['<all_urls>'] },
            (details, callback) => {
                if (details.responseHeaders) {
                    const url = details.url;
                    const domain = new URL(url).hostname;
                    
                    // Shallow copy to ensure modification works
                    const newHeaders = { ...details.responseHeaders };

                    // A. YouTube/Google Video Cleanup (Aggressive Stripping)
                    if (domain.includes('youtube.com') || domain.includes('googlevideo.com')) {
                        const keysToDelete = [
                            'permissions-policy',
                            'content-security-policy',
                            'x-frame-options',
                            'report-to',
                            'nel',
                            'accept-ch'
                        ];
                        Object.keys(newHeaders).forEach(header => {
                            if (keysToDelete.includes(header.toLowerCase())) {
                                delete newHeaders[header];
                            }
                        });
                    }

                    // B. General CSP Injection
                    if (newHeaders['content-security-policy']) {
                        let csp = newHeaders['content-security-policy'][0];
                        csp = csp.replace(/connect-src/g, "connect-src proxy: app: http: ");
                        csp = csp.replace(/img-src/g, "img-src proxy: app: http: ");
                        csp = csp.replace(/media-src/g, "media-src proxy: app: http: blob: ");
                        // Fallback if media-src is missing (it falls back to default-src)
                        if (!csp.includes('media-src')) {
                            csp += "; media-src proxy: app: http: blob: 'self' https:;";
                        }
                        newHeaders['content-security-policy'] = [csp];
                    }
                    
                    callback({ responseHeaders: newHeaders });
                } else {
                    callback({ responseHeaders: details.responseHeaders });
                }
            }
        );
    };

    applyResponseHeaders(session.defaultSession);
    applyResponseHeaders(session.fromPartition('persist:youtube-player'));


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
    // app.on('browser-window-created', (event, window) => {
    //     if (window !== mainWindow) {
    //         console.log(`[AG] DESTROYING ROGUE WINDOW: ${window.getURL()}`);
    //         window.destroy();
    //     }
    // });

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
        const allowedHostnames = ['localhost', 'vidlink.pro', 'vidsrc.me', 'vidsrc.icu', 'tmdb.org', 'themoviedb.org', 'google.com', 'gstatic.com', 'youtube.com', 'dicebear.com'];
        const isAllowed = allowedHostnames.some(h => url.includes(h));

        if (!isAllowed) {
            console.warn(`[AG] BLOCKED IFRAME HIJACK: ${url}`);
            event.preventDefault();
        }
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[AG] FAILED TO LOAD: ${validatedURL}`);
        console.error(`[AG] Error: ${errorCode} (${errorDescription})`);
        
        // Visual feedback for any load failure in production
        if (!isDev) {
            dialog.showErrorBox('NovaStream Load Error', 
                `Failed to load: ${validatedURL}\nError: ${errorDescription} (${errorCode})`
            );
        }
    });

    // Debugging: Log all navigations
    mainWindow.webContents.on('did-start-navigation', (event, url) => {
        console.log(`[AG] Navigating to: ${url}`);
    });

    // (Legacy listener consolidated above)
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            mainWindow.webContents.openDevTools();
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // In production, load from the local Express server
        // Wait for port if not yet set (though sync execution in app.ready should usually handle it)
        // We assume global.serverPort is set by the time createWindow is called in production
        const port = global.serverPort;
        if (port) {
            mainWindow.loadURL(`http://127.0.0.1:${port}`).catch(err => {
                 console.error('[AG] Failed to load production URL:', err);
                 dialog.showErrorBox('Launch Error', `Failed to load app from local server: ${err.message}`);
            });
        } else {
             dialog.showErrorBox('Launch Error', 'Internal Server Error: Port not assigned.');
        }
    }

    // 12. Casting IPC
    ipcMain.on('CAST_SCAN_START', (event) => {
        castService.startScan((devices) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('CAST_DEVICE_LIST', devices);
            }
        });
    });

    ipcMain.on('CAST_SCAN_STOP', () => {
        castService.stopScan();
    });

    ipcMain.handle('CAST_PLAY', async (event, { deviceId, url, metadata }) => {
        try {
            await castService.cast(deviceId, url, metadata);
            return { success: true };
        } catch (error) {
            console.error('Cast Error:', error);
            return { success: false, error: error.message };
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', async () => {
    let log = (msg) => console.log(msg); // Early fallback logger
    
    try {
        const userDataPath = app.getPath('userData');
        
        if (!fs.existsSync(userDataPath)) {
            try { fs.mkdirSync(userDataPath, { recursive: true }); } catch(e) {}
        }
        
        const logPath = path.join(userDataPath, 'startup.log');
        const logger = (msg) => {
            const line = `[${new Date().toISOString()}] ${msg}\n`;
            console.log(msg);
            try { fs.appendFileSync(logPath, line); } catch(e) {
                try { fs.appendFileSync(path.join(app.getPath('temp'), 'ns-emergency.log'), line); } catch(e2) {}
            }
        };
        log = logger; // Switch to file logger
        licenseManager.setLogger(log); // Share logger with LicenseManager

        log('--- BOOT SEQUENCE START ---');
        log(`Mode: ${isDev ? 'Development' : 'Production'}`);
        log(`AppPath: ${app.getAppPath()}`);
        log(`UserData: ${userDataPath}`);

    // 1. SYNC REGISTRATIONS (Must happen before any awaits)
    // ---------------------------------------------------
    
    // 0. Express Server for Production (Standard HTTP to fix YouTube/Embeds)
    if (!isDev) {
        const express = require('express');
        const server = express();
        const staticPath = path.join(app.getAppPath(), 'out');
        
        // API Proxy Middleware (Backend)
        server.use('/api', async (req, res) => {
             try {
                 // req.url is relative to mount point (e.g. /request-access)
                 // Reconstruct full backend URL
                 const targetUrl = `http://localhost:5000/api${req.url}`;
                 
                 // Forward request
                 const response = await axios({
                     method: req.method,
                     url: targetUrl,
                     headers: { ...req.headers, host: 'localhost:5000' }, // Override host 
                     data: req.method !== 'GET' ? req.body : undefined,
                     responseType: 'stream',
                     validateStatus: () => true // Pass all statuses
                 });
                 
                 res.set(response.headers);
                 res.status(response.status);
                 response.data.pipe(res);
             } catch (err) {
                 console.error('[API Proxy Error]', err.message);
                 res.status(500).send(err.message);
             }
        });

        // TMDB API Proxy Middleware
        server.use('/tmdb-api', async (req, res) => {
             try {
                 const tmdbPath = req.url;
                 const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
                 const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
                 
                 let targetUrl = `https://api.themoviedb.org/3${tmdbPath}`;
                 
                 // Append API Key if using key-based auth
                 if (!TOKEN && API_KEY) {
                     const sep = targetUrl.includes('?') ? '&' : '?';
                     targetUrl += `${sep}api_key=${API_KEY}`;
                 }
                 
                 const headers = { 'Accept': 'application/json' };
                 if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

                 const response = await axios({
                     method: req.method,
                     url: targetUrl,
                     headers: headers,
                     responseType: 'stream',
                     validateStatus: () => true
                 });
                 
                 res.set(response.headers);
                 res.status(response.status);
                 response.data.pipe(res);
             } catch (err) {
                 console.error('[TMDB Proxy Error]', err.message);
                 res.status(500).send(err.message);
             }
        });

        server.use(express.static(staticPath));
        
        // SPA Fallback: Any 404 goes to index.html
        server.get(/(.*)/, (req, res) => {
            res.sendFile(path.join(staticPath, 'index.html'));
        });
        
        const expressServer = server.listen(0, '127.0.0.1', () => {
             const port = expressServer.address().port;
             log(`[Express] Serving ${staticPath} on http://127.0.0.1:${port}`);
             global.serverPort = port;
        });
        global.serverProcess = expressServer; // For cleanup
    } else {
        // Dev logic handles itself
    }

    // Proxy Protocol Handler
    protocol.handle('proxy', async (request) => {
        const url = new URL(request.url);
        log(`[Proxy Request] ${url.pathname}`);

        try {
            let response;
            // TMDB API Proxy
            if (url.pathname.startsWith('/tmdb-api/')) {
                const tmdbPath = url.pathname.replace('/tmdb-api', '');
                
                // Preferred: Read Access Token (Bearer)
                const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
                // Fallback: API Key (Query Param)
                const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
                
                let targetUrl = `https://api.themoviedb.org/3${tmdbPath}${url.search}`;
                const fetchHeaders = { 'Accept': 'application/json' };

                if (TOKEN) {
                    fetchHeaders['Authorization'] = `Bearer ${TOKEN}`;
                } else if (API_KEY) {
                    const sep = targetUrl.includes('?') ? '&' : '?';
                    targetUrl += `${sep}api_key=${API_KEY}`;
                } else {
                    log('[Proxy Warning] TMDB credentials missing from environment!');
                }
                
                response = await net.fetch(targetUrl, { headers: fetchHeaders });
            }

            // TMDB Image Proxy
            else if (url.pathname.startsWith('/tmdb-img/')) {
                const imgPath = url.pathname.replace('/tmdb-img', '');
                const IMG_URL = `https://image.tmdb.org/t/p${imgPath}${url.search}`;
                
                response = await net.fetch(IMG_URL, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Referer': 'https://www.themoviedb.org/'
                    }
                });
            }

            // Local Backend Proxy (SMART ROUTING)
            else if (url.pathname.startsWith('/api/')) {
                // Scraper endpoints MUST stay local for performance and capability
                const isLocalRoute = url.pathname.includes('/sources') || 
                                    url.pathname.includes('/scrape') || 
                                    url.pathname.includes('/refresh') ||
                                    url.pathname.includes('/local');
                
                const cloudBase = 'https://inertial-event.vercel.app';
                const localBase = 'http://localhost:5000';

                let targetBase = cloudBase;
                if (isLocalRoute) {
                    targetBase = localBase;
                    log(`[Proxy Smart] Routing Local Scraper: ${url.pathname} -> ${localBase}`);
                } else {
                    log(`[Proxy Smart] Routing Global Cloud: ${url.pathname} -> ${cloudBase}`);
                }

                const BACKEND_URL = `${targetBase}${url.pathname}${url.search}`;
                response = await net.fetch(BACKEND_URL);
            }

            if (response) {
                // Inject CORS headers to allow app:// to read these responses
                const headers = {};
                for (const [key, value] of response.headers.entries()) {
                    headers[key] = value;
                }
                headers['Access-Control-Allow-Origin'] = '*';
                headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
                headers['Access-Control-Allow-Headers'] = '*';

                log(`[Proxy OK] ${url.pathname} -> ${response.status}`);
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });
            }
        } catch (err) {
            log(`[Proxy Error] ${err.message}`);
        }

        return new Response('Not Found', { status: 404 });
    });

    // Unified Network Filter (Adblock + Proxy Reroute)
    session.defaultSession.webRequest.onBeforeRequest(
        { urls: ['<all_urls>'] },
        (details, callback) => {
            const url = details.url;
            const urlLower = url.toLowerCase();
            
            // 1. Critical Reroute: Intercept absolute cloud URLs, app://, or localhost:3000 -> proxy://
            const isLocal = url.includes('localhost:3000') || url.includes('127.0.0.1:3000');
            const isVercelApi = url.startsWith('https://inertial-event.vercel.app/api/');
            
            if (url.startsWith('app://-/tmdb-api/') || (isLocal && url.includes('/tmdb-api/'))) {
                const redirected = `proxy://-/tmdb-api/${url.split('/tmdb-api/')[1]}`;
                log(`[Reroute] TMDB API: ${url} -> ${redirected}`);
                return callback({ redirectURL: redirected });
            }
            if (url.startsWith('app://-/tmdb-img/') || (isLocal && url.includes('/tmdb-img/'))) {
                const redirected = `proxy://-/tmdb-img/${url.split('/tmdb-img/')[1]}`;
                return callback({ redirectURL: redirected });
            }
            if (url.startsWith('app://-/api/') || (isLocal && url.includes('/api/')) || isVercelApi) {
                const pathPart = url.split('/api/')[1];
                const redirected = `proxy://-/api/${pathPart}`;
                
                // CRITICAL: Avoid infinite loop if this request IS the proxy's own net.fetch
                // Electron net.fetch usually has a unique 'id' or we can check details.resourceType
                // BUT better yet, let's just make sure we only redirect if it's NOT already being handled.
                // Actually, the proxy protocol handler handles 'proxy://' so this redirect is safe 
                // as long as the proxy handler itself doesn't use the SAME URL structure that triggers this.
                // In main.js, the proxy handler uses 'https://inertial-event.vercel.app' which WILL trigger this.
                
                // To prevent loop: Only redirect if it's NOT from the main process itself (which has webContents null or 0)
                if (details.webContentsId > 0) {
                    log(`[Reroute] Backend API: ${url} -> ${redirected}`);
                    return callback({ redirectURL: redirected });
                }
            }

            // 2. Allow-list
            if (urlLower.startsWith('app://') || urlLower.startsWith('proxy://') || urlLower.startsWith('http://localhost') || 
                urlLower.includes('tmdb.org') || urlLower.includes('themoviedb.org') || 
                urlLower.includes('vidlink.pro') || urlLower.includes('vidsrc.me') || urlLower.includes('vidsrc.icu') ||
                urlLower.includes('youtube.com') || urlLower.includes('googlevideo.com') || urlLower.includes('ytimg.com') || urlLower.includes('youtube-nocookie.com') || urlLower.includes('ggpht.com') ||
                urlLower.includes('dicebear.com') || urlLower.includes('wikimedia.org')) {
                return callback({});
            }

            // 3. Simple Adblock
            const adPatternRegex = new RegExp([
                'doubleclick', 'googlesyndication', 'google-analytics', 'googleadservices',
                'adnxs', 'rubiconproject', 'pubmatic', 'openx', 'smartadserver',
                'criteo', 'moatads', 'ad-delivery', 'popcash', 'popads', 'adsterra',
                'propellerads', 'revenuehits', 'syndication', 'tagmanager', 'tracker', 'pixel',
                'outbrain', 'taboola', 'mgid', 'revcontent', 'adroll', 'adform', 'opera',
                'click', 'redirect', 'popup', 'adbox', 'ad-cache', 'analytics',
                'luckyorange', 'hotjar', 'histats', 'statcounter', 'quantserve',
                'disqus', 'sharethis', 'addthis', 'clouddn', 'cloudfront'
            ].join('|'), 'i');

            // Surgical Exception: Allow DoubleClick if it's for YouTube (Referrer check)
            // AND allow googleads/static.doubleclick explicitly if not caught above
            if (urlLower.includes('doubleclick') && (details.referrer && details.referrer.includes('youtube.com'))) {
                 return callback({});
            }

            if (adPatternRegex.test(urlLower)) {
                return callback({ cancel: true });
            }

            callback({});
        }
    );

        // 2. ASYNC VALIDATION (Critical Security Path)
        // ---------------------------------------------------
        
        log('Loading env...');
        await licenseManager.loadSecureEnv();
        
        log('Validating license...');
        // Safety timeout for validation
        let validationResult;
        try {
            validationResult = await Promise.race([
                licenseManager.validate(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Security check timeout (15s)')), 15000))
            ]);
        } catch (err) {
            if (err.message && err.message.includes('LICENSE_REVOKED')) {
                log('License revoked. Prompting for new key.');
                dialog.showMessageBoxSync({
                    type: 'error',
                    title: 'License Revoked',
                    message: 'Your license validation failed.\n\nServer Message: ' + err.message.replace('LICENSE_REVOKED:', '').trim() + '\n\nPlease enter a new key to continue.',
                    buttons: ['OK']
                });
                // Force activation flow
                validationResult = { requiresActivation: true };
            } else {
                throw err;
            }
        }
        
        // Check if activation is required
        if (validationResult.requiresActivation) {
            log('No license found. Showing activation window...');
            
            // Import activation window module
            const { createActivationWindow } = require('./activationWindow');
            
            // Create standalone activation window (no hidden parent needed)
            const activationWin = createActivationWindow(null);
            
            // Wait for activation to complete or window close
            const activationSuccess = await new Promise((resolve) => {
                let wasActivated = false;
                
                // Listen for successful activation signal
                ipcMain.once('activation-success', () => {
                    wasActivated = true;
                    log('Activation signal received!');
                    activationWin.close();
                });
                
                activationWin.on('closed', () => {
                    resolve(wasActivated);
                });
            });
            
            if (!activationSuccess) {
                log('User closed activation without completing. Exiting.');
                dialog.showMessageBoxSync({
                    type: 'warning',
                    title: 'Activation Required',
                    message: 'NovaStream requires activation to run. Please restart the app and enter a valid license key.',
                    buttons: ['OK']
                });
                app.quit();
                return;
            }
            
            log('Activation completed. Proceeding...');
        } else if (!validationResult.valid) {
            throw new Error('License validation failed');
        }
        
        log('Validation OK. Launching UI.');

        // 3. START BACKEND SERVER (Production Only)
        // ---------------------------------------------------
        if (!isDev) {
            try {
                const serverPath = path.join(app.getAppPath(), 'dist-server', 'index.js');
                log(`[AG] Starting Backend Server from: ${serverPath}`);
                
                // Inherit env (which now has decrypted keys) and set PORT
                const serverEnv = { ...process.env, BACKEND_PORT: '5000', NODE_ENV: 'production' };
                
                global.serverProcess = fork(serverPath, [], {
                    env: serverEnv,
                    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
                });

                global.serverProcess.on('error', (err) => {
                    log(`[Backend Error] Failed to start: ${err.message}`);
                });

                global.serverProcess.stdout.on('data', (data) => {
                    log(`[Backend] ${data.toString().trim()}`);
                });

                global.serverProcess.stderr.on('data', (data) => {
                    log(`[Backend Error] ${data.toString().trim()}`);
                });

                log('[AG] Backend Server Spawned PID: ' + global.serverProcess.pid);
            } catch (err) {
                log(`[AG] FAILED to spawn backend: ${err.message}`);
                dialog.showErrorBox('Server Error', 'Failed to start local server.\n' + err.message);
            }
        }

        createWindow();
    } catch (error) {
        const errorMsg = `FATAL BOOT ERROR: ${error.stack}`;
        if (log) log(errorMsg); else console.error(errorMsg);
        
        dialog.showErrorBox('NovaStream Boot Failure', 
            `The application failed to start.\n\nError: ${error.message}\n\nCheck logs at: ${app.getPath('userData')}\\startup.log`
        );
        app.quit();
        return;
    }

    // Cleanup on exit - MUST kill child processes or installer will fail
    app.on('before-quit', () => {
        console.log('[AG] Before quit - cleaning up...');
        killAllChildProcesses();
    });

    app.on('will-quit', (e) => {
        console.log('[AG] Will quit - final cleanup...');
        killAllChildProcesses();
    });

    function killAllChildProcesses() {
        // Kill backend server
        if (global.serverProcess) {
            console.log('[AG] Killing backend server PID:', global.serverProcess.pid);
            try {
                // On Windows, kill the process tree
                if (process.platform === 'win32') {
                    require('child_process').execSync(`taskkill /PID ${global.serverProcess.pid} /T /F`, { stdio: 'ignore' });
                } else {
                    global.serverProcess.kill('SIGKILL');
                }
            } catch (e) {
                console.log('[AG] Process already dead or kill failed:', e.message);
            }
            global.serverProcess = null;
        }
    }
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
ipcMain.handle('torrent:start-stream', async (event, payload) => {
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

        return { success: true, streamUrl: result.url, ...result };
    } catch (error) {
        console.error('IPC torrent:start-stream error:', error);
        return { success: false, error: error.message };
    }
});

// Torrent: Stop
ipcMain.handle('torrent:stop-stream', async () => {
    if (this.statusInterval) clearInterval(this.statusInterval);
    await torrentService.stopStream();
    return { success: true };
});

// Just in case: Clean up interval on window close
ipcMain.on('stop-status-updates', () => {
    if (this.statusInterval) clearInterval(this.statusInterval);
});
// --- Auto Updater Logic ---
async function initAutoUpdater() {
    // Only run in production
    if (isDev) return;

    try {
        // Tie to keygen: Check license validity before allowing updates
        // This ensures blocked/revoked users don't get new patches
        const licenseStatus = await licenseManager.validate().catch(err => {
            log('[Updater] License validation failed during update check:', err.message);
            return { valid: false };
        });

        if (!licenseStatus.valid) {
            log('[Updater] License invalid. Skipping remote update check.');
            return;
        }

        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on('checking-for-update', () => {
            log('[Updater] Checking for update...');
        });

        autoUpdater.on('update-available', (info) => {
            log('[Updater] Update available:', info.version);
        });

        autoUpdater.on('update-not-available', (info) => {
            log('[Updater] No update available.');
        });

        autoUpdater.on('error', (err) => {
            log('[Updater] Error:', err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            log('[Updater] Download progress:', Math.round(progressObj.percent) + '%');
        });

        autoUpdater.on('update-downloaded', (info) => {
            log('[Updater] Update downloaded; will install on quit.');
        });

        // Check for updates every 2 hours or on startup
        autoUpdater.checkForUpdatesAndNotify();
        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 1000 * 60 * 60 * 2); 
    } catch (e) {
        log('[Updater] Critical initialization failure:', e.message);
    }
}

// IPC for manual update triggers if needed
ipcMain.handle('check-for-updates', async () => {
    if (isDev) return { message: 'In development mode', available: false };
    const result = await autoUpdater.checkForUpdates();
    return { available: result && result.updateInfo.version !== app.getVersion() };
});
