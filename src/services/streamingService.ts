import api from './api';

export const streamingService = {
    getSources: async (contentId: string, episodeNumber: number = 1, title: string) => {
        const response = await api.get('/sources', {
            params: { id: contentId, episode: episodeNumber, title }
        });
        return response.data;
    },

    verifyHealth: async (url: string) => {
        const response = await api.post('/sources/verify', { url });
        return response.data.healthy;
    }
};

export default streamingService;
