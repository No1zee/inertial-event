const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const sourceController = require('../controllers/sourceController');
const episodeController = require('../controllers/episodeController');
const { verifyToken } = require('../middleware/auth');

// Content Routes
router.get('/content/trending', contentController.getTrending);
router.get('/content/recent', contentController.getRecentlyAdded);
router.get('/content/featured', contentController.getFeatured);
router.get('/content/genre/:genre', contentController.getByGenre);
router.get('/content/search', contentController.searchContent);
router.get('/content/:id', contentController.getContentById);

// User Routes
const userController = require('../controllers/userController');
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

// File Tunnel Routes
const fileController = require('../controllers/fileController');
router.get('/tunnel/stream', fileController.streamFile);
router.get('/tunnel/list', fileController.listFiles);

module.exports = router;
