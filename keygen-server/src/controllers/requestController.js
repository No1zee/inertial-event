import { v4 as uuidv4 } from 'uuid';
import AccessRequest from '../models/AccessRequest.js';
import License from '../models/License.js';

export const requestAccess = async (req, res) => {
    try {
        const { device_id, machine_name, machine_fingerprint, user_email } = req.body;

        if (!device_id) {
            return res.status(400).json({ error: 'Device ID is required' });
        }

        // Check if device already has a request
        const existing = await AccessRequest.findOne({ device_id });
        
        if (existing) {
            return res.json({ 
                request_id: existing.id, 
                status: existing.status,
                message: 'Request already exists' 
            });
        }

        const id = uuidv4();
        await AccessRequest.create({
            id,
            device_id,
            machine_fingerprint,
            machine_name,
            ip_address: req.ip,
            user_email
        });

        res.json({ 
            request_id: id, 
            status: 'pending',
            message: 'Access request submitted successfully' 
        });

    } catch (error) {
        console.error('Request Access Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const checkStatus = async (req, res) => {
    try {
        const { device_id } = req.body;
        
        if (!device_id) return res.status(400).json({ error: 'Device ID required' });

        const request = await AccessRequest.findOne({ device_id });
        
        if (!request) return res.status(404).json({ error: 'Request not found' });
        
        // If approved, verify if license exists
        let license_key = null;
        if (request.status === 'approved') {
            const license = await License.findOne({ device_id });
            if (license) license_key = license.license_key;
        }

        res.json({ 
            status: request.status,
            license_key 
        });

    } catch (error) {
        console.error('Check Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

