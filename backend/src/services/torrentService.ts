import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { IProviderResponse } from './providers/ProviderSchemas.js';
import { tmdbService } from './tmdbService.js';

class TorrentService {
    private client: any = null;
    private config = ProviderConfig.torrent;
    // Base URL for Torrentio (a public Stremio addon API)
    private readonly TORRENTIO_URL = 'https://torrentio.strem.fun/stream';
    
    // YTS Mirror List (Sequential fallback for DNS/ISP blocks)
    private readonly YTS_MIRRORS = [
        'https://yts.mx',
        'https://yts.rs',
        'https://yts.pm',
        'https://yts.lt',
        'https://yify-movies.net'
    ];

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
        // Try each mirror until one works
        for (const mirror of this.YTS_MIRRORS) {
            try {
                const url = `${mirror}/api/v2/list_movies.json?query_term=${imdbId}&limit=1`;
                this.log(`Querying YTS Mirror: ${url}`);
                
                const res = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    },
                    timeout: 4000 // Short timeout to rotate mirrors quickly
                });

                if (!res.data || !res.data.data || !res.data.data.movies) continue;

                const movie = res.data.data.movies[0];
                if (!movie || !movie.torrents) continue;

                this.log(`Successfully fetched from YTS mirror: ${mirror}`);

                return movie.torrents.map((t: any) => {
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
            } catch (error: any) {
                this.log(`YTS Mirror failed (${mirror}): ${error.code || error.message}`);
                // Continue to next mirror
            }
        }
        
        this.log('All YTS mirrors failed or returned no results.');
        return [];
    }

    // MAIN METHOD: Scrape sources
    async getSources(
        tmdbId: string, 
        episodeNumber: number, 
        seasonNumber: number, 
        type: 'movie' | 'tv' | 'anime' | 'series'
    ): Promise<IProviderResponse | null> {
        this.log(`START getSources: ${tmdbId} (${type})`);
        
        if (!this.config.enabled) {
            this.log('Torrent provider disabled in config.');
            return null;
        }

        try {
            console.log(`[TorrentService] Fetching sources for TMDB: ${tmdbId} (${type})`);

            // 1. Resolve IMDB ID (Required for Torrentio & YTS)
            const mappedType: 'movie' | 'tv' = (type === 'tv' || type === 'anime' || type === 'series') ? 'tv' : 'movie';
            const imdbId = await tmdbService.getExternalIds(tmdbId, mappedType);
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
                        title: stream.title, // Critical: Include title for tier classification
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

            // 4. Heuristic Tier Classification (for sorting, NOT dropping)
            // Torrentio titles often lack file extensions/codecs, so we keep everything
            // and sort by preference tier instead of filtering.
            const getTier = (source: any) => {
                const title = (source.title || '').toLowerCase();
                const url = (source.url || '').toLowerCase();
                const isYts = source.provider === 'YTS';
                
                // Tier 1: Native MP4 (Perfect Playback)
                if (isYts) return 1;
                if (title.includes('.mp4') || url.includes('.mp4')) return 1;

                // Tier 3: High Fidelity (HEVC/HDR/4K)
                // We check this BEFORE Tier 2 to ensure 4K MKVs aren't caught by the generic MKV check
                if (
                    title.includes('uhd') ||
                    title.includes('10bit') ||
                    title.includes('dv') ||
                    title.includes('dovi') ||
                    title.includes('remux') ||
                    title.includes('vpp')
                ) return 3;

                // Tier 2: Standard compatible (MKV h264, or any HD)
                const isHD = title.includes('1080p') || title.includes('720p') || title.includes('480p') || title.includes('hd') || title.includes('high.definition');
                const isH264 = title.includes('x264') || title.includes('h264') || title.includes('avc');
                const isWeb = title.includes('web-dl') || title.includes('webrip') || title.includes('web.dl');
                const isBluray = title.includes('bluray') || title.includes('brrip') || title.includes('bdrip');

                if ((title.includes('.mkv') || url.includes('.mkv')) && isH264) return 2;
                if (!title.includes('hevc') && !title.includes('x265') && !title.includes('hdr') && (title.includes('.mkv') || url.includes('.mkv'))) return 2;
                if (isHD || isWeb || isBluray) return 2;

                // Tier 4: Unknown — still keep them, just sort them last
                return 4;
            };

            // VISUALIZATION LOGIC
            const tiers: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
            sources.forEach(s => {
                const t = getTier(s);
                tiers[t] = (tiers[t] || 0) + 1;
            });

            this.log(`\n=== SOURCE ANALYSIS FOR "${tmdbId}" ===`);
            this.log(`Total Raw Sources: ${sources.length}`);
            this.log(`Tier 1 (Native MP4/YTS): ${tiers[1]}`);
            this.log(`Tier 2 (MKV x264/HD):    ${tiers[2]}`);
            this.log(`Tier 3 (HEVC/HDR/4K):    ${tiers[3]}`);
            this.log(`Tier 4 (Unknown):        ${tiers[4]}`);
            
            if (tiers[4] > 0) {
                this.log('--- Tier 4 Details (Heuristic Fallback) ---');
                sources.filter(s => getTier(s) === 4).forEach((s, i) => {
                    this.log(`[${i+1}] Title: ${s.title || 'No Title'} | Provider: ${s.provider}`);
                });
            }
            
            // Sort by tier (best first), then by seeders within each tier
            sources.sort((a, b) => {
                const tierDiff = getTier(a) - getTier(b);
                if (tierDiff !== 0) return tierDiff;
                const seedsA = parseInt(a.seeders) || 0;
                const seedsB = parseInt(b.seeders) || 0;
                return seedsB - seedsA;
            });
            
            this.log(`FINAL Return Count: ${sources.length}`);
            this.log(`==========================================\n`);

            return {
                sources: sources,
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
