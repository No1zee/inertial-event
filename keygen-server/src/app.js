import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { apiRoutes } from './routes/api.js';
import { adminRoutes } from './routes/admin.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files for OTA updates
app.use('/updates', express.static('updates'));

// 1. URL Normalization Middleware (Fix Vercel Routing/404s)
app.use((req, res, next) => {
    const originalUrl = req.url;
    
    // Strip Vercel-specific prefixes and query params that confuse Express
    // e.g., /api/keygen/api/validate?path=api/validate -> /validate
    let normalized = req.path;
    normalized = normalized.replace(/^\/api\/keygen\/api/, '');
    normalized = normalized.replace(/^\/api/, '');
    
    if (normalized !== req.path) {
        console.log(`[Router] Normalized: ${originalUrl} -> ${normalized} (Method: ${req.method})`);
        req.url = normalized;
    }
    next();
});

// 2. DB Readiness Middleware
app.use(async (req, res, next) => {
    if (req.path === '/' || req.path === '/api/health') return next();
    
    try {
        console.log(`[DB Middleware] Checking Readiness for: ${req.path}`);
        await connectDB();
        next();
    } catch (err) {
        console.error('[DB Middleware] FATAL CONNECTION ERROR:', err.message);
        res.status(503).json({ 
            error: 'Database connection failed', 
            message: err.message,
            context: process.env.VERCEL ? 'vercel-serverless' : 'local-node'
        });
    }
});

// Routes
app.use(apiRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'NovaStream Keygen Server',
        db: mongoose.connection.readyState,
        env: process.env.VERCEL ? 'vercel' : 'local'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
