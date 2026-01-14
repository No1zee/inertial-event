import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Content from '../models/Content.js';
import consumetService from '../services/consumetService.js';
import sourceService from '../services/sourceService.js';
import tmdbService from '../services/tmdbService.js'; // NEW Import
import { MOCK_CONTENT } from '../data/MockContent.js';

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

export const getTrending = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            const tmdbData = await tmdbService.getTrending();
            if (tmdbData.length > 0) return res.json(tmdbData);
            return res.json(MOCK_CONTENT);
        }

        const content = await Content.find()
            .sort({ trendingScore: -1 })
            .limit(20);
        res.json(content);
    } catch (error: any) {
        console.warn('Content fetch failed, trying TMDB/Mock:', error.message);
        const tmdbData = await tmdbService.getTrending();
        res.json(tmdbData.length > 0 ? tmdbData : MOCK_CONTENT);
    }
};

export const getRecentlyAdded = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            const tmdbData = await tmdbService.getTrending(); // Using trending as proxy for "fresh" in fallback mode
            if (tmdbData.length > 0) return res.json(tmdbData);
            return res.json(MOCK_CONTENT);
        }

        const content = await Content.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(content);
    } catch (error: any) {
        res.json(MOCK_CONTENT);
    }
};

export const getByGenre = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) return res.json(MOCK_CONTENT.filter(c => c.genres.includes(req.params.genre as string)));

        const { genre } = req.params;
        const content = await Content.find({ genres: { $in: [genre] } })
            .sort({ rating: -1 })
            .limit(20);
        res.json(content);
    } catch (error: any) {
        res.json([]);
    }
};

export const getFeatured = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            const featured = await tmdbService.getFeatured();
            return res.json(featured || MOCK_CONTENT[0]);
        }

        const featured = await Content.findOne({ trendingScore: { $gt: 0 } }).sort({ trendingScore: -1 });
        res.json(featured || MOCK_CONTENT[0]);
    } catch (error: any) {
        res.json(MOCK_CONTENT[0]);
    }
};

export const getContentById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!isDbConnected()) {
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getWatchMetadata = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { episode } = req.query;
        const episodeNum = parseInt(episode as string) || 1;

        let content: any;
        if (!isDbConnected()) {
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
        if (!isDbConnected() && sourcesResult.sources.length === 0 && (content as any).sources) {
            sourcesResult.sources = (content as any).sources;
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
            sources: sourcesResult.sources,
            subtitles: sourcesResult.subtitles || [],
            skipRanges
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const searchContent = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!isDbConnected()) {
            const local = MOCK_CONTENT.filter(c => c.title.toLowerCase().includes((q as string).toLowerCase()));
            const tmdbResults = await tmdbService.search(q as string);
            // Combine mock results with TMDB results
            return res.json({ local: [...local, ...tmdbResults], external: [] });
        }

        const localResults = await Content.find({ title: { $regex: q as string, $options: 'i' } });
        const externalResults = await (consumetService as any).search(q);
        res.json({ local: localResults, external: externalResults });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    getTrending,
    getRecentlyAdded,
    getByGenre,
    getFeatured,
    getContentById,
    getWatchMetadata,
    searchContent
};
