const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const src = path.join(__dirname, '../keygen-server/admin-dashboard/dist');
const dest = path.join(__dirname, '../public/keygen-admin');

console.log(`Copying from ${src} to ${dest}...`);
try {
    copyRecursiveSync(src, dest);
    console.log('Successfully copied Keygen Admin UI.');
} catch (err) {
    console.error('Error copying Keygen Admin UI:', err);
    process.exit(1);
}
