import License from '../models/License.js';

export const validateLicense = async (req, res) => {
    try {
        const { license_key, device_id } = req.body;

        if (!license_key || !device_id) {
            return res.status(400).json({ valid: false, error: 'License key and Device ID required' });
        }

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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

