const { MOVIES } = require('@consumet/extensions');

async function testFlixHQ() {
    const flixhq = new MOVIES.FlixHQ();
    const query = 'Mushoku Tensei';
    
    console.log(`--- Testing FlixHQ for ${query} ---`);
    try {
        const search = await flixhq.search(query);
        if (!search.results || search.results.length === 0) {
            console.log('No results found.');
            return;
        }
        
        const id = search.results[0].id;
        console.log('ID:', id);
        
        const info = await flixhq.fetchMediaInfo(id);
        const ep = info.episodes[0];
        console.log('Episode ID:', ep.id);
        
        const sources = await flixhq.fetchEpisodeSources(ep.id, id);
        console.log('Sources:', JSON.stringify(sources.sources, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}

testFlixHQ();
