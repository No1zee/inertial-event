// Script to prepare for Electron build by temporarily moving API routes
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const backupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');

if (fs.existsSync(apiDir)) {
  // If backup exists, it might be stale. Remove it first to ensure clean move.
  if (fs.existsSync(backupDir)) {
    console.log('⚠️  Stale backup found, purging before move...');
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  
  // Move API directory to backup
  try {
    fs.renameSync(apiDir, backupDir);
    console.log('✅ Moved API routes to backup for Electron build');
  } catch (err) {
    console.error('❌ Failed to move API routes:', err.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No API directory found');
}
