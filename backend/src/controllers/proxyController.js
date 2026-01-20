const axios = require('axios');

/**
 * Proxy images from TMDB to avoid CORS and network issues on Android
 * Vercel-compatible: streams images directly without in-memory caching
 * GET /api/proxy/image?url=https://image.tmdb.org/t/p/w500/path.jpg
 */
exports.proxyImage = async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Missing url parameter' });
        }

        // Validate it's a TMDB URL
        if (!url.includes('image.tmdb.org') && !url.includes('themoviedb.org')) {
            return res.status(400).json({ error: 'Only TMDB images are allowed' });
        }

        // Fetch from TMDB with streaming
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 8000, // Vercel has 10s limit, leave buffer
            headers: {
                'User-Agent': 'NovaStream/1.0'
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const imageData = Buffer.from(response.data);

        // Set aggressive caching headers for CDN/browser
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
        res.set('CDN-Cache-Control', 'public, max-age=31536000');
        res.send(imageData);

    } catch (error) {
        console.error('Image proxy error:', error.message);
        
        // Return a 1x1 transparent PNG as fallback
        const transparentPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=300'); // 5 min for errors
        res.status(200).send(transparentPng);
    }
};
