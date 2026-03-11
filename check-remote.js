const https = require('https');

const postData = JSON.stringify({
    license_key: 'NVS-AC95-9F36-B172',
    device_id: 'DIAGNOSTIC-DEVICE'
});

const options = {
    hostname: 'inertial-event.vercel.app',
    path: '/api/keygen/api/validate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('--- VALIDATION TEST ---');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        console.log('-----------------------');
    });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
