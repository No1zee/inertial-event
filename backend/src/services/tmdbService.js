const axios = require('axios');
const { MOCK_CONTENT } = require('../data/MockContent');

class TmdbService {
    constructor() {
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    get apiKey() {
        return process.env.TMDB_API_KEY;
    }

    get readToken() {
        return process.env.TMDB_READ_ACCESS_TOKEN;
    }

    get headers() {
        const h = {
            accept: 'application/json'
        };
        if (this.readToken) {
            h.Authorization = `Bearer ${this.readToken}`;
        }
        return h;
    }

    async getTrending() {
        try {
            if (!this.apiKey) {
                console.warn('TMDB API Key missing in process.env');
                throw new Error('TMDB API Key missing');
            }

            let url = `${this.baseUrl}/trending/all/day?language=en-US`;
            if (!this.readToken && this.apiKey) {
                url += `&api_key=${this.apiKey}`;
            }

            const response = await axios.get(url, {
                headers: this.headers
            });

            return response.data.results.map(this.transformTmdbItem);
        } catch (error) {
            console.error('TMDB Fetch Error:', error.message);
            return [];
        }
    }

    async getFeatured() {
        try {
            const trending = await this.getTrending();
            return trending[0] || MOCK_CONTENT[0];
        } catch (error) {
            return MOCK_CONTENT[0];
        }
    }

    async getDetails(id) {
        try {
            const cleanId = id.replace('tmdb_', '');
            // Try movie first
            try {
                let movieUrl = `${this.baseUrl}/movie/${cleanId}?language=en-US`;
                if (!this.readToken && this.apiKey) movieUrl += `&api_key=${this.apiKey}`;
                
                const response = await axios.get(movieUrl, {
                    headers: this.headers
                });
                return this.transformTmdbItem({ ...response.data, media_type: 'movie' });
            } catch (movieError) {
                // If 404, try TV
                let tvUrl = `${this.baseUrl}/tv/${cleanId}?language=en-US`;
                if (!this.readToken && this.apiKey) tvUrl += `&api_key=${this.apiKey}`;
                
                const response = await axios.get(tvUrl, {
                    headers: this.headers
                });
                return this.transformTmdbItem({ ...response.data, media_type: 'tv' });
            }
        } catch (error) {
            console.warn('TMDB Details Fetch Error:', id);
            return null;
        }
    }

    async search(query) {
        try {
            let searchUrl = `${this.baseUrl}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
            if (!this.readToken && this.apiKey) searchUrl += `&api_key=${this.apiKey}`;
            
            const response = await axios.get(searchUrl, {
                headers: this.headers
            });
            return response.data.results
                .filter((i) => i.media_type === 'movie' || i.media_type === 'tv')
                .map(this.transformTmdbItem);
        } catch (error) {
            return [];
        }
    }

    // Transform TMDB format to our internal Content model
    transformTmdbItem(item) {
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
            genres: item.genre_ids,
            sources: []
        };
    }
}

module.exports = new TmdbService();
