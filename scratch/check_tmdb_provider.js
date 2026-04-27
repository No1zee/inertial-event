const { META, MOVIES } = require('@consumet/extensions');

const sflix = new MOVIES.SFlix();
const tmdb = new META.TMDB(sflix);
console.log('TMDB with SFlix provider initialized');
console.log('TMDB provider name:', tmdb.provider.name);
