const { consumetService } = require('../backend/src/services/consumetService');
const { ProviderConfig } = require('../backend/src/services/../config/ProviderConfig');

// Mock config for test
ProviderConfig.consumet.enabled = true;

async function testConsumet() {
    console.log('Testing Consumet with Interstellar (157336)...');
    try {
        const links = await consumetService.getStreamingLinks('157336', undefined, undefined, 'movie');
        console.log('Interstellar Links:', JSON.stringify(links, null, 2));
    } catch (e) {
        console.error('Interstellar test failed:', e);
    }

    console.log('\nTesting Consumet with One Piece (37854) - S1E1...');
    try {
        const links = await consumetService.getStreamingLinks('37854', 1, 1, 'tv');
        console.log('One Piece Links:', JSON.stringify(links, null, 2));
    } catch (e) {
        console.error('One Piece test failed:', e);
    }
}

testConsumet();
