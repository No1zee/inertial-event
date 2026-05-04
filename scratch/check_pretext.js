
const Pretext = require('@chenglou/pretext');
console.log('Pretext Module Keys:', Object.keys(Pretext));
console.log('prepareWithSegments exists:', typeof Pretext.prepareWithSegments === 'function');
console.log('layoutWithLines exists:', typeof Pretext.layoutWithLines === 'function');
