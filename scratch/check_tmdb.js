const { META } = require('@consumet/extensions');

const tmdb = new META.TMDB();
console.log('TMDB methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(tmdb)));
