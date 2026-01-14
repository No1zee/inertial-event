/* eslint-disable @typescript-eslint/no-require-imports */
let WebTorrent;
try {
    WebTorrent = require('webtorrent');
} catch (e) {
    console.warn("⚠️ WebTorrent dependency not installed. Torrent features will be disabled.");
}

// Import VideoMetadataService for extracting track metadata from filenames
// Note: VideoMetadataService is in src/services, TorrentService is in root services/
const path = require('path');
let videoMetadataService;
try {
    // Try to load from compiled output or use direct path
    const servicePath = path.join(__dirname, '../src/services/VideoMetadataService');
    videoMetadataService = require(servicePath).videoMetadataService;
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

        this.isStarting = true;

        try {
            // Cleanup existing
            await this.stopStream();

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
                    if (videoFiles.length > 0) {
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
                    this.server.listen(0, () => {
                        const port = this.server.address().port;
                        // WebTorrent server creates routes based on file index
                        const fileIndex = torrent.files.indexOf(file);
                        const url = `http://localhost:${port}/${fileIndex}`;

                        console.log('Torrent Server Running:', url);

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
                            const metadata = videoMetadataService.extractFromFilename(file.name);
                            audioTracks = metadata.audioTracks;
                            console.log('📀 Extracted Audio Tracks from filename:', audioTracks);
                        }

                        resolve({
                            url,
                            filename: file.name,
                            infoHash: torrent.infoHash,
                            subtitles, // External subtitle files
                            audioTracks // Extracted from filename
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
