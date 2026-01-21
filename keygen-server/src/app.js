import 'dotenv/config';
import './config/db.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { apiRoutes } from './routes/api.js';
import { adminRoutes } from './routes/admin.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
    // Bulletproof Normalization: Strip environment prefixes with regex
    const originalUrl = req.url;
    // Strip /api/keygen or /api at the start of the path
    req.url = req.url.replace(/^\/api\/keygen/, '').replace(/^\/api/, '');
    if (req.url === '' || req.url.startsWith('?')) req.url = '/' + req.url;

    if (process.env.DEBUG_REQUESTS || process.env.NODE_ENV !== 'production') {
        console.log(`[Keygen] ${req.method} ${originalUrl} -> ${req.url}`);
    }
    next();
});

// Mount at root (normalization handles prefixes)
app.use('/admin', adminRoutes);
app.use('/', apiRoutes);

app.get('/admin-panel', (req, res) => {
    return res.redirect('/keygen-admin/index.html');
});

// Fallback 404 for Keygen
app.use((req, res, next) => {
    // Log normalized 404 for diagnosis
    if (req.url.length > 1) {
        console.warn(`[Keygen 404] ${req.method} ${req.originalUrl} -> ${req.url}`);
        return res.status(404).json({
            error: 'Not Found',
            message: `No route matches ${req.url} in Keygen Server`,
            normalized_path: req.url,
            original_url: req.originalUrl,
            vercel: !!process.env.VERCEL
        });
    }
    next();
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'NovaStream Keygen Server',
        admin_panel: '/keygen-admin/index.html'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('[Keygen Error Handler]', err);
    res.status(500).json({ 
        error: 'Keygen Internal Error',
        message: err.message,
        path: req.path
    });
});

export { app };
