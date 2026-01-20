import { Request, Response } from 'express';
import sourceService from '../services/sourceService.js';

import * as fs from 'fs';
import * as path from 'path';

export const getSources = async (req: Request, res: Response) => {
    const debugLog = (msg: string) => {
        console.error(`[SourceDebug] ${msg}`);
    };

    debugLog('Request received for /api/sources');
    try {
        const { id, title, season, episode, type } = req.query;
        debugLog(`Query: id=${id}, title=${title}`);
        
        if (!sourceService) {
            debugLog('FATAL: sourceService is undefined');
            throw new Error('sourceService is undefined');
        }
        debugLog('Calling sourceService.getAllSources...');
        
        const result = await sourceService.getAllSources(
            id as string,
            parseInt(season as string) || 1,
            parseInt(episode as string) || 1,
            title as string,
            (type as 'movie' | 'tv') || 'movie'
        );
        
        debugLog('Got result from service. Sending JSON.');
        res.json(result);
    } catch (error: any) {
        debugLog(`ERROR CAUGHT: ${error.message}`);
        debugLog(`STACK: ${error.stack}`);
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
