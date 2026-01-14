const axios = require('axios');

class VidlinkService {
    constructor() {
        this.baseUrl = 'https://vidlink.pro/api/';
    }

    async getSources(id, type = 'movie', season, episode) {
        try {
            const params = { type };
            if (type === 'tv' || type === 'episode') {
                params.s = season;
                params.e = episode;
            }

            const response = await axios.get(`${this.baseUrl}episode/${id}`, { params });
            return response.data;
        } catch (error) {
            console.error('Vidlink sources error:', error.message);
            return null;
        }
    }
}

module.exports = new VidlinkService();
