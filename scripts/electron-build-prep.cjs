// Script to prepare for Electron build by temporarily moving API routes
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

if (fs.existsSync(apiDir)) {
  const backupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');
  
  // Move API directory to backup
  if (!fs.existsSync(backupDir)) {
    fs.renameSync(apiDir, backupDir);
    console.log('✅ Moved API routes to backup for Electron build');
  } else {
    console.log('⚠️  Backup already exists, skipping move');
  }
} else {
  console.log('ℹ️  No API directory found');
}
