const axios = require('axios');
const { parseHLSManifest } = require('../../../src/utils/hlsParser'); // Using the frontend parser as logic is same

class ManifestService {
    async proxyManifest(url) {
        try {
            const response = await axios.get(url);
            const manifest = response.data;
            // logic to rewrite segments if needed (e.g. for proxying)
            return manifest;
        } catch (error) {
            console.error('Manifest proxy error:', error.message);
            throw error;
        }
    }

    async getMetadata(url) {
        try {
            const response = await axios.get(url);
            return parseHLSManifest(response.data);
        } catch (error) {
            console.error('Manifest metadata error:', error.message);
            return null;
        }
    }
}

module.exports = new ManifestService();
