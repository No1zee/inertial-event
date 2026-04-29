import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '0e32674bae6ecae7dcbf20a4e47790a7';
const BASE_URL = 'https://api.themoviedb.org/3';

async function testTmdb() {
  console.log('--- TMDB Connectivity Test ---');
  console.log(`Using API Key: ${TMDB_KEY.substring(0, 4)}...${TMDB_KEY.substring(TMDB_KEY.length - 4)}`);
  
  const endpoints = [
    { name: 'Trending All', url: `${BASE_URL}/trending/all/day?api_key=${TMDB_KEY}` },
    { name: 'Popular TV', url: `${BASE_URL}/tv/popular?api_key=${TMDB_KEY}` },
    { name: 'Configuration', url: `${BASE_URL}/configuration?api_key=${TMDB_KEY}` }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name}...`);
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, { timeout: 5000 });
      const duration = Date.now() - startTime;
      
      console.log(`✅ Success (${duration}ms)`);
      console.log(`   Results: ${response.data.results ? response.data.results.length : 'N/A'}`);
      if (response.data.results && response.data.results.length > 0) {
        console.log(`   First Item: ${response.data.results[0].title || response.data.results[0].name}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${endpoint.name}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }
  }
}

testTmdb();
