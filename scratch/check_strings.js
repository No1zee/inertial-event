const fs = require('fs');
const content = fs.readFileSync('c:/Projects/nova_v2/src/components/player/VidlinkPlayer.tsx', 'utf8');
let single = 0;
let double = 0;
let backtick = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === "'") {
        if (i > 0 && content[i-1] === '\\') continue;
        single++;
    }
    if (content[i] === '"') {
        if (i > 0 && content[i-1] === '\\') continue;
        double++;
    }
    if (content[i] === '`') {
        if (i > 0 && content[i-1] === '\\') continue;
        backtick++;
    }
}
console.log('Single:', single % 2 === 0, 'Double:', double % 2 === 0, 'Backtick:', backtick % 2 === 0);
