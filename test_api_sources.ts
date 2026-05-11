import axios from 'axios';

async function testApiSources() {
    const params = {
        id: '1396',
        type: 'tv',
        season: '1',
        episode: '1',
        title: 'Breaking Bad'
    };
    
    try {
        console.log('Fetching sources from local backend...');
        const response = await axios.get('http://localhost:5000/api/sources', { params });
        console.log('Response Status:', response.status);
        const data = response.data;
        console.log('Total Sources Found:', data.sources.length);
        
        const nativeSources = data.sources.filter((s: any) => s.type === 'hls' || s.type === 'mp4');
        console.log('Native (HLS/MP4) Sources:', nativeSources.length);
        
        nativeSources.forEach((s: any, i: number) => {
            console.log(`Source ${i}: [${s.type}] [${s.quality}] ${s.provider} -> ${s.url.substring(0, 100)}...`);
        });

        const embedSources = data.sources.filter((s: any) => s.type === 'embed');
        console.log('Embed Sources:', embedSources.length);
        embedSources.forEach((s: any, i: number) => {
             console.log(`Embed ${i}: ${s.provider} -> ${s.url}`);
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testApiSources();
