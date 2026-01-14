export const ProviderConfig = {
    vidlink: {
        enabled: process.env.ENABLE_VIDLINK !== 'false',
        timeout: 5000,
        baseUrl: process.env.VIDLINK_URL || 'https://vidlink.pro/api'
    },
    consumet: {
        enabled: process.env.ENABLE_CONSUMET !== 'false',
        timeout: 7000,
        baseUrl: process.env.CONSUMET_URL || 'https://api.consumet.org'
    },
    torrent: {
        enabled: process.env.ENABLE_TORRENT === '1',
        timeout: 15000
    },
    global: {
        maxRetries: 2,
        cacheTtl: 3600 // 1 hour
    }
};
