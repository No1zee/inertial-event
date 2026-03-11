import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Content } from '../models/Content.js';
import '../models/Episode.js'; // Side effect import to register schema for populate
import { consumetService } from '../services/consumetService.js';
import { sourceService } from '../services/sourceService.js';
import { tmdbService } from '../services/tmdbService.js';
import { semanticSearchService } from '../services/semanticSearchService.js';
import { MOCK_CONTENT } from '../data/MockContent.js';

// Helper to check DB status
const isDbConnected = () => process.env.NODE_ENV === 'test' || mongoose.connection.readyState === 1;

export const getTrending = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            const tmdbData = await tmdbService.getTrending();
            if (tmdbData.length > 0) return res.json(tmdbData);
            return res.json(MOCK_CONTENT);
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const content = await (Content as any).find()
            .sort({ trendingScore: -1 })
            .limit(limit);
        res.json(content);
    } catch (error: any) {
        if (process.env.NODE_ENV === 'test') {
            console.error('getTrending error:', error);
            // Don't suppress error in tests so we can catch it
            return res.status(500).json({ error: error.message });
        }
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

        const content = await (Content as any).find()
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
        const content = await (Content as any).find({ genres: { $in: [genre] } })
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

        const featured = await (Content as any).findOne({ trendingScore: { $gt: 0 } }).sort({ trendingScore: -1 });
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

        if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('tmdb_')) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const content = await (Content as any).findById(id).populate('seasons.episodes');
        if (!content) return res.status(404).json({ error: 'Content not found' });
        res.json(content);
    } catch (error: any) {
        console.error('getContentById error:', error);
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
            content = await (Content as any).findById(id);
            if (!content) return res.status(404).json({ error: 'Content not found' });
        }

        // Fetch sources from sourceService
        const sourcesResult = await sourceService.getAllSources(
            id, 
            1, // Season number fallback
            episodeNum, 
            content.title,
            (content as any).type === 'movie' ? 'movie' : 'tv'
        );

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

        const localResults = await (Content as any).find({ title: { $regex: q as string, $options: 'i' } });
        const externalResults = await (consumetService as any).search(q);
        res.json({ local: localResults, external: externalResults });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const semanticSearch = async (req: Request, res: Response) => {
    try {
        const { q, limit } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });
        
        if (!isDbConnected()) {
            // Fallback for no DB
            const results = MOCK_CONTENT.filter(c => 
                c.title.toLowerCase().includes((q as string).toLowerCase()) || 
                c.description.toLowerCase().includes((q as string).toLowerCase())
            ).slice(0, Number(limit) || 10);
            return res.json(results);
        }

        const results = await semanticSearchService.search(q as string, Number(limit) || 10);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const syncEmbeddings = async (req: Request, res: Response) => {
    try {
        // Trigger sync in background
        semanticSearchService.syncEmbeddings();
        res.json({ message: 'Sync started in background' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllContent = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, type, genre, search } = req.query;
        if (!isDbConnected()) return res.json({ data: MOCK_CONTENT, pagination: { page: 1, totalPages: 1 } });

        const query: any = {};
        if (type) query.type = type;
        if (genre) query.genres = { $in: [genre] };
        if (search) query.title = { $regex: search, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const data = await (Content as any).find(query).skip(skip).limit(Number(limit));
        const total = await (Content as any).countDocuments(query);

        res.json({
            data,
            pagination: { page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateWatchProgress = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // const userId = (req as any).user.userId;
        const { currentTime } = req.body;
        // Real implementation would update Watched collection
        res.json({ message: 'Watch progress updated', currentTime });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const rateContent = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { rating } = req.body;
        if (rating < 0 || rating > 10) return res.status(400).json({ error: 'Invalid rating' });
        // Real implementation would update Rating collection / User's ratings
        res.json({ message: 'Rating saved', rating });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRecommended = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) return res.json(MOCK_CONTENT);
        const limit = parseInt(req.query.limit as string) || 10;
        const content = await (Content as any).find().sort({ rating: -1 }).limit(limit);
        res.json(content);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
