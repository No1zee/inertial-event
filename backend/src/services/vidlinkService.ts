import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig.js';
import { ProviderResponseSchema, IProviderResponse } from './providers/ProviderSchemas.js';

class VidlinkService {
    private config = ProviderConfig.vidlink;

    async getSources(id: string, season: number, episode: number, type: 'movie' | 'tv'): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            // Strip 'tmdb_', 'tv_', 'movie_', 'series_' prefixes to ensure raw TMDB ID
            const cleanId = id.replace(/^(tmdb_|tv_|movie_|series_)/, '');

            // Fallback: If ID still contains non-numeric characters (and isn't 'imdb'), try to extract numbers
            // This handles cases like "id-12345" if they ever occur
            const numericId = cleanId.match(/^\d+$/) ? cleanId : (cleanId.match(/\d+/) || [cleanId])[0];

            console.log(`[Vidlink] Generatng Embed for ID: ${id} -> Clean: ${numericId} Type: ${type} Season: ${season} Episode: ${episode}`);

            const sources = [];

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
                    type: "embed",
                    provider: "Vidlink (HQ)"
                });
            } else {
                const url = `https://vidlink.pro/tv/${numericId}/${season}/${episode}?${params}`;
                console.log(`[Vidlink] TV URL: ${url}`);
                sources.push({
                    url: url,
                    quality: "1080p",
                    type: "embed",
                    provider: "Vidlink (HQ)"
                });
            }

            // 2. Fallback: VidSrc (Robust)
            if (type === 'movie') {
                sources.push({
                    url: `https://vidsrc.icu/embed/movie/${cleanId}`,
                    quality: "720p",
                    type: "embed",
                    provider: "VidSrc (Backup)"
                });
            } else {
                // VidSrc usually uses /embed/tv/ID/SEASON/EPISODE
                sources.push({
                    url: `https://vidsrc.icu/embed/tv/${cleanId}/${season}/${episode}`,
                    quality: "720p",
                    type: "embed",
                    provider: "VidSrc (Backup)"
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

export default new VidlinkService();
