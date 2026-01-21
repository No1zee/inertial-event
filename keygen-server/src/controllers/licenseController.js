import { License } from '../models/License.js';
import { connectDB } from '../config/db.js';

export const validateLicense = async (req, res) => {
    try {
        console.log('[LicenseController] Validating request...');
        await connectDB();
        const { license_key, device_id, machine_info } = req.body;

        if (!license_key) {
            return res.status(400).json({ valid: false, error: 'License key required' });
        }

        console.log(`[LicenseController] Searching for key: ${license_key.substring(0, 8)}...`);
        const license = await License.findOne({ license_key });

        if (!license) {
            return res.status(404).json({ valid: false, error: 'Invalid license key' });
        }

        if (license.status !== 'active') {
             // Special case: if it's 'unused', we link it to the device_id
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
            const now = new Date();
            const expires = new Date(license.expires_at);
            if (now > expires) {
                return res.json({ valid: false, error: 'License expired' });
            }
        }

        res.json({ 
            valid: true, 
            expires_at: license.expires_at,
            access_type: license.access_type
        });

    } catch (error) {
        console.error('Validation Error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

