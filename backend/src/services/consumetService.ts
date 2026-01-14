import axios from 'axios';
import { ProviderConfig } from '../config/ProviderConfig';
import { ProviderResponseSchema, IProviderResponse } from './providers/ProviderSchemas';

class ConsumetService {
    private config = ProviderConfig.consumet;

    async getStreamingLinks(episodeId: string): Promise<IProviderResponse | null> {
        if (!this.config.enabled) return null;

        try {
            const url = `${this.config.baseUrl}/meta/anilist/watch/${episodeId}`;
            const response = await axios.get(url, {
                timeout: this.config.timeout
            });

            // Strict Validation
            const parsed = ProviderResponseSchema.safeParse({
                sources: response.data.sources?.map((s: any) => ({
                    ...s,
                    // Consumet sometimes returns 'hls' or 'file' types, map carefully
                    type: s.type === 'file' ? 'hls' : (s.type || 'hls'),
                    provider: 'consumet'
                })),
                subtitles: response.data.subtitles
            });

            if (!parsed.success) {
                console.warn('Consumet schema validation failed:', parsed.error);
                return null;
            }

            return parsed.data;

        } catch (error: any) {
            console.error('Consumet streaming links error:', error.message);
            return null;
        }
    }

    async search(query: string) {
        if (!this.config.enabled) return [];
        try {
            const response = await axios.get(`${this.config.baseUrl}/meta/anilist/${query}`, {
                timeout: this.config.timeout
            });
            return response.data.results || [];
        } catch (error: any) {
            console.error('Consumet search error:', error.message);
            return [];
        }
    }
}

export default new ConsumetService();
