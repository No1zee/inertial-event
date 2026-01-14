import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig';
import { ProviderResponseSchema, IProviderResponse } from './providers/ProviderSchemas';

class VidlinkService {
    private config = ProviderConfig.vidlink;

    async getSources(id: string, season: number, episode: number, type: 'movie' | 'tv'): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            // Strip 'tmdb_' or other prefixes to ensure raw TMDB ID
            const cleanId = id.replace(/^(tmdb_|tv_|movie_)/, '');
            console.log(`[Vidlink] Generatng Embed for ID: ${cleanId} Type: ${type}`);

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
                sources.push({
                    url: `https://vidlink.pro/movie/${cleanId}?${params}`,
                    quality: "1080p",
                    type: "embed",
                    provider: "Vidlink (HQ)"
                });
            } else {
                sources.push({
                    url: `https://vidlink.pro/tv/${cleanId}/${season}/${episode}?${params}`,
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
