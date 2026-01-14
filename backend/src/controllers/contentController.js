const mongoose = require('mongoose');
const Content = require('../models/Content');
const consumetService = require('../services/consumetService');
const sourceService = require('../services/sourceService');
const tmdbService = require('../services/tmdbService');
const { MOCK_CONTENT } = require('../data/MockContent');

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

const getTrending = async (req, res) => {
    try {
        if (!isDbConnected()) {
            console.log('🔌 DB Disconnected: Attempting TMDB fetch...');
            const tmdbData = await tmdbService.getTrending();
            if (tmdbData.length > 0) {
                console.log(`✅ Serving ${tmdbData.length} items from TMDB`);
                return res.json(tmdbData);
            }
            console.warn('⚠️ TMDB returned 0 items, serving MOCK_CONTENT');
            return res.json(MOCK_CONTENT);
        }

        const content = await Content.find()
            .sort({ trendingScore: -1 })
            .limit(20);

        // If DB is empty, try TMDB
        if (content.length === 0) {
            console.log('📂 DB Empty: Fetching from TMDB...');
            const tmdbData = await tmdbService.getTrending();
            if (tmdbData.length > 0) {
                console.log(`✅ Serving ${tmdbData.length} items from TMDB`);
                return res.json(tmdbData);
            }
        }

        res.json(content);
    } catch (error) {
        console.warn('❌ Content fetch failed, trying TMDB/Mock:', error.message);
        const tmdbData = await tmdbService.getTrending();
        res.json(tmdbData.length > 0 ? tmdbData : MOCK_CONTENT);
    }
};

const getRecentlyAdded = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const tmdbData = await tmdbService.getTrending();
            if (tmdbData.length > 0) return res.json(tmdbData);
            return res.json(MOCK_CONTENT);
        }

        const content = await Content.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(content);
    } catch (error) {
        res.json(MOCK_CONTENT);
    }
};

const getByGenre = async (req, res) => {
    try {
        if (!isDbConnected()) return res.json(MOCK_CONTENT.filter(c => c.genres.includes(req.params.genre)));

        const { genre } = req.params;
        const content = await Content.find({ genres: { $in: [genre] } })
            .sort({ rating: -1 })
            .limit(20);
        res.json(content);
    } catch (error) {
        res.json([]);
    }
};

const getFeatured = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const featured = await tmdbService.getFeatured();
            return res.json(featured || MOCK_CONTENT[0]);
        }

        const featured = await Content.findOne({ trendingScore: { $gt: 0 } }).sort({ trendingScore: -1 });
        res.json(featured || MOCK_CONTENT[0]);
    } catch (error) {
        res.json(MOCK_CONTENT[0]);
    }
};

const getContentById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!isDbConnected() || id.startsWith('tmdb_')) {
            if (id.startsWith('tmdb_')) {
                const tmdbItem = await tmdbService.getDetails(id);
                if (tmdbItem) return res.json(tmdbItem);
            }
            const mock = MOCK_CONTENT.find(c => c._id === id);
            return mock ? res.json(mock) : res.status(404).json({ error: 'Content not found' });
        }

        const content = await Content.findById(id).populate('seasons.episodes');
        if (!content) return res.status(404).json({ error: 'Content not found' });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getWatchMetadata = async (req, res) => {
    try {
        const id = req.params.id;
        const { episode } = req.query;
        const episodeNum = parseInt(episode) || 1;

        let content;
        if (!isDbConnected() || id.startsWith('tmdb_')) {
            if (id.startsWith('tmdb_')) {
                content = await tmdbService.getDetails(id);
            } else {
                content = MOCK_CONTENT.find(c => c._id === id);
            }

            if (!content) return res.status(404).json({ error: 'Content not found' });
        } else {
            content = await Content.findById(id);
            if (!content) return res.status(404).json({ error: 'Content not found' });
        }

        // Fetch sources from sourceService
        const sourcesResult = await sourceService.getAllSources(id, episodeNum, content.title);

        // If mock and no real sources found, inject mock source
        if (!isDbConnected() && sourcesResult.sources.length === 0 && content.sources) {
            sourcesResult.sources = content.sources;
        }

        const skipRanges = [
            { type: 'op', start: 10, end: 40 },
            { type: 'ed', start: 1380, end: 1470 }
        ];

        res.json({
            content: {
                title: content.title,
                type: content.type,
                tmdbId: content.tmdbId
            },
            sources: sourcesResult.sources || [],
            subtitles: sourcesResult.subtitles || [],
            skipRanges
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchContent = async (req, res) => {
    try {
        const { q } = req.query;
        if (!isDbConnected()) {
            const local = MOCK_CONTENT.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
            const tmdbResults = await tmdbService.search(q);
            // Combine mock results with TMDB results
            return res.json({ local: [...local, ...tmdbResults], external: [] });
        }

        const localResults = await Content.find({ title: { $regex: q, $options: 'i' } });
        const externalResults = await consumetService.search(q);
        res.json({ local: localResults, external: externalResults });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getTrending,
    getRecentlyAdded,
    getByGenre,
    getFeatured,
    getContentById,
    getWatchMetadata,
    searchContent
};
