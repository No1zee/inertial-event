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
    if (process.env.DEBUG_REQUESTS || process.env.NODE_ENV !== 'production') {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
    }
    next();
});


// API Routes
const apiPrefix = process.env.VERCEL ? '/' : '/api';
app.get(apiPrefix + (apiPrefix === '/' ? 'health' : '/health'), (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use(apiPrefix, routes);

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
