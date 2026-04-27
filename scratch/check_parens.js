const fs = require('fs');
const content = fs.readFileSync('c:/Projects/nova_v2/src/components/player/VidlinkPlayer.tsx', 'utf8');
let open = 0;
let closed = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '(') open++;
    if (content[i] === ')') closed++;
}
console.log('Open:', open, 'Closed:', closed);
