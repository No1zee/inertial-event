const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ENCRYPTION_KEY = Buffer.from('4ee9ccf17e082f9d5a9c3b88e04b4d7f6c3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', 'hex');
const IV = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'hex');

const envPath = path.join(__dirname, 'assets', 'env.enc');

try {
    if (!fs.existsSync(envPath)) {
        console.log('No env.enc found at', envPath);
        process.exit(1);
    }
    
    const encryptedRaw = fs.readFileSync(envPath, 'utf8').trim();
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    
    let decrypted = decipher.update(encryptedRaw, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('--- DECRYPTED ENV ---');
    console.log(decrypted);
    console.log('---------------------');
} catch (e) {
    console.error('Decryption failed:', e.message);
}
