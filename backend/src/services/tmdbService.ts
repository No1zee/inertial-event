import axios from 'axios';
import { MOCK_CONTENT } from '../data/MockContent';

class TmdbService {
    private readonly baseUrl = 'https://api.themoviedb.org/3';

    private get apiKey() {
        return process.env.TMDB_API_KEY;
    }

    private get readToken() {
        return process.env.TMDB_READ_ACCESS_TOKEN;
    }

    private get headers() {
        if (this.readToken) {
            return {
                Authorization: `Bearer ${this.readToken}`,
                accept: 'application/json'
            };
        }
        return {
            accept: 'application/json'
        };
    }

    private get params() {
        const p: any = { language: 'en-US' };
        if (!this.readToken && this.apiKey) {
            p.api_key = this.apiKey;
        }
        return p;
    }

    async getTrending(): Promise<any[]> {
        try {
            if (!this.apiKey && !this.readToken) {
                console.warn('TMDB API Key missing in process.env');
                throw new Error('TMDB API Key missing');
            }

            const response = await axios.get(`${this.baseUrl}/trending/all/day`, {
                headers: this.headers,
                params: this.params
            });

            return response.data.results.map(this.transformTmdbItem);
        } catch (error) {
            console.error('TMDB Fetch Error:', error);
            return [];
        }
    }

    async getFeatured(): Promise<any> {
        try {
            const trending = await this.getTrending();
            return trending[0] || MOCK_CONTENT[0];
        } catch (error) {
            return MOCK_CONTENT[0];
        }
    }

    async getDetails(id: string): Promise<any | null> {
        try {
            const cleanId = id.replace('tmdb_', '');
            
            const response = await axios.get(`${this.baseUrl}/movie/${cleanId}`, {
                headers: this.headers,
                params: this.params
            });
            return this.transformTmdbItem({ ...response.data, media_type: 'movie' });
        } catch (error) {
            console.warn('TMDB Details Fetch Error (Movie), trying TV:', id);
            try {
                const cleanId = id.replace('tmdb_', '');
                const response = await axios.get(`${this.baseUrl}/tv/${cleanId}`, {
                    headers: this.headers,
                    params: this.params
                });
                return this.transformTmdbItem({ ...response.data, media_type: 'tv' });
            } catch (tvError) {
                return null;
            }
        }
    }

    async search(query: string): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/search/multi`, {
                headers: this.headers,
                params: {
                    ...this.params,
                    query: encodeURIComponent(query),
                    include_adult: false,
                    page: 1
                }
            });
            return response.data.results
                .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
                .map(this.transformTmdbItem);
        } catch (error) {
            return [];
        }
    }

    // Transform TMDB format to our internal Content model
    private transformTmdbItem(item: any) {
        return {
            _id: `tmdb_${item.id}`,
            id: `tmdb_${item.id}`, // Frontend compat
            tmdbId: item.id,
            title: item.title || item.name,
            description: item.overview,
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
            rating: item.vote_average,
            year: (item.release_date || item.first_air_date || '').split('-')[0],
            type: item.media_type || 'movie',
            genres: item.genre_ids, // Would need mapping, effectively raw for now
            sources: [] // TMDB doesn't provide stream links
        };
    }
    // Helper to get external IDs (IMDB) for Torrentio
    async getExternalIds(tmdbId: string, type: 'movie' | 'tv'): Promise<string | null> {
        try {
            const cleanId = tmdbId.replace('tmdb_', '');
            const response = await axios.get(`${this.baseUrl}/${type}/${cleanId}/external_ids`, {
                headers: this.headers,
                params: this.params
            });
            return response.data.imdb_id || null;
        } catch (error: any) {
            // Enhanced logging for this specific failure
            console.warn(`Failed to get External IDs for ${tmdbId}: ${error.message}`);
            if (error.response) {
                console.warn('TMDB Response:', error.response.data);
            }
            return null;
        }
    }
}

export default new TmdbService();
