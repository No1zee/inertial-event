import { Request, Response } from 'express';
import sourceService from '../services/sourceService.js';

export const getSources = async (req: Request, res: Response) => {
    try {
        const { id, title, season, episode, type } = req.query;
        const result = await sourceService.getAllSources(
            id as string,
            parseInt(season as string) || 1,
            parseInt(episode as string) || 1,
            title as string,
            (type as 'movie' | 'tv') || 'movie'
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyHealth = async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        const isHealthy = await sourceService.verifySourceHealth(url);
        res.json({ healthy: isHealthy });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    getSources,
    verifyHealth
};
