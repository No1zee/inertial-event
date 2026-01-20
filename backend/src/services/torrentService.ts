import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { IProviderResponse } from './providers/ProviderSchemas.js';
import { tmdbService } from './tmdbService.js';

class TorrentService {
    private client: any = null;
    private config = ProviderConfig.torrent;
    // Base URL for Torrentio (a public Stremio addon API)
    private readonly TORRENTIO_URL = 'https://torrentio.strem.fun/stream';
    // Base URL for YTS
    private readonly YTS_API_URL = 'https://yts.mx/api/v2/list_movies.json';

    // Debug Helper (Safely logs to stdout in serverless)
    private log(msg: string) {
        if (process.env.DEBUG_TORRENTS || process.env.NODE_ENV !== 'production') {
            console.log(`[TorrentService] ${msg}`);
        }
    }

    // Helper to initialize WebTorrent client (only if needed for local streaming features later)
    private async getClient() {
        if (!this.client) {
            try {
                const { default: WebTorrent } = await import('webtorrent');
                this.client = new WebTorrent();
            } catch (err) {
                console.warn('Failed to initialize WebTorrent client:', err);
                return null;
            }
        }
        return this.client;
    }

    // Helper: Fetch from YTS (Movies Only)
    private async fetchYTSTorrents(imdbId: string): Promise<any[]> {
        try {
            // YTS uses IMDB ID for precise filtering
            // usage: ?query_term=<imdb_id>
            const url = `${this.YTS_API_URL}?query_term=${imdbId}&limit=1`;
            console.log(`[TorrentService] Querying YTS: ${url}`);
            
            const res = await axios.get(url);
            if (!res.data || !res.data.data || !res.data.data.movies) return [];

            const movie = res.data.data.movies[0];
            if (!movie || !movie.torrents) return [];

            return movie.torrents.map((t: any) => {
                // Construct magnet link from hash (more reliable/blocking-resistant than .torrent file URL)
                const trackers = [
                    'udp://open.demonii.com:1337/announce',
                    'udp://tracker.openbittorrent.com:80',
                    'udp://tracker.coppersurfer.tk:6969',
                    'udp://glotorrents.pw:6969/announce',
                    'udp://tracker.opentrackr.org:1337/announce',
                    'udp://torrent.gresille.org:80/announce',
                    'udp://p4p.arenabg.com:1337',
                    'udp://tracker.leechers-paradise.org:6969'
                ];
                const trackerStr = trackers.map(tr => `&tr=${encodeURIComponent(tr)}`).join('');
                const magnetUri = `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(movie.title)}${trackerStr}`;

                return {
                    url: magnetUri,
                    quality: t.quality,
                    type: 'torrent',
                    provider: 'YTS',
                    size: t.size,
                    seeders: t.seeds,
                    peers: t.peers,
                    infoHash: t.hash
                };
            });
        } catch (error) {
            console.warn('[TorrentService] YTS Fetch Error:', error);
            return [];
        }
    }

