
import { MOVIES } from '@consumet/extensions';

async function testFlixHQ() {
    const flixhq = new MOVIES.FlixHQ();
    const query = 'Half Man';
    console.log(`Searching FlixHQ for "${query}"...`);
    try {
        const results = await flixhq.search(query);
        console.log('Results:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testFlixHQ();
