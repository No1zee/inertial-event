import express from 'express';
const router = express.Router();
import * as requestController from '../controllers/requestController.js';
import * as licenseController from '../controllers/licenseController.js';
import License from '../models/License.js';

router.post('/request-access', requestController.requestAccess);
router.post('/check-status', requestController.checkStatus);
router.post('/validate', licenseController.validateLicense);

// ACTIVATE - First-time device binding
router.post('/activate', async (req, res) => {
    try {
        const { license_key, device_id, machine_fingerprint, machine_name } = req.body;

        if (!license_key || !device_id) {
            return res.status(400).json({ success: false, error: 'License key and device ID required' });
        }

        // Find the license
        const license = await License.findOne({ license_key });
        
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

        // Bind device to license
        license.device_id = device_id;
        license.status = 'active';
        await license.save();

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

export { router as apiRoutes };
