
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const baseUrl = 'https://api.themoviedb.org/3';
const headers = {
    Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
    accept: 'application/json'
};
const params = {
    language: 'en-US',
    query: 'Half Man',
    include_adult: false,
    page: 1
};


async function testSearch() {
    try {
        console.log('Searching for "Halfman"...');
        const token = process.env.TMDB_READ_ACCESS_TOKEN;
        const apiKey = process.env.TMDB_API_KEY;
        
        const finalHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const finalParams = { ...params };
        if (!token && apiKey) finalParams.api_key = apiKey;

        const response = await axios.get(`${baseUrl}/search/multi`, { 
            headers: finalHeaders, 
            params: finalParams 
        });
        console.log('Results:', JSON.stringify(response.data.results, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}


testSearch();
