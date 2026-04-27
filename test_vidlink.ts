import axios from 'axios';

async function testVidlink() {
    const tmdbId = '94664';
    const type = 'tv';
    const season = 1;
    const episode = 1;
    const BASE_URL = 'https://vidlink.pro/api';

    try {
        const url = `${BASE_URL}/get-sources?id=${tmdbId}&type=${type}&season=${season}&episode=${episode}`;
        console.log(`Calling: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://vidlink.pro/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            },
            timeout: 10000
        });

        console.log('Response Status:', response.status);
        console.log('Sources Found:', response.data.sources?.length || 0);
        if (response.data.sources) {
            response.data.sources.forEach((s: any, i: number) => {
                console.log(`Source ${i}: ${s.file || s.url}`);
            });
        }
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testVidlink();
