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

// Routes - Unified for Local and Vercel
const apiRoot = '/api/keygen/api';

// Mount at standardized locations
app.use(apiRoot, apiRoutes);
app.use('/api/keygen/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes); // Fallback mount

// Fallback 404 for Keygen
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            error: 'Not Found',
            message: `No route matches ${req.url} in Keygen Server`,
            expected_prefix: apiRoot
        });
    }
    next();
});

app.get('/admin-panel', (req, res) => {
    // On Vercel, we serve this as a static route from the public folder
    if (process.env.VERCEL) {
        return res.redirect('/keygen-admin/index.html');
    }
    // Locally, we can still serve it if needed or redirect
    res.redirect('/keygen-admin/index.html');
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
