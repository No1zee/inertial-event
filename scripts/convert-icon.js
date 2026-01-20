const fs = require('fs');
const png2icons = require('png2icons');
const path = require('path');

const input = path.join(__dirname, '../build/icon.png');
const output = path.join(__dirname, '../build/icon.ico');

console.log(`Reading ${input}...`);
const inputImg = fs.readFileSync(input);

console.log(`Converting to ICO...`);
const outputImg = png2icons.createICO(inputImg, png2icons.BICUBIC2, 0, false, true);

if (outputImg) {
    fs.writeFileSync(output, outputImg);
    console.log(`Success! Icon created, size: ${outputImg.length} bytes`);
} else {
    console.error('Failed to create ICO');
    process.exit(1);
}
