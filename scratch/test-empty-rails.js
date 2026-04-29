const axios = require('axios');

const TMDB_KEY = '0e32674bae6ecae7dcbf20a4e47790a7'; // From .env
const BASE_URL = 'https://api.themoviedb.org/3';

const getTmdbUrl = (endpoint, params = '') => {
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${BASE_URL}${endpoint}${separator}api_key=${TMDB_KEY}${params ? '&' + params : ''}`;
};

async function test() {
  console.log('--- Testing Underrated (Hidden Gems) ---');
  try {
    const url = getTmdbUrl('/discover/movie', 'sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=1');
    const res = await axios.get(url);
    console.log(`Results: ${res.data.results.length}`);
    if (res.data.results.length > 0) console.log(`First: ${res.data.results[0].title}`);
  } catch (e) {
    console.error('Underrated failed:', e.message);
  }

  console.log('\n--- Testing Genre 12 (Epic Adventures) ---');
  try {
    const url = getTmdbUrl('/discover/movie', 'with_genres=12&sort_by=popularity.desc&language=en-US&page=1');
    const res = await axios.get(url);
    console.log(`Results: ${res.data.results.length}`);
    if (res.data.results.length > 0) console.log(`First: ${res.data.results[0].title}`);
  } catch (e) {
    console.error('Genre 12 failed:', e.message);
  }
}

test();
