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

// Admin Dashboard UI
const distPath = path.join(__dirname, '../admin-dashboard/dist');
app.use(express.static(distPath));

app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'NovaStream Keygen Server',
        admin_panel: '/api/keygen/admin-panel'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
