import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'http://localhost:4000/api';
const ADMIN_URL = 'http://localhost:4000/api/admin/admin'; // Note the prefix logic in app.js

// app.js line 18: const apiPrefix = process.env.VERCEL ? '/api/keygen/api' : '/api';
// app.js line 19: app.use(apiPrefix, apiRoutes);
// app.js line 20: app.use(apiPrefix + '/admin', adminRoutes);
// So local admin is /api/admin

async function runTest() {
    try {
        const device_id = 'test-device-' + Date.now();
        console.log(`🤖 Testing with Device ID: ${device_id}`);

        // 1. Request Access
        console.log('\n--- 1. Requesting Access ---');
        const reqRes = await axios.post(`${BASE_URL}/request-access`, {
            device_id: device_id,
            machine_name: 'TestMachine',
            machine_fingerprint: 'cpu-id-12345'
        });
        console.log('Response:', reqRes.data);
        const request_id = reqRes.data.request_id;

        // 2. Check Status (Should be pending)
        console.log('\n--- 2. Checking Status (Pending) ---');
        const statusRes1 = await axios.post(`${BASE_URL}/check-status`, { device_id });
        console.log('Status:', statusRes1.data);

        // 3. Admin Approve
        console.log('\n--- 3. Admin Approving ---');
        const approveRes = await axios.post(`${BASE_URL}/admin/approve`, {
            request_id: request_id, 
            access_type: 'permanent',
            duration_days: 365
        }, {
            headers: { 'x-admin-key': process.env.MASTER_KEY }
        });
        console.log('Approval:', approveRes.data);
        const license_key = approveRes.data.license_key;

        // 4. Check Status (Should be approved)
        console.log('\n--- 4. Checking Status (Approved) ---');
        const statusRes2 = await axios.post(`${BASE_URL}/check-status`, { device_id });
        console.log('Status:', statusRes2.data);
        
        // 5. Validate License
        console.log('\n--- 5. Validating License ---');
        const validateRes = await axios.post(`${BASE_URL}/validate`, {
            license_key: license_key,
            device_id: device_id
        });
        console.log('Validation:', validateRes.data);

        if (validateRes.data.valid) {
            console.log('\n✅ TEST PASSED: Full flow working');
        } else {
            console.error('\n❌ TEST FAILED: Validation failed');
        }

    } catch (error) {
        console.error('❌ TEST ERROR:', error.response ? error.response.data : error.message);
    }
}

runTest();
