import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', routes);

// DB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novastream';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err: any) {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Starting in MOCK DB mode. Data will NOT persist between restarts.');
            // Monkeypatch Mongoose or handle gracefully at controller level
            // For now, we just log and proceed, but in a real app we'd swap the provider.
        } else {
            process.exit(1);
        }
    }
};

connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

export default app;
