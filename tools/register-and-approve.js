const axios = require('axios');
const fs = require('fs');

const ID = fs.readFileSync('device_id.txt', 'utf8').trim();
const API = 'http://localhost:3000/api';
const ADMIN = 'http://localhost:3000/api/admin';

async function register() {
    try {
        console.log('Registering ID:', ID);
        const req = await axios.post(`${API}/request-access`, {
            device_id: ID,
            machine_name: 'Dev-Test-PC',
            machine_fingerprint: 'manual-test'
        });
        console.log('Request:', req.data);

        // Approve
        console.log('Approving...');
        const app = await axios.post(`${ADMIN}/approve`, {
            request_id: req.data.request_id,
            access_type: 'permanent',
            duration_days: 999
        });
        console.log('Approved. Key:', app.data.license_key);
        
        fs.writeFileSync('license.key', app.data.license_key);

    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

register();
