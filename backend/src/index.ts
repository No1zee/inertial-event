import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as routes } from './routes/index';
import dns from 'dns';

// Force use of Google DNS to resolve MongoDB SRV records if local DNS is unstable
dns.setServers(['8.8.8.8', '1.1.1.1']);

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
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', routes);

// DB Connection
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async (retryCount = 0) => {
    if (!MONGODB_URI) {
        console.warn('⚠️ No MONGODB_URI set. Starting in MOCK DB mode (Stateless).');
        return;
    }

    // Guard against parallel connection attempts or existing connections
    if (mongoose.connection.readyState === 1) {
        return;
    }
    
    if (mongoose.connection.readyState === 2) {
        console.log('⏳ Connection already in progress...');
        return;
    }

    const options = {
        serverSelectionTimeoutMS: 10000, // Increased timeout for DNS SRV stability
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        heartbeatFrequencyMS: 10000,
    };

    try {
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Connected to MongoDB');
    } catch (err: any) {
        console.error(`❌ MongoDB Connection Error (Attempt ${retryCount + 1}):`, err.message);
        
        if (retryCount < 5) { // Increased retries for unstable environments
            const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => connectDB(retryCount + 1), delay);
        } else {
            console.warn('⚠️ Maximum connection attempts reached. Falling back to MOCK DB mode.');
        }
    }
};

// Mongoose handles auto-reconnect internally. We log events for visibility.
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

connectDB();

// Handle local server start (Vercel will ignore this and use the exported app)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

export default app;
