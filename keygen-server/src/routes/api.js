const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const licenseController = require('../controllers/licenseController');

router.post('/request-access', requestController.requestAccess);
router.post('/check-status', requestController.checkStatus);
router.post('/validate', licenseController.validateLicense);

// ACTIVATE - First-time device binding
router.post('/activate', (req, res) => {
    try {
        const { license_key, device_id, machine_fingerprint, machine_name } = req.body;

        if (!license_key || !device_id) {
            return res.status(400).json({ success: false, error: 'License key and device ID required' });
        }

        const db = require('../config/db');
        
        // Find the license
        const license = db.prepare('SELECT * FROM licenses WHERE license_key = ?').get(license_key);
        
        if (!license) {
            return res.status(404).json({ success: false, error: 'Invalid license key' });
        }

        if (license.status === 'revoked') {
            return res.json({ success: false, error: 'This license has been revoked' });
        }

        // Check if already bound to different device
        if (license.device_id && license.device_id !== device_id) {
            return res.json({ success: false, error: 'License already activated on another device' });
        }

        // Check expiry
        if (license.expires_at) {
            const now = new Date();
            const expires = new Date(license.expires_at);
            if (now > expires) {
                return res.json({ success: false, error: 'License has expired' });
            }
        }

        // Bind device to license (first activation or re-activation on same device)
        db.prepare(`
            UPDATE licenses 
            SET device_id = ?, status = 'active'
            WHERE license_key = ?
        `).run(device_id, license_key);

        // Log activation
        console.log(`[Activate] Key ${license_key.substring(0, 8)}... bound to device ${device_id.substring(0, 8)}...`);

        res.json({ 
            success: true, 
            message: 'License activated successfully',
            access_type: license.access_type,
            expires_at: license.expires_at
        });

    } catch (err) {
        console.error('Activation Error:', err);
        res.status(500).json({ success: false, error: 'Server error during activation' });
    }
});

module.exports = router;