    // MAIN METHOD: Scrape sources
    async getSources(
        tmdbId: string, 
        episodeNumber: number, 
        seasonNumber: number, 
        type: 'movie' | 'tv'
    ): Promise<IProviderResponse | null> {
        this.log(`START getSources: ${tmdbId} (${type})`);
        
        if (!this.config.enabled) {
            this.log('Torrent provider disabled in config.');
            return null;
        }

        try {
            console.log(`[TorrentService] Fetching sources for TMDB: ${tmdbId} (${type})`);

            // 1. Resolve IMDB ID (Required for Torrentio & YTS)
            const imdbId = await tmdbService.getExternalIds(tmdbId, type);
            this.log(`Resolved IMDB ID: ${imdbId}`);
            
            if (!imdbId) {
                console.warn(`[TorrentService] No IMDB ID found for ${tmdbId}. Skipping.`);
                this.log('ABORT: No IMDB ID found.');
                return null;
            }

            const sources: any[] = [];

            // 2. Fetch YTS (Movies Only) - High Priority
            if (type === 'movie') {
                try {
                    const ytsSources = await this.fetchYTSTorrents(imdbId);
                    this.log(`YTS found: ${ytsSources.length}`);
                    sources.push(...ytsSources);
                } catch (e: any) {
                    this.log(`YTS Error: ${e.message}`);
                }
            }

            // 3. Fetch Torrentio (Movies & TV)
            // Movie: /stream/movie/{imdbId}.json
            // TV: /stream/series/{imdbId}:{season}:{episode}.json
            let endpoint = '';
            if (type === 'movie') {
                endpoint = `${this.TORRENTIO_URL}/movie/${imdbId}.json`;
            } else {
                endpoint = `${this.TORRENTIO_URL}/series/${imdbId}:${seasonNumber}:${episodeNumber}.json`;
            }

            console.log(`[TorrentService] Querying Torrentio: ${endpoint}`);
            this.log(`Querying Torrentio: ${endpoint}`);
            
            try {
                const response = await axios.get(endpoint);
                const streams = response.data.streams || [];
                console.log(`[TorrentService] Found ${streams.length} Torrentio streams.`);
                this.log(`Torrentio streams raw: ${streams.length}`);

                const torrentioSources = streams.map((stream: any) => {
                    const qualityMatch = stream.title.match(/4k|2160p|1080p|720p|480p/i);
                    const quality = qualityMatch ? qualityMatch[0].toLowerCase() : 'unknown';
                    
                    let magnetUri = '';
                    if (stream.infoHash) {
                        magnetUri = `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodeURIComponent(stream.title || 'video')}`;
                    } else if (stream.url && stream.url.startsWith('magnet:')) {
                        magnetUri = stream.url;
                    }

                    if (!magnetUri) return null;

                    return {
                        url: magnetUri,
                        quality: quality,
                        type: 'torrent',
                        provider: 'Torrentio',
                        // Metadata for UI
                        size: stream.title.match(/[\d\.]+(GB|MB)/)?.[0] || '',
                        seeders: stream.title.match(/👤 (\d+)/)?.[1] || '0' // Torrentio specific parsing
                    };
                }).filter((s: any) => s !== null);
                
                this.log(`Torrentio streams parsed: ${torrentioSources.length}`);
                sources.push(...torrentioSources);

            } catch (err: any) {
                 console.warn('[TorrentService] Torrentio Fetch Error:', err);
                 this.log(`Torrentio Error: ${err.message}`);
            }

            // 4. Strict Filtering (Tier 1 Only - MP4/YTS)
            // User requested to ONLY keep native formats to ensure perfect seeking.
            const getTier = (source: any) => {
                const title = (source.title || '').toLowerCase();
                const isYts = source.provider === 'YTS';
                
                // Tier 1: Native MP4 (Perfect Playback)
                if (isYts) return 1;
                if (title.includes('.mp4')) return 1;

                // Tier 2: Transmux (MKV h264 - Fast, no seek)
                if (title.includes('.mkv') && (title.includes('x264') || title.includes('h264'))) return 2;
                if (!title.includes('hevc') && !title.includes('x265') && !title.includes('hdr') && title.includes('.mkv')) return 2;

                // Tier 3: Heavy Transcode (HEVC/HDR)
                if (title.includes('x265') || title.includes('hevc') || title.includes('hdr')) return 3;

                return 4; // Unknown/Other
            };

            // VISUALIZATION LOGIC
            const tiers = { 1: 0, 2: 0, 3: 0, 4: 0 };
            sources.forEach(s => {
                const t = getTier(s);
                if (tiers[t] !== undefined) tiers[t]++;
            });

            this.log(`\n=== SOURCE ANALYSIS FOR "${tmdbId}" ===`);
            this.log(`Total Raw Sources: ${sources.length}`);
            this.log(`Tier 1 (Native MP4/YTS): ${tiers[1]} (Permitted)`);
            this.log(`Tier 2 (MKV x264):       ${tiers[2]} (DROPPED - No Seek)`);
            this.log(`Tier 3 (HEVC/HDR):       ${tiers[3]} (DROPPED - Transcode)`);
            this.log(`Tier 4 (Other):          ${tiers[4]} (DROPPED)`);
            
            // If we have 0 Tier 1s, we should PROBABLY fallback or at least warn loudly
            let tier1Sources = sources.filter(s => getTier(s) === 1);

            if (tier1Sources.length === 0 && tiers[2] > 0) {
                 this.log(`⚠️ WARNING: No Tier 1 sources found! Strict Mode is effectively blocking playback.`);
                 this.log(`   (YTS might be blocked or down, check earlier logs)`);
            }

            this.log(`Filtered Count (Tier 1 Only): ${tier1Sources.length}`);
            this.log(`==========================================\n`);

            // 5. Final Sort (Just Seeders, since all are Tier 1)
            tier1Sources.sort((a, b) => {
                const seedsA = parseInt(a.seeders) || 0;
                const seedsB = parseInt(b.seeders) || 0;
                return seedsB - seedsA;
            });
            
            this.log(`FINAL Return Count: ${tier1Sources.length}`);

            return {
                sources: tier1Sources,
                subtitles: []
            };

        } catch (error: any) {
            console.error(`[TorrentService] Error fetching sources: ${error.message}`);
            this.log(`CRITICAL ERROR: ${error.message}`);
            return { sources: [], subtitles: [] };
        }
    }
}

const torrentService = new TorrentService();
export { torrentService };
