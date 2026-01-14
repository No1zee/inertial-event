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
        return {
            Authorization: `Bearer ${this.readToken}`,
            accept: 'application/json'
        };
    }

    async getTrending(): Promise<any[]> {
        try {
            if (!this.apiKey) {
                console.warn('TMDB API Key missing in process.env');
                throw new Error('TMDB API Key missing');
            }

            const response = await axios.get(`${this.baseUrl}/trending/all/day?language=en-US`, {
                headers: this.headers
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
            // Determine type by some heuristic or just try movie first then tv?
            // For simplicity, we'll assume movie for now or pass type if possible.
            // Actually, in a robust app we'd store type. For this "rescue" mode, try movie.

            const response = await axios.get(`${this.baseUrl}/movie/${cleanId}?language=en-US`, {
                headers: this.headers
            });
            return this.transformTmdbItem({ ...response.data, media_type: 'movie' });
        } catch (error) {
            console.warn('TMDB Details Fetch Error (Movie), trying TV:', id);
            try {
                const cleanId = id.replace('tmdb_', '');
                const response = await axios.get(`${this.baseUrl}/tv/${cleanId}?language=en-US`, {
                    headers: this.headers
                });
                return this.transformTmdbItem({ ...response.data, media_type: 'tv' });
            } catch (tvError) {
                return null;
            }
        }
    }

    async search(query: string): Promise<any[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, {
                headers: this.headers
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
}

export default new TmdbService();
