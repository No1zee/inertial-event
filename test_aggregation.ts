import { sourceService } from './backend/src/services/sourceService.js';

async function testAggregation() {
    console.log("--- STARTING SOURCE AGGREGATION TEST ---");
    
    // Testing with "Deadpool & Wolverine" (TMDB: 533535) or similar high-availability content
    const tmdbId = "533535"; 
    const title = "Deadpool & Wolverine";
    const type = "movie";
    
    console.log(`Testing for: ${title} (${tmdbId})`);
    
    try {
        const result = await sourceService.getAllSources(tmdbId, 0, 0, title, type);
        
        console.log(`\nFound ${result.sources.length} total sources.`);
        
        const summary = {
            hls: result.sources.filter(s => s.type === 'hls').length,
            mp4: result.sources.filter(s => s.type === 'mp4').length,
            torrent: result.sources.filter(s => s.type === 'torrent' || s.type === 'magnet').length,
            embed: result.sources.filter(s => s.type === 'embed').length
        };
        
        console.table(summary);
        
        console.log("\n--- TOP 10 SOURCES (PRIORITIZED) ---");
        result.sources.slice(0, 10).forEach((s, i) => {
            console.log(`[${i+1}] [${s.type.toUpperCase()}] ${s.provider} - Quality: ${s.quality}`);
            if (s.type === 'torrent') {
                console.log(`    Title: ${s.title || 'N/A'} (Seeds: ${s.seeders || 0})`);
            } else {
                console.log(`    URL: ${s.url.substring(0, 100)}${s.url.length > 100 ? '...' : ''}`);
            }
        });

    } catch (error) {
        console.error("Aggregation failed:", error);
    }
}

testAggregation();
