import axios from 'axios';
import { ISourceResult, ISubtitleResult, IResolveResult } from './VidsrcResolver.js';

export class EmbedSuResolver {
    private static MIRRORS = [
        'https://embed.su',
        'https://vidsrc.stream',
        'https://autoembed.cc'
    ];

    /**
     * Resolves direct HLS links from Embed.su.
     */
    static async resolve(tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<IResolveResult> {
        const sources: ISourceResult[] = [];
        const subtitles: ISubtitleResult[] = [];

        try {
            console.log(`[EmbedSuResolver] Attempting resolution for ${type}/${tmdbId}`);

            for (const mirror of this.MIRRORS) {
                try {
                    const embedUrl = type === 'movie'
                        ? `${mirror}/embed/movie/${tmdbId}`
                        : `${mirror}/embed/tv/${tmdbId}/${season}/${episode}`;

                    console.log(`[EmbedSuResolver] Scraping Mirror: ${embedUrl}`);

                    const response = await axios.get(embedUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                            'Referer': mirror
                        },
                        timeout: 8000
                    });

                    const html = response.data as string;
                    const initialSourcesCount = sources.length;

            // Embed.su often has a JSON.parse(atob(...)) pattern or similar.
            // We search for base64-like strings that look like encoded source data.
            const base64Pattern = /["']([A-Za-z0-9+/=]{100,})["']/g;
            let match;
            while ((match = base64Pattern.exec(html)) !== null) {
                try {
                    const decoded = Buffer.from(match[1], 'base64').toString();
                    if (decoded.includes('.m3u8') || decoded.includes('.mp4')) {
                        const streamMatches = decoded.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/gi);
                        if (streamMatches) {
                            streamMatches.forEach(url => {
                                sources.push({
                                    url: url,
                                    isM3U8: url.includes('.m3u8'),
                                    quality: url.includes('1080') ? '1080p' : 'auto'
                                });
                            });
                        }
                    }
                } catch (e) { /* not valid base64 or source data */ }
            }

            // Also do a direct greedy search in the HTML for backup
            const directMatches = html.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/gi);
            if (directMatches) {
                directMatches.forEach(url => {
                    if (!url.includes('cdn-cgi') && !url.includes('google-analytics')) {
                        sources.push({
                            url: url,
                            isM3U8: url.includes('.m3u8'),
                            quality: 'auto'
                        });
                    }
                });
            }
                    if (sources.length > initialSourcesCount) {
                        console.log(`[EmbedSuResolver] Successfully found ${sources.length - initialSourcesCount} sources on ${mirror}`);
                        break; // Stop if we found something
                    }
                } catch (err: any) {
                    console.warn(`[EmbedSuResolver] Mirror ${mirror} failed: ${err.message}`);
                }
            }

            return { sources, subtitles };
        } catch (error: any) {
            console.warn(`[EmbedSuResolver] Critical failure: ${error.message}`);
            return { sources, subtitles };
        }
    }
}
