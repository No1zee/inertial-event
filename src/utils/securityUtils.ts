export const securityUtils = {
    sanitizeUrl: (url: string): string => {
        // Basic sanitization to prevent XSS in URLs
        return url.replace(/[^-A-Za-z0-9+&@#/%?=~_|!:,.;()]/g, '');
    },

    generateRandomId: (length: number = 16): string => {
        return Array.from(crypto.getRandomValues(new Uint8Array(length)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
};

export default securityUtils;
