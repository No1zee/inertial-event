const { META } = require('@consumet/extensions');

async function testTMDB() {
    const tmdb = new META.TMDB();
    const contentId = 'tt0944947'; // Game of Thrones
    
    console.log(`--- Testing TMDB for ${contentId} ---`);
    try {
        const info = await tmdb.fetchMediaInfo(contentId, 'tv');
        console.log('Media info fetched successfully');
        
        const season = info.seasons[0];
        const episode = season.episodes[0];
        
        if (episode?.id) {
            console.log(`Fetching sources for Episode: ${episode.id}`);
            const result = await tmdb.fetchEpisodeSources(episode.id, contentId);
            console.log('Sources found:', result.sources.length);
            console.log('First source:', result.sources[0]?.url);
        }
    } catch (e) {
        console.error('TMDB failed:', e.message);
    }
}

testTMDB();
