const WebTorrent = require('webtorrent');
const path = require('path');
const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Verify ffmpeg path
console.log('[TorrentService] FFmpeg path set to:', ffmpegPath);

const TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://9.rarbg.com:2810/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://www.torrent.eu.org:451/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://retracker.lanta-net.ru:2710/announce',
    'udp://tracker.tiny-vps.com:6969/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.cyberia.is:6969/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://ipv4.tracker.harry.lu:80/announce',
    'udp://bt2.archive.org:6969/announce'
];

let videoMetadataService;
try {
    // Load from sibling file
    videoMetadataService = require('./VideoMetadataService');
    console.log('✅ VideoMetadataService loaded');
} catch (e) {
    console.warn("⚠️ VideoMetadataService not available:", e.message);
}

class TorrentService {
    constructor() {
        this.metadataTimeout = null;
        this.pendingReject = null;
        this.lastStartTime = 0;
        this.scheduledStop = null;
        this.STOP_COOLDOWN = 5000;
        
        // P0: Idempotency tracking
        this.activeMagnet = null;
        this.activeInfoHash = null; // Normalized ID for comparison
        this.activePromise = null;
        this.activeFfmpeg = null; // Reference to kill transcoding
        this.config = {
            path: null,
            maxCacheSize: 10 * 1024 * 1024 * 1024, // 10GB default cap
        };
        
        this.activeServers = new Map();
        
        // Removed eager initClient() call to save PIDs on startup
    }

