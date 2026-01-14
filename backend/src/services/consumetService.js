const axios = require('axios');

class ConsumetService {
    constructor() {
        this.baseUrl = 'https://api.consumet.org';
    }

    async getInfo(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/meta/anilist/info/${id}`);
            return response.data;
        } catch (error) {
            console.error('Consumet info error:', error.message);
            return null;
        }
    }

    async getStreamingLinks(episodeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/meta/anilist/watch/${episodeId}`);
            return response.data;
        } catch (error) {
            console.error('Consumet streaming links error:', error.message);
            return null;
        }
    }

    async search(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/meta/anilist/${query}`);
            return response.data;
        } catch (error) {
            console.error('Consumet search error:', error.message);
            return [];
        }
    }
}

module.exports = new ConsumetService();
