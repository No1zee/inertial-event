const torrentService = require('./services/TorrentService');

async function test() {
    console.log('--- TEST START ---');
    try {
        const magnet = 'magnet:?xt=urn:btih:7FCD53222651BCC62ADB6BAA8FDBF7';
        console.log('Calling startStream...');
        const result = await torrentService.startStream(magnet);
        console.log('startStream resolved to:', result);
        
        if (result === undefined) {
            console.error('FAIL: startStream resolved to undefined!');
        } else {
            console.log('SUCCESS: startStream resolved to a value.');
        }
    } catch (e) {
        console.error('ERROR during setup:', e);
    }
    process.exit(0);
}

test();
