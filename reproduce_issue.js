const http = require('http');
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.env.APPDATA, 'NovaStream', 'startup.log');

console.log('--- Startup Log Tail (Before Request) ---');
try {
    const logs = fs.readFileSync(logPath, 'utf8');
    console.log(logs.slice(-500));
} catch (e) { console.log('Log not found'); }

console.log('\n--- Sending Request to localhost:5000 ---');
const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/sources?id=1306368&type=movie&title=The%20Rip&season=1&episode=1',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        console.log(`BODY: ${body}`);
        console.log('\n--- Startup Log Tail (After Request) ---');
        setTimeout(() => {
            try {
                const logs = fs.readFileSync(logPath, 'utf8');
                console.log(logs.slice(-2000));
            } catch (e) { console.error('Error reading log:', e.message); }
        }, 2000);
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.end();
