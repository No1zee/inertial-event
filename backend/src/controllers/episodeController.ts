import sourceService from '../services/sourceService.js';
import { Request, Response } from 'express';

// Mock Episode model for now
const Episode: any = {
    findById: async (id: string) => ({
        _id: id,
        contentId: { _id: { toString: () => 'content1' }, title: 'Title' },
        episodeNumber: 1,
        toObject: function () { return this; },
        save: async () => { }
    }),
    find: async (query: any) => ({
        sort: (s: any) => []
    })
};

export const getEpisodeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const episode = await Episode.findById(id);

        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        res.json(episode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch episode' });
    }
};

export const getEpisodesByContent = async (req: Request, res: Response) => {
    try {
        const { contentId } = req.params;
        const episodes = await Episode.find({ contentId }).sort({
            seasonNumber: 1,
            episodeNumber: 1
        });

        res.json(episodes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch episodes' });
    }
};

export const getEpisodeWithSources = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const episode = await Episode.findById(id).populate('contentId');

        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        // Get fresh sources
        const sources = await sourceService.getAllSources(
            episode.contentId._id.toString(),
            episode.season || 1,
            episode.episodeNumber,
            episode.contentId.title,
            'tv'
        );

        res.json({
            ...episode.toObject(),
            sources: sources.sources,
            subtitles: sources.subtitles
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch episode sources' });
    }
};

export const refreshEpisodeSources = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const episode = await Episode.findById(id).populate('contentId');

        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        const sources = await sourceService.getAllSources(
            episode.contentId._id.toString(),
            episode.season || 1,
            episode.episodeNumber,
            episode.contentId.title,
            'tv'
        );

        // Update sources in database
        episode.sources = sources.sources.map((src) => ({
            provider: src.provider,
            url: src.url,
            quality: src.quality,
            type: src.type,
            lastVerified: new Date(),
            isWorking: true
        }));

        episode.subtitles = sources.subtitles.map((sub: any) => ({
            language: sub.lang,
            url: sub.url,
            format: 'vtt'
        }));

        await episode.save();

        res.json(episode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to refresh sources' });
    }
};
