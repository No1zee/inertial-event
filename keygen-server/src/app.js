import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

app.get('/', (req, res) => {
    res.json({ message: 'NovaStream Keygen Server' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
