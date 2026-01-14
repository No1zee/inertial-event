export const urlValidator = {
    isValidStream: (url: string): boolean => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.includes('.m3u8') || lower.includes('.mp4') || lower.includes('.mkv') || url.startsWith('http://localhost');
    },

    isSecureOrigin: (url: string): boolean => {
        try {
            const uri = new URL(url);
            return uri.protocol === 'https:' || uri.hostname === 'localhost' || uri.hostname === '127.0.0.1';
        } catch {
            return false;
        }
    }
};

export default urlValidator;
