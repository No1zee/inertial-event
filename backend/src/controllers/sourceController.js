const sourceService = require('../services/sourceService').default; // Using the TypeScript default export

exports.getSources = async (req, res) => {
    try {
        const { id, type, title, season, episode } = req.query;
        const result = await sourceService.getAllSources(id, parseInt(episode) || 1, title);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyHealth = async (req, res) => {
    try {
        const { url } = req.body;
        const isHealthy = await sourceService.verifySourceHealth(url);
        res.json({ healthy: isHealthy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
