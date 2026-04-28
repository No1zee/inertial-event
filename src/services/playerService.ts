import { API_BASE_URL } from './api';

export const playerService = {

  saveProgress: async (userId: string, contentId: string, episodeNumber: number, progress: number) => {
    // Bridges to backend via api
    const response = await fetch(`${API_BASE_URL}/user/history`, {
      method: 'POST',
      body: JSON.stringify({ userId, contentId, episodeNumber, progress }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  },

  toggleFullScreen: (element: HTMLElement) => {
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  },
};

export default playerService;
