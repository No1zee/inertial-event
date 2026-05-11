
const TorrentService = require('./services/TorrentService');

async function testIdempotency() {
    const service = new TorrentService();
    
    // Mock webtorrent
    service.client = {
        add: (magnet, cb) => {
            console.log('Mock: Adding magnet', magnet);
            setTimeout(() => {
                cb({
                    name: 'Test Torrent',
                    files: [{ name: 'test.mp4', length: 1000, select: () => {}, path: 'test.mp4' }],
                    createServer: () => ({
                        listen: (port, cb2) => {
                            setTimeout(() => cb2(), 100);
                        },
                        address: () => ({ port: 1234 }),
                        close: (cb3) => cb3()
                    }),
                    destroy: (opts, cb4) => cb4(),
                    on: () => {}
                });
            }, 500);
        },
        once: () => {}
    };
    service.initClient = () => {}; // Prevent actual initialization

    console.log('--- Test 1: Simultaneous calls for SAME magnet ---');
    const m1 = 'magnet:?xt=urn:btih:1';
    
    const p1 = service.startStream(m1);
    const p2 = service.startStream(m1);
    
    console.log('P1 is Promise:', p1 instanceof Promise);
    console.log('P2 is Promise:', p2 instanceof Promise);
    console.log('P1 === P2:', p1 === p2); // Should be true now!

    const results = await Promise.all([p1, p2]);
    console.log('Results match:', results[0].url === results[1].url);

    console.log('\n--- Test 2: Call for DIFFERENT magnet while starting ---');
    const m2 = 'magnet:?xt=urn:btih:2';
    const p3 = service.startStream(m1); // Start first
    try {
        await service.startStream(m2); // Start second (different)
    } catch (e) {
        console.log('Caught expected error for different magnet:', e.message);
    }
    await p3;

    console.log('\n--- Test 3: Sequential calls for SAME magnet (after finish) ---');
    const res1 = await service.startStream(m1);
    console.log('Res1 URL:', res1.url);
    const res2 = await service.startStream(m1);
    console.log('Res2 URL:', res2.url);
    console.log('Success:', res2.url === res1.url);

    process.exit(0);
}

testIdempotency().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
