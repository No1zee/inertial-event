import { useTorrentEngine } from '../hooks/useTorrentEngine';
import sourceProvider from './sourceProvider';
import { logger } from '../utils/logger';

interface ResolvedSource {
    url: string;
    type: 'hls' | 'mp4' | 'torrent';
    provider: string;
    quality: string;
}

class FallbackService {
    private retryCounts: Map<string, number> = new Map();
    private readonly MAX_RETRIES = 2;

    async resolveBestSource(content: any, episode?: any): Promise<ResolvedSource | null> {
        const sources = await sourceProvider.getAllSources({
            id: content._id || content.id,
            title: content.title,
            type: content.type
        });

        // 1. Priority: Torrent (Electron Only)
        if (typeof window !== 'undefined' && (window as any).electron) {
            try {
                logger.info('Attempting Torrent resolution...');
                const torrentSources = sources.get('torrent') || [];
                if (torrentSources.length > 0) {
                    return {
                        url: torrentSources[0].url,
                        type: 'torrent',
                        provider: 'torrent',
                        quality: 'auto'
                    };
                }
            } catch (err) {
                logger.warn('Torrent resolution failed, falling back...');
            }
        }

        // 2. Priority: Vidlink
        const vidlinkSources = sources.get('vidlink') || [];
        if (vidlinkSources.length > 0) {
            logger.info('Switching to Vidlink provider');
            return {
                url: vidlinkSources[0].url,
                type: 'hls',
                provider: 'vidlink',
                quality: vidlinkSources[0].quality
            };
        }

        // 3. Priority: Consumet / Mirrors
        const consumetSources = sources.get('consumet') || [];
        if (consumetSources.length > 0) {
            logger.info('Switching to Consumet/Mirror provider');
            return {
                url: consumetSources[0].url,
                type: 'hls',
                provider: 'consumet',
                quality: consumetSources[0].quality
            };
        }

        logger.error('No viable sources found for content');
        return null;
    }

    handleSourceError(source: ResolvedSource): boolean {
        const key = `${source.provider}:${source.url}`;
        const count = (this.retryCounts.get(key) || 0) + 1;
        this.retryCounts.set(key, count);

        if (count <= this.MAX_RETRIES) {
            logger.warn(`Source error on ${source.provider}. Retry ${count}/${this.MAX_RETRIES}`);
            return true; // Should retry
        }

        logger.error(`Source ${source.provider} failed after ${this.MAX_RETRIES} retries. Triggering fallback.`);
        return false; // Should fallback
    }
}

export const fallbackService = new FallbackService();
