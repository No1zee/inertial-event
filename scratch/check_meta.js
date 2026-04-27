const { META } = require('@consumet/extensions');

if (META) {
    console.log('META providers:', Object.keys(META));
    const anilist = new META.Anilist();
    console.log('Anilist methods:', Object.getPrototypeOf(anilist));
} else {
    console.log('META is undefined');
}
