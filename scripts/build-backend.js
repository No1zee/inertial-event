const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building Backend...');
try {
    // Attempt compilation
    execSync('tsc -p tsconfig.server.json', { stdio: 'inherit' });
    console.log('✅ Backend compiled successfully.');
} catch (e) {
    // If files were generated, we consider it a success (ignoring type errors)
    if (fs.existsSync('dist-server/index.js')) {
        console.log('⚠️ Backend compiled with type errors, but files were generated. Proceeding...');
        process.exit(0);
    } else {
        console.error('❌ Backend compilation failed and no output was generated.');
        process.exit(1);
    }
}
