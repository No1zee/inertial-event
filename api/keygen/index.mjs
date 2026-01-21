// Vercel Serverless Function Handler for Keygen API
// Standalone implementation - no Express dependency

import mongoose from 'mongoose';

// Connection cache for serverless
let cached = { conn: null, promise: null };

async function connectDB() {
    if (cached.conn) return cached.conn;
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable not set');
    }
    
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        });
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
}

// License Schema
const licenseSchema = new mongoose.Schema({
    license_key: { type: String, required: true, unique: true, index: true },
    device_id: { type: String, default: null },
    access_type: { type: String, enum: ['permanent', 'trial', 'limited'], required: true },
    expires_at: { type: Date, default: null },
    status: { type: String, enum: ['active', 'revoked', 'unused'], default: 'unused' },
    created_at: { type: Date, default: Date.now },
    created_by: { type: String, default: 'admin' }
});

// Get or create the model
const License = mongoose.models.License || mongoose.model('License', licenseSchema);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Parse the path from the URL
    const url = new URL(req.url, `https://${req.headers.host}`);
    let path = url.pathname;
    
    // Normalize path (strip /api/keygen/api prefix)
    const originalPath = path;
    path = path.replace(/^\/api\/keygen\/api/, '').replace(/^\/api\/keygen/, '').replace(/^\/api/, '');
    if (!path || path === '') path = '/';
    
    console.log(`[Vercel Diagnostics] Method: ${req.method} | Path: ${path} | Original: ${originalPath} | URL: ${req.url}`);
    
    // Route handling
    if (path === '/ping') {
        return res.status(200).json({ 
            message: 'pong',
            debug: {
                originalUrl: req.url,
                originalPath: originalPath,
                normalizedPath: path,
                method: req.method,
                host: req.headers.host
            }
        });
    }

    if ((path === '/' || path === '/index.mjs') && req.method === 'GET') {
        return res.status(200).json({ 
            message: 'NovaStream Keygen Server (Vercel)',
            status: 'online'
        });
    }
    
    if (path === '/validate' && req.method === 'POST') {
        try {
            await connectDB();
            
            const { license_key, device_id, machine_info } = req.body || {};
            
            if (!license_key) {
                return res.status(400).json({ valid: false, error: 'License key required' });
            }
            
            console.log(`[Validate] Searching for key: ${license_key.substring(0, 8)}...`);
            const license = await License.findOne({ license_key });
            
            if (!license) {
                return res.status(404).json({ valid: false, error: 'Invalid license key' });
            }
            
            if (license.status !== 'active') {
                if (license.status === 'unused') {
                    license.device_id = device_id;
                    license.status = 'active';
                    await license.save();
                } else {
                    return res.json({ valid: false, error: 'License revoked' });
                }
            }
            
            if (license.device_id !== device_id) {
                return res.json({ valid: false, error: 'Device mismatch' });
            }
            
            if (license.expires_at) {
                if (new Date() > new Date(license.expires_at)) {
                    return res.json({ valid: false, error: 'License expired' });
                }
            }
            
            return res.json({ 
                valid: true, 
                expires_at: license.expires_at,
                access_type: license.access_type
            });
            
        } catch (error) {
            console.error('[Validate Error]', error);
            return res.status(500).json({ 
                valid: false, 
                error: 'Internal Server Error', 
                message: error.message 
            });
        }
    }
    
    // 404 for unknown routes
    return res.status(404).json({ 
        error: 'Not Found', 
        path: path,
        method: req.method 
    });
}

export const config = {
    api: {
        bodyParser: true,
    },
};
