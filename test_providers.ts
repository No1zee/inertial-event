import axios from 'axios';

async function testProvider(name: string, url: string, headers: any = {}) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                ...headers
            },
            timeout: 10000
        });
        console.log('Status:', response.status);
        console.log('Data Snippet:', JSON.stringify(response.data).substring(0, 200));
        return true;
    } catch (error: any) {
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Response Status:', error.response.status);
            // console.log('Response Data:', error.response.data.substring(0, 200));
        }
        return false;
    }
}

async function runTests() {
    const tmdbId = '94664';
    const imdbId = 'tt11623802'; // Mushoku Tensei S1
    
    // Test Vidlink variations
    await testProvider('Vidlink get-sources', `https://vidlink.pro/api/get-sources?tmdbId=${tmdbId}&season=1&episode=1`, { 'Referer': 'https://vidlink.pro/' });
    await testProvider('Vidlink sources', `https://vidlink.pro/api/sources?tmdbId=${tmdbId}&season=1&episode=1`, { 'Referer': 'https://vidlink.pro/' });
    await testProvider('Vidlink get-source', `https://vidlink.pro/api/get-source?tmdbId=${tmdbId}&season=1&episode=1`, { 'Referer': 'https://vidlink.pro/' });

    // Test Vidsrc variations
    await testProvider('Vidsrc.xyz', `https://vidsrc.xyz/api/source/${tmdbId}?type=tv&season=1&episode=1`);
    await testProvider('Vidsrc.me', `https://vidsrc.me/api/source/${imdbId}`);
    
    // Test alternative
    await testProvider('2embed', `https://www.2embed.cc/api/get_sources?id=${tmdbId}&s=1&e=1`);
}

runTests();
