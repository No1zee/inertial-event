import axios from 'axios';
import { logger } from '../utils/logger';

interface SkipRange {
    type: 'op' | 'ed' | 'mixed-ed' | 'recap';
    interval: {
        startTime: number;
        endTime: number;
    };
    skipId: string;
}

class AnimeService {
    private readonly ANISKIP_API = 'https://api.aniskip.com/v2/skip-times';

    async getSkipRanges(malId: number, episodeNumber: number): Promise<SkipRange[]> {
        try {
            logger.info(`Fetching AniSkip ranges for MAL ID: ${malId}, Ep: ${episodeNumber}`);
            const { data } = await axios.get(`${this.ANISKIP_API}/${malId}/${episodeNumber}`, {
                params: { types: 'op,ed,mixed-ed,recap' },
                timeout: 5000
            });

            if (data.found && data.results) {
                return data.results;
            }

            // Fallback to local heuristics if not found
            return this.applyHeuristics(episodeNumber);
        } catch (err) {
            logger.warn('AniSkip API failed, using heuristics.');
            return this.applyHeuristics(episodeNumber);
        }
    }

    /**
     * Applied when official skip data is missing.
     * TV-style intros are typically between 10s and 90s.
     * Credits typically start in the last 2-3% of duration.
     */
    private applyHeuristics(episodeNumber: number): SkipRange[] {
        const ranges: SkipRange[] = [];

        // Typical Anime OP is around 1:30 (90s)
        // We can't know the exact start/end without data, 
        // but we can suggest a range if we detect current time in likely zones.
        // For now, we return empty and let the player UI handle "Likely Intro" buttons.

        return ranges;
    }

    /**
     * Checks if current time is within any skip range.
     */
    findActiveSkip(ranges: SkipRange[], currentTime: number): SkipRange | null {
        return ranges.find(r =>
            currentTime >= r.interval.startTime &&
            currentTime <= r.interval.endTime
        ) || null;
    }
}

export const animeService = new AnimeService();
