const { META, ANIME, MOVIES } = require('@consumet/extensions');

async function testConsumet() {
    const tmdb = new META.TMDB();
    const hianime = new ANIME.Hianime();
    
    const tmdbId = '94664'; // Mushoku Tensei
    
    console.log('--- Testing META.TMDB ---');
    try {
        const info = await tmdb.fetchMediaInfo(tmdbId, 'tv');
        console.log('Title:', info.title);
        // Try to get sources for S1E1
        const season = info.seasons.find(s => s.season === 1);
        const episode = season.episodes.find(e => e.episode === 1);
        console.log('Episode ID:', episode.id);
        
        const sources = await tmdb.fetchEpisodeSources(episode.id, tmdbId);
        console.log('Sources:', JSON.stringify(sources.sources).substring(0, 200));
    } catch (e) {
        console.log('META.TMDB Error:', e.message);
    }

    console.log('\n--- Testing ANIME.Hianime ---');
    try {
        const search = await hianime.search('Mushoku Tensei');
        const animeId = search.results[0].id;
        console.log('Anime ID:', animeId);
        const info = await hianime.fetchAnimeInfo(animeId);
        const epId = info.episodes[0].id;
        console.log('Episode ID:', epId);
        const sources = await hianime.fetchEpisodeSources(epId);
        console.log('Sources:', JSON.stringify(sources.sources).substring(0, 200));
    } catch (e) {
        console.log('ANIME.Hianime Error:', e.message);
    }
}

testConsumet();
