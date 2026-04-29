// Script to restore API routes after Electron build
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const backupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');

if (fs.existsSync(backupDir)) {
  // Move backup back to API directory
  if (!fs.existsSync(apiDir)) {
    fs.renameSync(backupDir, apiDir);
    console.log('✅ Restored API routes from backup');
  } else {
    console.log('⚠️  API directory already exists, removing backup');
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
} else {
  console.log('ℹ️  No backup found to restore');
}
