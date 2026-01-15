import { ProviderConfig } from '../config/ProviderConfig';
import { IProviderResponse } from './providers/ProviderSchemas';

class TorrentService {
    private client: any = null;
    private config = ProviderConfig.torrent;

    private async getClient() {
        if (!this.client) {
            try {
                // Dynamically import to prevent startup crashes if package is missing/incompatible
                // This bypasses strict ESM static analysis for webtorrent
                const { default: WebTorrent } = await import('webtorrent');
                this.client = new WebTorrent();
            } catch (err) {
                console.warn('Failed to initialize WebTorrent client:', err);
                return null;
            }
        }
        return this.client;
    }

    // New Hardened Method for SourceService integration
    async getSources(title: string, episodeNumber: number, seasonNumber?: number): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        // Torrents are complex; this is a placeholder for the actual search logic.
        // In a real app, this would query a torrent indexer API.
        // We return strict schema-compliant structures.
        return {
            sources: [],
            subtitles: []
        };
    }

    // Keep existing methods for IPC usage if needed, or deprecate/update them
    async addMagnet(magnet: string) {
        return new Promise(async (resolve, reject) => {
            const client = await this.getClient();
            if (!client) {
                return reject(new Error('Torrent client not initialized'));
            }

            client.add(magnet, (torrent: any) => {
                torrent.on('ready', () => {
                    const file = torrent.files.find((f: any) => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));
                    if (file) {
                        resolve({
                            name: file.name,
                            length: file.length,
                            path: file.path
                        });
                    } else {
                        reject(new Error('No video file found in torrent'));
                    }
                });
                torrent.on('error', (err: any) => reject(err));
            });
        });
    }

    async stopAll() {
        if (this.client) {
            return new Promise<void>((resolve) => {
                this.client?.destroy(() => {
                    this.client = null;
                    resolve();
                });
            });
        }
    }
}

export default new TorrentService();
