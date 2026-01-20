const WebTorrent = require('webtorrent');
const path = require('path');
const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// Verify ffmpeg path
console.log('[TorrentService] FFmpeg path set to:', ffmpegPath);

// Import VideoMetadataService for extracting track metadata from filenames

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
        this.client = WebTorrent ? new WebTorrent() : null;
        this.activeTorrent = null;
        this.server = null;
        this.metadataTimeout = null;
        this.isStarting = false; // P0: Lock to prevent race conditions
    }

    async startStream(magnetLink) {
        if (!this.client) throw new Error("WebTorrent engine not available.");

        // P0: Prevent duplicate starts
        if (this.isStarting) {
            console.warn("⚠️ Torrent stream start ignored - already starting another stream.");
            return Promise.reject(new Error("Stream initialization already in progress"));
        }

        try {
            // Cleanup existing
            await this.stopStream();
            
            // P0: Re-assert lock AFTER stopStream cleanup (which sets it to false)
            this.isStarting = true;

            return await new Promise((resolve, reject) => {
                console.log('Using WebTorrent to stream:', magnetLink);

                // Store the reject function so stopStream can cancel this promise if needed
                this.pendingReject = reject;

                this.metadataTimeout = setTimeout(() => {
                    console.log('Main: Torrent Start Error: Metadata fetch timed out');
                    if (this.pendingReject === reject) { // Only reject if this is still the active promise
                        reject(new Error('Torrent metadata fetch timeout (300s)'));
                        this.stopStream();
                    }
                }, 300000); // 5 minutes timeout

                this.client.add(magnetLink, (torrent) => {
                    // Clear timeout immediately upon metadata receipt
                    if (this.metadataTimeout) {
                        clearTimeout(this.metadataTimeout);
                        this.metadataTimeout = null;
                    }
                    this.pendingReject = null; // Clear pending reject as metadata is received

                    // Double check if we were stopped while adding
                    if (!this.isStarting) {
                        console.warn("⚠️ Torrent added but stream was cancelled/stopped. Destroying...");
                        torrent.destroy();
                        return;
                    }

                    this.activeTorrent = torrent;
                    console.log('Torrent Metadata Fetched:', torrent.name);
                    console.log('📂 Content:', torrent.files.map(f => f.name).join(', '));

                    // Find the BEST video file
                    const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov'];
                    const videoFiles = torrent.files.filter(f => videoExtensions.some(ext => f.name.endsWith(ext)));

                    let file = null;

                    // Simple selection strategy: Largest video file
                    // P0: Prefer MP4 over MKV because Electron/Chromium doesn't support MKV natively
                    const mp4Files = videoFiles.filter(f => f.name.toLowerCase().endsWith('.mp4'));
                    
                    if (mp4Files.length > 0) {
                        file = mp4Files.reduce((a, b) => a.length > b.length ? a : b);
                    } else if (videoFiles.length > 0) {
                        file = videoFiles.reduce((a, b) => a.length > b.length ? a : b);
                    } else if (torrent.files.length > 0) {
                        // Fallback to absolute largest file if no extension match
                        file = torrent.files.reduce((a, b) => a.length > b.length ? a : b);
                    }

                    // Error if no files found
                    if (!file) {
                        reject(new Error('No playable files found in torrent'));
                        this.stopStream();
                        return;
                    }

                    console.log('Selected File:', file.name);
                    file.select(); // Prioritize this file

                    // Create Server
                    this.server = torrent.createServer();
                    
                    console.log('Main: Starting internal WebTorrent server...');
                    this.server.listen(0, async () => { // Made async to await startTranscodeServer
                        console.log('Main: Internal server callback triggered');
                        const port = this.server.address().port;
                        // WebTorrent server creates routes based on file index
                        const fileIndex = torrent.files.indexOf(file);
                        const mp4Url = `http://localhost:${port}/${fileIndex}`;
                        console.log('Main: Native MP4 URL generated:', mp4Url);

                        console.log('Torrent Server Running:', mp4Url);

                        // Scan for subtitles
                        const subtitles = [];
                        const subExtensions = ['.srt', '.vtt', '.ass'];

                        torrent.files.forEach((f, idx) => {
                            if (subExtensions.some(ext => f.name.endsWith(ext))) {
                                subtitles.push({
                                    label: f.name,
                                    language: 'External',
                                    src: `http://localhost:${port}/${idx}`
                                });
                            }
                        });

                        // Extract audio/subtitle metadata from filename
                        let audioTracks = [];
                        if (videoMetadataService) {
                            console.log('Main: Extracting metadata...');
                            const metadata = videoMetadataService.extractFromFilename(file.name);
                            audioTracks = metadata.audioTracks;
                            console.log('📀 Extracted Audio Tracks from filename:', audioTracks);
                        }

                        // 4. Check if Transcoding is needed (MKV)
                        console.log('Main: Checking if transcoding needed for:', file.name);
                        const isMkv = file.name.toLowerCase().endsWith('.mkv');
                        let finalUrl = mp4Url;

                        if (isMkv) {
                            console.log('⚠️ MKV detected. Starting Transcode Server...');
                            try {
                                finalUrl = await this.startTranscodeServer(file);
                                console.log('✅ Transcode Server Ready:', finalUrl);
                            } catch (err) {
                                console.error('Failed to start transcoder:', err);
                                // Fallback to raw file (might fail but better than nothing)
                                finalUrl = mp4Url; 
                            }
                        } else {
                            console.log('✅ Native format detected. Streaming direct.');
                        }

                        resolve({
                            url: finalUrl,
                            filename: file.name
                            // infoHash: torrent.infoHash,
                            // subtitles, 
                            // audioTracks 
                        });
                    });

                    // Handle torrent specific errors (not just client global)
                    torrent.on('error', (err) => {
                        console.error('Torrent Instance Error:', err);
                        reject(err);
                    });
                });

                // Handle client global errors as fallback
                const onError = (err) => {
                    console.error('WebTorrent Client Error:', err);
                    if (this.metadataTimeout) {
                        clearTimeout(this.metadataTimeout);
                        this.metadataTimeout = null;
                    }
                    reject(err);
                };
                this.client.once('error', onError);
            });
        } catch (e) {
            this.isStarting = false;
            throw e;
        }
    }


    /**
     * Spawns a local HTTP server that transmuxes the file stream to fragmented MP4
     */
    startTranscodeServer(file) {
        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                console.log(`[Transcode] Request: ${req.url}`);
                console.log(`[Transcode] Headers:`, JSON.stringify(req.headers));
                
                // Set headers for MP4 streaming
                res.writeHead(200, {
                    'Content-Type': 'video/mp4',
                    'Access-Control-Allow-Origin': '*',
                    'Connection': 'keep-alive',
                    'Accept-Ranges': 'none' // Disable seeking to prevent restart-on-pause loops
                });

                // Create FFMPEG command
                // Input: Read stream from WebTorrent file
                const stream = file.createReadStream();

                // Check if file is HEVC/x265 (requires transcoding to h264 for Electron/Chromium)
                const isHevc = file.name.toLowerCase().match(/(x265|h265|hevc)/);
                
                // Prepare FFmpeg command
                const command = ffmpeg(stream);

                const outputOptions = [
                    '-movflags frag_keyframe+empty_moov', // Fragmented MP4 for streaming
                    '-c:a aac',                           // Convert audio to AAC
                    '-b:a 192k',
                    '-f mp4'
                ];

                if (isHevc) {
                    console.log(`[Transcode] HEVC/x265 detected (${file.name}). Transcoding to H.264 (CPU intensive)...`);
                    outputOptions.push('-c:v libx264');
                    outputOptions.push('-preset ultrafast'); // Critical for real-time
                    outputOptions.push('-tune zerolatency');
                    outputOptions.push('-crf 23');
                } else {
                    console.log(`[Transcode] Standard codec detected. Copying video stream...`);
                    outputOptions.push('-c:v copy'); // Fast copy for H.264
                }

                command
                    .outputOptions(outputOptions)
                    .on('start', (commandLine) => {
                        console.log('[Transcode] Spawned Ffmpeg with command: ' + commandLine);
                    })
                    .on('progress', (progress) => {
                       // Log progress every ~10% or just periodically to prove it's alive
                       // progress object usually has 'timemark' or 'percent'
                       // console.log(`[Transcode] Progress: ${progress.timemark}`);
                    }) 
                    .on('stderr', (stderrLine) => {
                        // Log first few lines of stderr to diagnose ffmpeg startup issues
                        if (!this._stderrLogCount) this._stderrLogCount = 0;
                        if (this._stderrLogCount < 10) {
                            console.log('[Transcode FFMPEG STDERR]: ' + stderrLine);
                            this._stderrLogCount++;
                        }
                    })
                    .on('error', (err, stdout, stderr) => {
                        if (err.message.includes('Output stream closed')) return;
                        console.error('[Transcode] Error:', err.message);
                    })
                    .pipe(res, { end: true });
            });

            // Listen on random port (all interfaces)
            server.listen(0, () => {
                const port = server.address().port;
                this.transcodeServer = server;
                // Return localhost URL which handles dual-stack better in Electron
                resolve(`http://localhost:${port}/stream.mp4`);
            });

            server.on('error', (err) => {
                reject(err);
            });
        });
    }

    async stopStream() {
        this.isStarting = false; // Force release lock
        if (this.metadataTimeout) {
            clearTimeout(this.metadataTimeout);
            this.metadataTimeout = null;
        }

        // Invalidate any pending promise from startStream
        if (this.pendingReject) {
            this.pendingReject(new Error('Stream stopped or superseded'));
            this.pendingReject = null;
        }

        const promises = [];

        if (this.server) {
            console.log('Stopping Torrent Server...');
            const server = this.server;
            promises.push(new Promise(resolve => server.close(resolve)));
            this.server = null;
        }

        if (this.activeTorrent) {
            console.log('Destroying Active Torrent...');
            const torrent = this.activeTorrent;
            promises.push(new Promise(resolve => torrent.destroy({ destroyStore: true }, resolve)));
            this.activeTorrent = null;
        }

        // Nuclear option: Clean up ANY other torrents in the client to be 100% sure
        if (this.client && this.client.torrents.length > 0) {
            console.log(`Cleaning up ${this.client.torrents.length} orphaned torrents...`);
            this.client.torrents.forEach(t => {
                promises.push(new Promise(resolve => t.destroy({ destroyStore: true }, resolve)));
            });
        }

        if (promises.length > 0) {
            await Promise.all(promises);
            console.log('Torrent Stream Cleanup Complete');
        }
    }

    getStats() {
        if (!this.activeTorrent) return null;
        return {
            progress: this.activeTorrent.progress,
            downloadSpeed: this.activeTorrent.downloadSpeed,
            uploadSpeed: this.activeTorrent.uploadSpeed,
            width: this.activeTorrent.downloaded,
            peers: this.activeTorrent.numPeers,
            timeRemaining: this.activeTorrent.timeRemaining
        };
    }
}


module.exports = new TorrentService();
