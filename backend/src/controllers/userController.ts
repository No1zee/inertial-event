import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { MOCK_USER_LIBRARY } from '../data/MockContent.js';

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

export const addToLibrary = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            // Mock success
            return res.json({ message: 'Added to library (Mock)', library: [...MOCK_USER_LIBRARY.watchlist, req.body.contentId] });
        }

        const { contentId } = req.body;
        const userId = (req as any).user.id;

        const user = await (User as any).findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.library.includes(contentId)) {
            user.library.push(contentId);
            await user.save();
        }

        res.json({ message: 'Added to library', library: user.library });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const removeFromLibrary = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            return res.json({ message: 'Removed from library (Mock)', library: MOCK_USER_LIBRARY.watchlist });
        }

        const { contentId } = req.body;
        const userId = (req as any).user.id;

        const user = await (User as any).findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.library = user.library.filter((id: any) => id.toString() !== contentId);
        await user.save();

        res.json({ message: 'Removed from library', library: user.library });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getLibrary = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            return res.json(MOCK_USER_LIBRARY.watchlist);
        }

        const userId = (req as any).user.id;
        const user = await (User as any).findById(userId).populate('library');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user.library);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePreferences = async (req: Request, res: Response) => {
    try {
        if (!isDbConnected()) {
            return res.json(req.body.preferences);
        }

        const { preferences } = req.body;
        const userId = (req as any).user.id;

        const user = await (User as any).findByIdAndUpdate(userId, { preferences }, { new: true });
        res.json(user?.preferences);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
