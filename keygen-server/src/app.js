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

// Routes - Adjust for Vercel sub-routing if needed
const apiPrefix = process.env.VERCEL ? '/api/keygen/api' : '/api';
app.use(apiPrefix, apiRoutes);
app.use(apiPrefix + '/admin', adminRoutes);

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
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
