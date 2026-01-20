const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/sources?id=1306368&type=movie&title=The%20Rip&season=1&episode=1',
    method: 'GET'
};

console.log('Sending request...');
const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
    res.on('end', () => console.log('\nDone'));
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.end();
