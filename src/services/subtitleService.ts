import axios from 'axios';
import { logger } from '../utils/logger';

interface SubtitleTrack {
    lang: string;
    url: string;
    label?: string;
}

class SubtitleService {
    async getMergedSubtitles(contentId: string, episodeId?: string): Promise<SubtitleTrack[]> {
        try {
            logger.info(`Merging subtitle tracks for ${contentId}`);

            // Mocking multiple endpoint resolution
            const results = await Promise.allSettled([
                this.fetchVidlinkSubs(contentId, episodeId),
                this.fetchExternalSubs(contentId)
            ]);

            const merged: SubtitleTrack[] = [];
            results.forEach(res => {
                if (res.status === 'fulfilled') {
                    merged.push(...res.value);
                }
            });

            // Dedup by URL and Lang
            const unique = Array.from(new Map(merged.map(s => [`${s.lang}:${s.url}`, s])).values());

            return unique;
        } catch (err) {
            logger.error('Subtitle merging failed', err);
            return [];
        }
    }

    private async fetchVidlinkSubs(contentId: string, episodeId?: string): Promise<SubtitleTrack[]> {
        // Simplified mock
        return [{ lang: 'en', url: `https://vidlink.pro/subs/${contentId}.vtt`, label: 'English (Vidlink)' }];
    }

    private async fetchExternalSubs(contentId: string): Promise<SubtitleTrack[]> {
        // Simplified mock
        return [{ lang: 'es', url: `https://subs.external.io/${contentId}_es.vtt`, label: 'Spanish' }];
    }
}

export const subtitleService = new SubtitleService();
