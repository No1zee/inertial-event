import express from 'express';
const router = express.Router();
import { License } from '../models/License.js';
import { AccessRequest } from '../models/AccessRequest.js';
import { generateLicenseKey } from '../utils/crypto.js';

// Middleware to check admin access key
const adminAuth = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    
    // Trust local requests from the integrated Electron dashboard
    const isLocal = req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost';

    if (isLocal || (adminKey && adminKey === process.env.MASTER_KEY)) {
        return next();
    }
    
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin Key' });
};

// GET all requests
router.get('/requests', adminAuth, async (req, res) => {
    try {
        const requests = await AccessRequest.find().sort({ requested_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPROVE request
router.post('/approve', adminAuth, async (req, res) => {
    try {
        const { request_id, access_type, duration_days } = req.body;
        
        // Get request
        const request = await AccessRequest.findOne({ id: request_id });
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Generate Key
        const license_key = generateLicenseKey({ 
            device_id: request.device_id, 
            type: access_type, 
            created_at: Date.now() 
        });

        let expires_at = null;
        if (duration_days) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(duration_days));
            expires_at = date;
        }

        // Create License
        await License.create({
            license_key,
            device_id: request.device_id,
            access_type: access_type || 'permanent',
            expires_at,
            status: 'active'
        });

        // Update Request
        request.status = 'approved';
        await request.save();

        res.json({ success: true, license_key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// REJECT request
router.post('/reject', adminAuth, async (req, res) => {
    try {
        const { request_id } = req.body;
        await AccessRequest.findOneAndUpdate({ id: request_id }, { status: 'rejected' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all licenses
router.get('/licenses', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ created_at: -1 });
        res.json(licenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GENERATE KEY (Direct - no request required)
router.post('/generate-key', adminAuth, async (req, res) => {
    try {
        const { user_email, access_type = 'permanent', duration_days } = req.body;
        
        // Generate unique keyword
        const license_key = generateLicenseKey({
            email: user_email,
            type: access_type,
            created_at: Date.now()
        });

        let expires_at = null;
        if (duration_days) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(duration_days));
            expires_at = date;
        }

        // Insert as UNBOUND license (no device_id yet)
        await License.create({
            license_key,
            device_id: null,
            access_type,
            expires_at,
            status: 'unused',
            created_by: user_email || 'admin'
        });

        res.json({ 
            success: true, 
            license_key,
            access_type,
            expires_at
        });
    } catch (err) {
        console.error('Generate Key Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// REVOKE license
router.post('/revoke', adminAuth, async (req, res) => {
    const { license_key } = req.body;
    try {
        await License.findOneAndUpdate({ license_key }, { status: 'revoked' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export { router as adminRoutes };

