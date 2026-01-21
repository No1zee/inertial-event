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
    
    // Normalize path (strip /api/keygen/api prefix and index.mjs)
    const originalPath = path;
    path = path.replace(/^\/api\/keygen\/api/, '')
               .replace(/^\/api\/keygen/, '')
               .replace(/^\/api/, '')
               .replace(/\/index\.mjs$/, '');
               
    if (!path || path === '') path = '/';
    
    console.log(`[Vercel Diagnostics] Method: ${req.method} | Path: ${path} | Original: ${originalPath} | URL: ${req.url}`);
    console.log(`[Headers] x-matched-path: ${req.headers['x-matched-path']} | host: ${req.headers.host}`);
    
    // Route handling
    if (path === '/ping') {
        let dbStatus = 'disconnected';
        let keyCount = 0;
        try {
            await connectDB();
            dbStatus = 'connected';
            keyCount = await License.countDocuments();
        } catch (e) {
            dbStatus = `error: ${e.message}`;
        }

        return res.status(200).json({ 
            message: 'pong',
            database: {
                status: dbStatus,
                licenseCount: keyCount
            },
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
                return res.status(200).json({ valid: false, error: 'Invalid license key', message: 'The provided key was not found.' });
            }
            
            if (license.status !== 'active') {
                if (license.status === 'unused') {
                    license.device_id = device_id;
                    license.status = 'active';
                    license.activated_at = new Date();
                    await license.save();
                } else {
                    return res.status(200).json({ valid: false, error: 'License revoked', message: 'This license has been deactivated.' });
                }
            }
            
            if (license.device_id !== device_id) {
                return res.status(200).json({ valid: false, error: 'Device mismatch', message: 'This license is used on another machine.' });
            }
            
            if (license.expires_at && new Date() > new Date(license.expires_at)) {
                return res.status(200).json({ valid: false, error: 'License expired', message: 'This license has expired.' });
            }
            
            return res.status(200).json({ 
                valid: true, 
                expires_at: license.expires_at,
                access_type: license.access_type
            });
            
        } catch (error) {
            console.error('[Validate Error]', error);
            return res.status(500).json({ valid: false, error: 'Internal Server Error', message: error.message });
        }
    }

    if (path === '/activate' && req.method === 'POST') {
        try {
            await connectDB();
            const { license_key, device_id, machine_info } = req.body || {};

            if (!license_key) {
                return res.status(400).json({ success: false, error: 'License key required' });
            }

            console.log(`[Activate] Activating key: ${license_key}`);
            const license = await License.findOne({ license_key });

            if (!license) {
                return res.status(200).json({ success: false, error: 'Invalid license key' });
            }

            if (license.status === 'revoked') {
                return res.status(200).json({ success: false, error: 'License revoked', message: 'This license has been permanently deactivated.' });
            }

            if (license.status === 'active' && license.device_id !== device_id) {
                return res.status(200).json({ success: false, error: 'Already in use', message: 'This license is already registered to another device.' });
            }

            // Perform Activation
            license.device_id = device_id;
            license.status = 'active';
            license.activated_at = new Date();
            license.machine_info = machine_info;
            await license.save();

            return res.status(200).json({ 
                success: true, 
                message: 'Activation successful',
                license: {
                    status: license.status,
                    expires_at: license.expires_at
                }
            });

        } catch (error) {
            console.error('[Activate Error]', error);
            return res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
        }
    }
    
    // Fallback 404
    console.log(`[Vercel 404] No match for Path: ${path} | Original: ${originalPath}`);
    return res.status(404).json({ 
        error: 'Not Found', 
        message: `Keygen handler: Route ${req.method} ${path} not found`,
        debug: {
            path,
            originalPath,
            method: req.method
        }
    });
}

export const config = {
    api: {
        bodyParser: true,
    },
};
