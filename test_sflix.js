const { MOVIES } = require('@consumet/extensions');

async function testAlternatives() {
    const providers = [
        { name: 'SFlix', instance: new MOVIES.SFlix() },
        { name: 'HiMovies', instance: new MOVIES.HiMovies() },
        { name: 'Goku', instance: new MOVIES.Goku() },
    ];
    const query = 'Breaking Bad';
    
    for (const { name, instance } of providers) {
        console.log(`\n--- Testing ${name} for "${query}" ---`);
        try {
            const search = await instance.search(query);
            if (!search.results || search.results.length === 0) {
                console.log(`${name}: No results found.`);
                continue;
            }
            console.log(`${name}: Found ${search.results.length} results`);
            const id = search.results[0].id;
            console.log(`${name}: Best match: "${search.results[0].title}" (${id})`);
            
            const info = await instance.fetchMediaInfo(id);
            const eps = info.episodes || [];
            console.log(`${name}: Episodes: ${eps.length}`);
            if (eps.length > 0) {
                console.log(`${name}: ✅ WORKING - Episode ID: ${eps[0].id}`);
            }
        } catch (e) {
            console.log(`${name}: ❌ FAILED - ${e.message}`);
        }
    }
}

testAlternatives();
