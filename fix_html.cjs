
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');

if (!fs.existsSync(outDir)) {
    console.log('No static output directory (out/) found. Skipping HTML path fix.');
    process.exit(0);
}

function getAllHtmlFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.html')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

try {
    const htmlFiles = getAllHtmlFiles(outDir);

    htmlFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        const relativePath = path.relative(path.dirname(file), outDir);
        const prefix = relativePath ? relativePath.replace(/\\/g, '/') + '/' : './';

        // Replace /_next with relative path
        content = content.replace(/"\/_next\//g, `"${prefix}_next/`);
        content = content.replace(/"\/images\//g, `"${prefix}images/`);
        content = content.replace(/"\/favicon.ico"/g, `"${prefix}favicon.ico"`);
        
        fs.writeFileSync(file, content);
        console.log(`Fixed paths in ${file}`);
    });
    
    console.log('HTML fix complete.');
} catch (e) {
    console.log('Error during HTML fix:', e.message);
}
