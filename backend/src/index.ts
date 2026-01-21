import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as routes } from './routes/index.js';

dotenv.config();


process.on('uncaughtException', (err) => {
    console.error('FATAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    // Bulletproof Normalization: Strip environment prefixes with regex
    const originalUrl = req.url;
    req.url = req.url.replace(/^\/api/, '');
    if (req.url === '' || req.url.startsWith('?')) req.url = '/' + req.url;

    if (process.env.DEBUG_REQUESTS || process.env.NODE_ENV !== 'production') {
        console.log(`[Backend] ${req.method} ${originalUrl} -> ${req.url}`);
    }
    next();
});


// API Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', source: 'root', env: process.env.VERCEL ? 'vercel' : 'local', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', source: 'api', timestamp: new Date().toISOString() }));

// Mount routes at both root and /api to be safe with Vercel rewrites
app.use('/api', routes);
app.use('/', routes);

// Fallback 404 for debugging
app.use((req, res) => {
    console.warn(`[Backend 404] ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Not Found', 
        message: `No route matches ${req.url} in Backend Server`,
        vercel: !!process.env.VERCEL
    });
});

// DB Connection
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    if (!MONGODB_URI) {
        console.warn('⚠️ No MONGODB_URI set. Starting in MOCK DB mode (Stateless).');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err: any) {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Falling back to MOCK DB mode.');
        }
    }
};

connectDB();

// Handle local server start (Vercel will ignore this and use the exported app)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

export default app;
