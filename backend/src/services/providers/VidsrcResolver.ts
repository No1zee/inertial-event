import axios from 'axios';

export interface ISourceResult {
    url: string;
    isM3U8: boolean;
    quality?: string;
}

export interface ISubtitleResult {
    url: string;
    lang: string;
    label?: string;
}

export interface IResolveResult {
    sources: ISourceResult[];
    subtitles: ISubtitleResult[];
}

export class VidsrcResolver {
    private static MIRRORS = [
        'https://vidsrc.xyz',
        'https://vidsrc.to',
        'https://vidsrc.me',
        'https://vidsrc.cc'
    ];

    /**
     * Resolves direct HLS links from various Vidsrc mirrors using a greedy pattern-match approach.
     */
    static async resolve(id: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<IResolveResult> {
        const sources: ISourceResult[] = [];
        const subtitles: ISubtitleResult[] = [];

        try {
            console.log(`[VidsrcResolver] Attempting resolution for ${type}/${id}`);

            // Parallel attempt across top mirrors
            const mirrorPromises = this.MIRRORS.map(async (mirror) => {
                try {
                    // 1. Generate Mirror-Specific URLs
                    let embedUrl = '';
                    if (mirror.includes('vidsrc.me') || mirror.includes('vidsrc.to') || mirror.includes('vidsrc.cc')) {
                        // Path-based: /embed/movie/ID or /v2/embed/movie/ID
                        const prefix = mirror.includes('vidsrc.cc') ? '/v2/embed' : '/embed';
                        embedUrl = type === 'movie'
                            ? `${mirror}${prefix}/movie/${id}`
                            : `${mirror}${prefix}/tv/${id}/${season}/${episode}`;
                    } else {
                        // Query-based: /embed/movie?tmdb=ID
                        embedUrl = type === 'movie'
                            ? `${mirror}/embed/movie?tmdb=${id}`
                            : `${mirror}/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
                    }
                    
                    console.log(`[VidsrcResolver] Scraping Mirror: ${embedUrl}`);
                    
                    const response = await axios.get(embedUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': mirror
                        },
                        timeout: 8000
                    });

                    const html = response.data as string;
                    
                    // 1. Direct Pattern Match (M3U8/MP4)
                    const streamMatches = html.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/gi);
                    if (streamMatches) {
                        console.log(`[VidsrcResolver] Found ${streamMatches.length} raw streams on ${mirror}`);
                        streamMatches.forEach(url => {
                            if (!/adsystem|pixel|analytics|doubleclick|google-analytics|cdn-cgi/i.test(url)) {
                                sources.push({
                                    url: url,
                                    isM3U8: url.includes('.m3u8'),
                                    quality: url.includes('1080') ? '1080p' : 'auto'
                                });
                            }
                        });
                    }

                    // 2. Base64 Obfuscation Match
                    // Many mirrors hide the JSON source in a base64 string inside a script tag
                    const b64Matches = html.match(/["']([A-Za-z0-9+/=]{50,})["']/g);
                    if (b64Matches) {
                        b64Matches.forEach(match => {
                            try {
                                const clean = match.slice(1, -1);
                                const decoded = Buffer.from(clean, 'base64').toString();
                                if (decoded.includes('.m3u8')) {
                                    const m3u8Match = decoded.match(/https?:\/\/[^"']+\.m3u8[^"']*/i);
                                    if (m3u8Match) {
                                        console.log(`[VidsrcResolver] Extracted from Base64 on ${mirror}: ${m3u8Match[0]}`);
                                        sources.push({ url: m3u8Match[0], isM3U8: true, quality: 'auto' });
                                    }
                                }
                            } catch (e) {}
                        });
                    }

                    // 3. Fallback for vsource/file hints
                    const hints = html.match(/(?:file|vsource|url)\s*[:=]\s*["']([^"']+)["']/gi);
                    if (hints) {
                        hints.forEach(hint => {
                            const url = hint.match(/["']([^"']+)["']/)?.[1];
                            if (url && (url.includes('.m3u8') || url.includes('.mp4') || url.startsWith('//'))) {
                                const fullUrl = url.startsWith('//') ? `https:${url}` : url;
                                sources.push({ url: fullUrl, isM3U8: fullUrl.includes('.m3u8'), quality: 'auto' });
                            }
                        });
                    }

                    // Look for subtitle tracks
                    const subMatches = html.match(/\{"file":"(https?:\/\/[^"]+\.(?:vtt|srt))","label":"([^"]+)"\}/gi);
                    if (subMatches) {
                        subMatches.forEach(match => {
                            try {
                                const sub = JSON.parse(match);
                                subtitles.push({
                                    url: sub.file,
                                    lang: sub.label,
                                    label: sub.label
                                });
                            } catch (e) { /* ignore parse errors */ }
                        });
                    }
                } catch (err: any) {
                    console.warn(`[VidsrcResolver] Mirror ${mirror} failed: ${err.message}`);
                }
            });

            await Promise.all(mirrorPromises);

            return { sources, subtitles };
        } catch (error) {
            console.warn('[VidsrcResolver] Critical failure:', error);
            return { sources, subtitles };
        }
    }
}
