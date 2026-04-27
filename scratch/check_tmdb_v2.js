const { META } = require('@consumet/extensions');

const tmdb = new META.TMDB();
console.log('TMDB instance keys:', Object.keys(tmdb));
console.log('TMDB prototype keys:', Object.getOwnPropertyNames(tmdb.__proto__));
console.log('TMDB prototype prototype keys:', Object.getOwnPropertyNames(tmdb.__proto__.__proto__));
