import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as contentController from '../controllers/contentController.js';
import * as sourceController from '../controllers/sourceController.js';
import * as episodeController from '../controllers/episodeController.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Content Routes
router.get('/content/trending', contentController.getTrending);
router.get('/content/recent', contentController.getRecentlyAdded);
router.get('/content/featured', contentController.getFeatured);
router.get('/content/genre/:genre', contentController.getByGenre);
router.get('/content/search', contentController.searchContent);
router.get('/content/:id', contentController.getContentById);
router.get('/content/:id/watch', contentController.getWatchMetadata);

// User Routes
router.get('/user/library', verifyToken, userController.getLibrary);
router.post('/user/library/add', verifyToken, userController.addToLibrary);
router.post('/user/library/remove', verifyToken, userController.removeFromLibrary);
router.post('/user/preferences', verifyToken, userController.updatePreferences);

// Source/Streaming Routes
router.get('/sources', sourceController.getSources);
router.post('/sources/verify', sourceController.verifyHealth);

// Episode Routes
router.get('/episodes/:id', episodeController.getEpisodeById);
router.get('/episodes/content/:contentId', episodeController.getEpisodesByContent);
router.get('/episodes/:id/sources', episodeController.getEpisodeWithSources);
router.post('/episodes/:id/refresh', verifyToken, episodeController.refreshEpisodeSources);

export { router };
