import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { ProviderResponseSchema, IProviderResponse, IStreamSource } from './providers/ProviderSchemas.js';
import { tmdbService } from './tmdbService.js';

class VidlinkService {
    private config = ProviderConfig.vidlink;

    async getSources(id: string, season: number, episode: number, type: 'movie' | 'tv'): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            // Strip 'tmdb_', 'tv_', 'movie_', 'series_' prefixes to ensure raw TMDB ID
            const cleanId = id.replace(/^(tmdb_|tv_|movie_|series_)/, '');

            // This handles cases like "id-12345" if they ever occur
            const numericId = cleanId.match(/^\d+$/) ? cleanId : (cleanId.match(/\d+/) || [cleanId])[0];

            // 1. Fetch IMDB ID for redundancy (Best Reliability)
            // IMDB IDs for movies are handled correctly, but for TV shows we need to be careful with TMDB's generic ID mapping
            let imdbId: string | null = null;
            try {
                imdbId = await tmdbService.getExternalIds(numericId, (type as any) === 'anime' ? 'tv' : type);
                console.log(`[Vidlink] Reliability: TMDB:${numericId} IMDB:${imdbId || 'N/A'}`);
            } catch (e) {
                console.warn(`[Vidlink] IMDB ID fetch failed for ${type}/${numericId}`);
            }

            console.log(`[Vidlink] Generating Embed for ID: ${id} -> Clean: ${numericId} Type: ${type} Season: ${season} Episode: ${episode}`);

            const sources: IStreamSource[] = [];

            // Vidlink Customization Props
            const params = new URLSearchParams({
                primaryColor: 'dc2626', // Red-600
                secondaryColor: '141414', // Zinc-950
                iconColor: 'ffffff',
                icons: 'default', // 'vid' or 'default'
                autoplay: 'true',
                nextbutton: 'true'
            }).toString();

            // 1. Primary: Vidlink (Better Quality)
            if (type === 'movie') {
                const url = `https://vidlink.pro/movie/${numericId}?${params}`;
                console.log(`[Vidlink] Movie URL: ${url}`);
                sources.push({
                    url: url,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "Vidlink (HQ)"
                });

                // Add IMDB Version if available
                if (imdbId) {
                    sources.push({
                        url: `https://vidlink.pro/movie/${imdbId}?${params}`,
                        quality: "1080p",
                        type: "embed" as const,
                        provider: "Vidlink (Backup)"
                    });
                }
            } else if (type === 'tv' || type === 'series' || type === 'anime') {
                const url = `https://vidlink.pro/tv/${numericId}/${season}/${episode}?${params}`;
                console.log(`[Vidlink] TV URL: ${url}`);
                sources.push({
                    url: url,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "Vidlink (HQ)"
                });

                if (imdbId) {
                    sources.push({
                        url: `https://vidlink.pro/tv/${imdbId}/${season}/${episode}?${params}`,
                        quality: "1080p",
                        type: "embed" as const,
                        provider: "Vidlink (Backup)"
                    });
                }
            }

            // 2. Additional HQ Provider: Multi-Source
            if (imdbId) {
                sources.push({
                    url: `https://multiembed.mov/directstream.php?video_id=${imdbId}${type === 'tv' ? `&s=${season}&e=${episode}` : ''}`,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "NovaCore"
                });
            }

            // 3. Fallback: VidSrc (Robust)
            if (type === 'movie') {
                sources.push({
                    url: `https://vidsrc.icu/embed/movie/${imdbId || cleanId}`,
                    quality: "720p",
                    type: "embed" as const,
                    provider: "VidSrc (Stable)"
                });
            } else if (type === 'tv' || type === 'series' || type === 'anime') {
                // VidSrc usually uses /embed/tv/ID/SEASON/EPISODE
                sources.push({
                    url: `https://vidsrc.icu/embed/tv/${imdbId || cleanId}/${season}/${episode}`,
                    quality: "720p",
                    type: "embed" as const,
                    provider: "VidSrc (Stable)"
                });
            }

            // 4. Ultra Fallback: Pro
            if (imdbId) {
                 sources.push({
                    url: `https://vidsrc.pro/embed/${type}/${imdbId}${type === 'tv' ? `/${season}/${episode}` : ''}`,
                    quality: "1080p",
                    type: "embed" as const,
                    provider: "VidSrc Pro"
                });
            }

            return {
                sources: sources,
                subtitles: []
            };

        } catch (error: any) {
            console.warn(`Vidlink source error for ${type}/${id}:`, error.message);
            return null;
        }
    }
}

const vidlinkService = new VidlinkService();
export { vidlinkService };