    _getInfoHash(magnet) {
        if (!magnet || typeof magnet !== 'string') return null;
        const match = magnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/);
        return match ? match[1].toLowerCase() : null;
    }

    initClient(options = {}) {
        const strategy = options.strategy || 'standard';
        let maxConns = 55;
        if (strategy === 'aggressive') maxConns = 200;
        if (strategy === 'minimal') maxConns = 20;

        // If client exists but has different strategy, we might need to recreate it
        // However, destroying the client while torrents are active is risky.
        // Since we call initClient after stopStream, it's generally safe.
        if (this.client) {
            // If the maxConns is already what we want, just return
            if (this.currentMaxConns === maxConns) return;
            
            // P0: Do NOT destroy the client if we have active torrents or are starting one
            if (this.activeTorrent || this.isStarting) {
                console.warn(`[TorrentService] Client recreation requested (${strategy}) but session is active. Skipping to prevent crash.`);
                return;
            }

            console.log(`[TorrentService] Recreating client with ${strategy} strategy (maxConns: ${maxConns})`);
            try {
                this.client.destroy();
            } catch (e) {}
            this.client = null;
        }

        console.log(`[TorrentService] Initializing WebTorrent (Strategy: ${strategy}, MaxConns: ${maxConns})`);
        this.client = WebTorrent ? new WebTorrent({
            maxConns: maxConns,
            uploadLimit: 1024 * 1024,
            dht: true,
            lsd: true,
            tracker: true,
            path: options.path || this.config.path
        }) : null;
        this.currentMaxConns = maxConns;
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.path) {
            console.log('[TorrentService] Updating download path to:', newConfig.path);
            this.initClient({ path: newConfig.path });
        }
    }


    startStream(magnetLink, episodeHint, seasonHint, strategy = 'standard', fileIndex = null, audioTrackIndex = null) {
        const targetInfoHash = this._getInfoHash(magnetLink);
        const isSameMagnet = this.activeInfoHash === targetInfoHash && targetInfoHash !== null;

        if (this.isStarting || this.activeTorrent) {
            // P0: Idempotency - If we are already starting/running THIS magnet, return existing promise/result
            if (isSameMagnet) {
                console.log(`[TorrentService] startStream called for already active magnet (${targetInfoHash}). Returning active session.`);
                if (this.activePromise) return this.activePromise;
                
                // Fallback: If no promise but active torrent, return it immediately
                if (this.activeTorrent && this.server) {
                    const port = this.server.address().port;
                    const targetFile = fileIndex !== null ? this.activeTorrent.files[fileIndex] : this.activeTorrent.files[0];
                    const url = `http://127.0.0.1:${port}/stream.mp4?path=${encodeURIComponent(targetFile.path)}`;
                    console.log(`[TorrentService] Returning active session URL: ${url}`);
                    return Promise.resolve({
                        success: true,
                        url: url,
                        fileIndex: fileIndex || 0
                    });
                }
            } else {
                console.warn(`[TorrentService] Superseding active session for ${this.activeInfoHash}...`);
            }
        }

        // Lock early before any awaits to prevent race conditions
        this.isStarting = true;
        const oldMagnet = this.activeMagnet;
        this.activeMagnet = magnetLink;
        this.activeInfoHash = targetInfoHash;
        
        this.activePromise = this._startStreamExecution(magnetLink, oldMagnet, episodeHint, seasonHint, strategy, fileIndex, audioTrackIndex);
        return this.activePromise;
    }

    async _startStreamExecution(magnetLink, previousMagnet, episodeHint, seasonHint, strategy, fileIndex, audioTrackIndex) {
        try {
            const targetInfoHash = this._getInfoHash(magnetLink);
            // Cancel any scheduled stop from a previous mount/unmount cycle
            if (this.scheduledStop) {
                console.log('[TorrentService] Cancelling scheduled stop for new start request.');
                clearTimeout(this.scheduledStop);
                this.scheduledStop = null;
            }

            // Cleanup existing session if it's a DIFFERENT magnet
            if (previousMagnet && this._getInfoHash(previousMagnet) !== targetInfoHash) {
                console.log(`[TorrentService] New magnet requested. Superseding ${this._getInfoHash(previousMagnet)}...`);
                await this._supersedePrevious(); 
            }
            
            const trackeredMagnet = this._appendTrackers(magnetLink);
            this.activeMagnet = trackeredMagnet;
            this.activeInfoHash = targetInfoHash;
            this.initClient({ strategy });
            if (!this.client) throw new Error("WebTorrent engine not available.");

            this.lastStartTime = Date.now();

            const self = this;
            const streamPromise = new Promise((resolve, reject) => {
                console.log('Using WebTorrent to stream:', magnetLink);

                self.pendingReject = reject;

                self.metadataTimeout = setTimeout(() => {
                    console.log('Main: Torrent Start Error: Metadata fetch timed out');
                    if (self.pendingReject === reject) {
                        self.isStarting = false;
                        self.activeMagnet = null;
                        self.activePromise = null;
                        reject(new Error('Torrent metadata fetch timeout (300s)'));
                    }
                }, 300000);

                const handleTorrent = async (torrent) => {
                    try {
                        if (self.metadataTimeout) {
                            clearTimeout(self.metadataTimeout);
                            self.metadataTimeout = null;
                        }
                        self.pendingReject = null;

                        if (!self.isStarting || self.activeInfoHash !== targetInfoHash) {
                            console.warn("⚠️ Torrent added but stream was cancelled/stopped. Destroying...");
                            try { torrent.destroy(); } catch (e) {}
                            return;
                        }

                        self.activeTorrent = torrent;
                        console.log('Torrent Metadata Fetched:', torrent.name);

                        // P0: Polling Loop for file discovery
                        // Sometimes the metadata event fires but the file list is still being mapped
                        let pollAttempts = 0;
                        while (torrent.files.length === 0 && pollAttempts < 30) {
                            console.log(`[TorrentService] Metadata ready but files empty. Polling... (${pollAttempts + 1}/30)`);
                            await new Promise(r => setTimeout(r, 500));
                            pollAttempts++;
                        }

                        const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov'];
                        
                        console.log(`[TorrentService] handleTorrent processing: ${torrent.name} (Files: ${torrent.files.length})`);
                        let file = null;

                        // If fileIndex is explicitly provided, use it
                        if (fileIndex !== null && torrent.files[fileIndex]) {
                            console.log(`[TorrentService] Using explicit file index: ${fileIndex} (${torrent.files[fileIndex].name})`);
                            file = torrent.files[fileIndex];
                        } else {
                            // Find the BEST video file (Largest one is usually the main feature)
                            const videoFiles = torrent.files.filter(f => videoExtensions.some(ext => f.name.endsWith(ext)));

                            if (videoFiles.length > 0) {
                                // Pick the largest file as it's almost certainly the movie/episode
                                file = videoFiles.reduce((a, b) => a.length > b.length ? a : b);
                            } else if (torrent.files.length > 0) {
                                // Fallback to absolute largest file if no extension match
                                file = torrent.files.reduce((a, b) => a.length > b.length ? a : b);
                            }

                            // P0: Prefer MP4 over MKV if they are of similar size (within 10%)
                            const mp4Files = videoFiles.filter(f => f.name.toLowerCase().endsWith('.mp4'));
                            if (mp4Files.length > 0 && file && !file.name.toLowerCase().endsWith('.mp4')) {
                                const largestMp4 = mp4Files.reduce((a, b) => a.length > b.length ? a : b);
                                if (largestMp4.length > file.length * 0.9) {
                                    console.log('[TorrentService] Choosing slightly smaller MP4 over MKV for native compatibility');
                                    file = largestMp4;
                                }
                            }

                            // Attempt to match requested episode if it's a multi-file torrent
                            if (episodeHint !== null) {
                                const epPattern = new RegExp(`[eE]0?${episodeHint}\\b`);
                                const seasonPattern = seasonHint !== null ? new RegExp(`[sS]0?${seasonHint}\\b`) : null;
                                
                                const matchedFile = torrent.files.find(f => {
                                    const name = f.name.toLowerCase();
                                    const isEp = epPattern.test(name);
                                    const isSeason = seasonPattern ? seasonPattern.test(name) : true;
                                    return isEp && isSeason && videoExtensions.some(ext => name.endsWith(ext));
                                });

                                if (matchedFile) {
                                    console.log(`[TorrentService] Found exact match for S${seasonHint}E${episodeHint}:`, matchedFile.name);
                                    file = matchedFile;
                                } else {
                                    console.log(`[TorrentService] No exact match for S${seasonHint}E${episodeHint}, sticking with largest file.`);
                                }
                            }
                        }

                        if (!file) {
                            return reject(new Error("No playable video files found in this torrent."));
                        }

                        file.select(); // Prioritize this file

                        // Create Server
                        self.server = torrent.createServer();
                        
                        console.log('[TorrentService] Starting internal WebTorrent server...');
                        self.server.listen(0, async () => {
                            const address = self.server.address();
                            const port = address.port;
                            console.log(`[TorrentService] Internal server listening on: 127.0.0.1:${port}`);
                            const fileIdx = torrent.files.indexOf(file);
                            const mp4Url = `http://127.0.0.1:${port}/${fileIdx}`;
                            console.log(`[TorrentService] Generated internal MP4 URL: ${mp4Url}`);

                            // Scan for subtitles
                            const subtitles = [];
                            const subExtensions = ['.srt', '.vtt', '.ass'];
                            torrent.files.forEach((f, idx) => {
                                if (subExtensions.some(ext => f.name.endsWith(ext))) {
                                    subtitles.push({
                                        label: f.name,
                                        language: f.name.toLowerCase().includes('eng') ? 'en' : 'unknown',
                                        url: `http://127.0.0.1:${port}/${idx}`
                                    });
                                }
                            });

                            let audioTracks = [];
                            let probedMetadata = null;

                            if (videoMetadataService) {
                                try {
                                    console.log(`[TorrentService] Probing stream metadata: ${mp4Url}`);
                                    probedMetadata = await videoMetadataService.getMetadata(mp4Url);
                                    audioTracks = probedMetadata.audioTracks || [];
                                    console.log(`[TorrentService] Probed Codec: ${probedMetadata.codec}, Tracks: ${audioTracks.length}`);
                                } catch (e) {
                                    console.warn('[TorrentService] Probe failed, falling back to filename heuristics:', e.message);
                                    const metadata = videoMetadataService.extractFromFilename(file.name);
                                    audioTracks = metadata.audioTracks;
                                }
                            }

                            const isMkv = file.name.toLowerCase().endsWith('.mkv');
                            const isHevcFilename = file.name.toLowerCase().match(/(x265|h265|h\.265|hevc|av1|10bit|10-bit|2160p|4k|truehd|dts|hdr|dv|dolby|remux)/i);
                            const isHevcCodec = probedMetadata && (probedMetadata.codec === 'hevc' || probedMetadata.codec === 'av1' || probedMetadata.codec === 'h265');
                            
                            const needsTranscode = isMkv || isHevcFilename || isHevcCodec;
                            let finalUrl = mp4Url;

                            if (needsTranscode) {
                                try {
                                    console.log(`[TorrentService] Transcoding required (MKV: ${isMkv}, HEVC_Name: ${!!isHevcFilename}, HEVC_Codec: ${!!isHevcCodec})`);
                                    finalUrl = await self.startTranscodeServer(torrent.infoHash, file, audioTrackIndex, probedMetadata);
                                } catch (err) {
                                    console.error('[TorrentService] ❌ Failed to start transcoder:', err);
                                    finalUrl = mp4Url; 
                                }
                            }

                            resolve({
                                success: true,
                                url: finalUrl,
                                filename: file.name,
                                subtitles,
                                audioTracks
                            });
                        });

                        torrent.on('error', (err) => {
                            console.error('Torrent Instance Error:', err);
                            reject(err);
                        });
                    } catch (err) {
                        console.error('Fatal error in torrent stream initialization:', err);
                        reject(err);
                    }
                };

                // Defensive check: If torrent already exists in client, use it instead of adding duplicate
                const existingTorrent = self.client.get(magnetLink);
                if (existingTorrent) {
                    console.log('[TorrentService] Reusing existing torrent instance in client.');
                    if (existingTorrent.metadata || (existingTorrent.files && existingTorrent.files.length > 0)) {
                        handleTorrent(existingTorrent);
                    } else {
                        console.log('[TorrentService] Existing torrent found but metadata not yet ready. Waiting...');
                        existingTorrent.once('metadata', () => {
                            console.log('[TorrentService] Metadata finally fetched for existing torrent.');
                            handleTorrent(existingTorrent);
                        });
                    }
                } else {
                    self.client.add(magnetLink, handleTorrent);
                }

                // Handle client global errors as fallback
                const onError = (err) => {
                    console.error('WebTorrent Client Error:', err);
                    if (self.metadataTimeout) {
                        clearTimeout(self.metadataTimeout);
                        self.metadataTimeout = null;
                    }
                    reject(err);
                };
                self.client.once('error', onError);
            });


            const result = await streamPromise;
            this.isStarting = false;
            return result;
        } catch (e) {
            // Only clear state if this is still the active attempt for this magnet
            if (this.activeMagnet === magnetLink) {
                this.isStarting = false;
                this.activeMagnet = null;
                this.activePromise = null;
            }
            throw e;
        }
    }

    async stopStream(destroyStore = false) {
        // Prevent rapid stop/start cycles
        const now = Date.now();
        if (this.lastStartTime && (now - this.lastStartTime < this.STOP_COOLDOWN)) {
            console.log(`[TorrentService] stopStream deferred - within grace period.`);
            
            if (this.scheduledStop) return; // Already scheduled
            
            this.scheduledStop = setTimeout(() => {
                console.log('[TorrentService] Executing deferred stop...');
                this.scheduledStop = null;
                this._executeStop(destroyStore);
            }, this.STOP_COOLDOWN - (now - this.lastStartTime));
            
            return;
        }

        await this._executeStop(destroyStore);
    }

    async _executeStop(destroyStore = false, targetInfoHash = null) {
        // If a specific hash is provided (for deferred cleanup), ensure it still matches
        if (targetInfoHash && this.activeInfoHash !== targetInfoHash) {
            console.log(`[TorrentService] Deferred stop ignored: active magnet has changed.`);
            return;
        }

        this.isStarting = false;
        this.activeMagnet = null;
        this.activeInfoHash = null;
        this.activePromise = null;

        if (this.metadataTimeout) {
            clearTimeout(this.metadataTimeout);
            this.metadataTimeout = null;
        }

        if (this.pendingReject) {
            this.pendingReject(new Error('Stream stopped or superseded'));
            this.pendingReject = null;
        }

        await this._internalStop(destroyStore);
        console.log('Torrent Stream Stopped (Files Persisted)');
    }

    async _supersedePrevious() {
        if (this.pendingReject) {
            this.pendingReject(new Error("Stream stopped or superseded"));
            this.pendingReject = null;
        }
        if (this.metadataTimeout) {
            clearTimeout(this.metadataTimeout);
            this.metadataTimeout = null;
        }
        await this._internalStop();
    }

    /**
     * Internal stop for switching magnets without resetting isStarting lock
     */
    async _internalStop(destroyStore = false) {
        const promises = [];
        if (this.server) {
            const server = this.server;
            promises.push(new Promise(resolve => server.close(resolve)));
            this.server = null;
        }
        if (this.activeTorrent) {
            const torrent = this.activeTorrent;
            promises.push(new Promise(resolve => torrent.destroy({ destroyStore }, resolve)));
            this.activeTorrent = null;
        }
        if (this.activeFfmpeg) {
            try { this.activeFfmpeg.kill('SIGKILL'); } catch (e) {}
            this.activeFfmpeg = null;
        }
        if (this.transcodeServer) {
            const transcodeServer = this.transcodeServer;
            promises.push(new Promise(resolve => transcodeServer.close(resolve)));
            this.transcodeServer = null;
        }

        // Nuclear option: Clean up ANY other torrents in the client
        if (this.client && this.client.torrents.length > 0) {
            console.log(`Cleaning up ${this.client.torrents.length} orphaned torrents...`);
            this.client.torrents.forEach(t => {
                promises.push(new Promise(resolve => t.destroy({ destroyStore: false }, resolve)));
            });
        }

        if (promises.length > 0) await Promise.all(promises);
    }

    _appendTrackers(magnet) {
        if (!magnet || !magnet.startsWith('magnet:')) return magnet;
        let updatedMagnet = magnet;
        TRACKERS.forEach(tr => {
            if (!updatedMagnet.includes(encodeURIComponent(tr))) {
                updatedMagnet += `&tr=${encodeURIComponent(tr)}`;
            }
        });
        return updatedMagnet;
    }

    async startTranscodeServer(infoHash, file, audioTrackIndex = 0, probedMetadata = null) {
        if (this.activeServers.has(infoHash)) {
            const existingPort = this.activeServers.get(infoHash).address().port;
            console.log(`[TranscodeServer] Reusing existing server for ${infoHash} on port ${existingPort}`);
            return `http://127.0.0.1:${existingPort}/stream.mp4`;
        }

        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                const requestId = Math.random().toString(36).substring(7);
                console.log(`[Transcode][${requestId}] Request: ${req.method} ${req.url}`);

                // Handle CORS preflight
                if (req.method === 'OPTIONS') {
                    res.writeHead(204, {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                        'Access-Control-Allow-Headers': '*'
                    });
                    return res.end();
                }

                // Handle HEAD requests (Browsers often send these to probe the stream)
                if (req.method === 'HEAD') {
                    res.writeHead(200, {
                        'Content-Type': 'video/mp4',
                        'Access-Control-Allow-Origin': '*',
                        'Accept-Ranges': 'none',
                        'Connection': 'keep-alive'
                    });
                    return res.end();
                }

                console.log(`[Transcode][${requestId}] Headers:`, JSON.stringify(req.headers));

                let isClosed = false;
                const stream = file.createReadStream();
                const isHevcFilename = file.name.toLowerCase().match(/(x265|h265|h\.265|hevc|av1|10bit|10-bit|2160p|4k)/i);
                const isHevcCodec = probedMetadata?.codec === 'hevc' || probedMetadata?.codec === 'av1';
                const isMkv = file.name.toLowerCase().endsWith('.mkv');
                const isTrueHD = probedMetadata?.audioTracks?.some(t => t.codec?.toLowerCase().includes('truehd'));
                const shouldForceTranscode = isMkv || !!isHevcFilename || isHevcCodec || isTrueHD;
                const command = ffmpeg(stream);

                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Access-Control-Allow-Origin': '*',
                    'Connection': 'keep-alive',
                    'Accept-Ranges': 'none'
                });

                const outputOptions = [
                    '-movflags frag_keyframe+empty_moov+default_base_moof',
                    '-c:a aac',
                    '-b:a 192k',
                    '-f mp4',
                    '-map 0:v:0',
                    `-map 0:a:${audioTrackIndex}`
                ];

                if (shouldForceTranscode) {
                    console.log(`[Transcode][${requestId}] Force Transcode Reason: MKV:${isMkv}, HEVC_File:${!!isHevcFilename}, HEVC_Codec:${isHevcCodec}, TrueHD:${isTrueHD}`);
                    outputOptions.push(
                        '-c:v libx264', 
                        '-pix_fmt yuv420p', 
                        '-preset ultrafast', 
                        '-tune zerolatency,fastdecode', 
                        '-crf 24',
                        '-profile:v main',
                        '-level 4.0'
                    );
                } else {
                    console.log(`[Transcode][${requestId}] Direct stream copy for container shift`);
                    outputOptions.push('-c:v copy');
                }

                command.outputOptions(outputOptions)
                    .on('start', (commandLine) => { 
                        console.log(`[Transcode][${requestId}] FFmpeg started: ${commandLine}`);
                    })
                    .on('progress', (progress) => {
                        if (Math.floor(progress.percent || 0) % 20 === 0) {
                            console.log(`[Transcode][${requestId}] Progress: ${progress.percent}%`);
                        }
                    })
                    .on('error', (err) => { 
                        if (!isClosed) {
                            console.error(`[Transcode][${requestId}] FFmpeg Error:`, err.message);
                        }
                    })
                    .pipe(res, { end: true });

                req.on('close', () => {
                    isClosed = true;
                    try { 
                        console.log(`[Transcode][${requestId}] Aborting transcode pipe...`);
                        command.kill('SIGKILL');
                        stream.destroy();
                    } catch (e) {}
                });
            });

            server.listen(0, '127.0.0.1', () => {
                const port = server.address().port;
                this.activeServers.set(infoHash, server);
                const url = `http://127.0.0.1:${port}/stream.mp4`;
                console.log(`[TranscodeServer] Multi-track server listening: ${url}`);
                resolve(url);
            });

            server.on('error', (err) => {
                console.error('[TranscodeServer] ❌ Critical failure:', err);
                reject(err);
            });
        });
    }

    async cleanupCache() {
        if (!this.config.path) return;
        const fs = require('fs');
        const fsPromises = fs.promises;
        try {
            const files = await fsPromises.readdir(this.config.path);
            let totalSize = 0;
            const fileStats = [];
            for (const file of files) {
                const filePath = path.join(this.config.path, file);
                try {
                    const stats = await fsPromises.stat(filePath);
                    totalSize += stats.size;
                    fileStats.push({ path: filePath, size: stats.size, mtime: stats.mtime });
                } catch (e) {}
            }
            if (totalSize > this.config.maxCacheSize) {
                fileStats.sort((a, b) => a.mtime - b.mtime);
                let purgedSize = 0;
                const targetPurge = totalSize - (this.config.maxCacheSize * 0.8);
                for (const file of fileStats) {
                    if (purgedSize >= targetPurge) break;
                    try {
                        const stats = await fsPromises.stat(file.path);
                        if (stats.isDirectory()) await fsPromises.rm(file.path, { recursive: true, force: true });
                        else await fsPromises.unlink(file.path);
                        purgedSize += file.size;
                    } catch (e) {}
                }
            }
        } catch (err) { console.error('[Torrent Cache Cleanup Error]:', err); }
    }

    getStats() {
        if (!this.activeTorrent) return null;
        return {
            progress: this.activeTorrent.progress,
            downloadSpeed: this.activeTorrent.downloadSpeed,
            uploadSpeed: this.activeTorrent.uploadSpeed,
            peers: this.activeTorrent.numPeers,
            timeRemaining: this.activeTorrent.timeRemaining
        };
    }

    async getTorrentMetadata(magnetUri) {
        this.initClient();
        if (!this.client) throw new Error("WebTorrent engine not available.");
        const infoHash = this._getInfoHash(magnetUri);

        return new Promise((resolve, reject) => {
            if (this.activeInfoHash === infoHash && this.activeTorrent) {
                return resolve({
                    name: this.activeTorrent.name,
                    infoHash: this.activeTorrent.infoHash,
                    files: this.activeTorrent.files.map((f, idx) => ({ name: f.name, length: f.length, index: idx }))
                });
            }

            const timeout = setTimeout(() => { reject(new Error('Metadata fetch timeout')); }, 30000);
            const existing = this.client.get(infoHash);
            if (existing) {
                clearTimeout(timeout);
                return resolve({
                    name: existing.name,
                    infoHash: existing.infoHash,
                    files: existing.files.map((f, idx) => ({ name: f.name, length: f.length, index: idx }))
                });
            }

            this.client.add(magnetUri, (torrent) => {
                clearTimeout(timeout);
                resolve({
                    name: torrent.name,
                    infoHash: torrent.infoHash,
                    files: torrent.files.map((f, idx) => ({ name: f.name, length: f.length, index: idx }))
                });
            });
        });
    }
}


module.exports = new TorrentService();
