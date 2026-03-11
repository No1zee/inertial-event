const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from('4ee9ccf17e082f9d5a9c3b88e04b4d7f6c3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', 'hex');
const IV = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'hex');

async function testParse() {
    const envEncPath = path.join(process.cwd(), 'assets', 'env.enc');
    if (!fs.existsSync(envEncPath)) {
        console.error('File not found:', envEncPath);
        return;
    }

    const encryptedRaw = fs.readFileSync(envEncPath, 'utf8').trim();
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    
    let decrypted = decipher.update(encryptedRaw, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    console.log('Decrypted Length:', decrypted.length);
    console.log('Decrypted content (escaped):', JSON.stringify(decrypted).substring(0, 500));

    const keysLoaded = [];
    const lines = decrypted.split(/\r?\n/);
    console.log('Line count:', lines.length);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        console.log(`Line ${i}: [${line}] -> Trimmed: [${trimmed}]`);
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            
            keysLoaded.push(key);
            console.log(`  -> Key: ${key}`);
        }
    }

    console.log('All Keys Loaded:', keysLoaded.join(', '));
}

testParse();
