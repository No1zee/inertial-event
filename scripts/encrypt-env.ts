import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// These must match the key/iv in the Electron app's LicenseManager
const ENCRYPTION_KEY = Buffer.from('4ee9ccf17e082f9d5a9c3b88e04b4d7f6c3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c', 'hex'); // 32 bytes
const IV = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'hex'); // 16 bytes

async function encryptEnv() {
    const envPath = path.join(process.cwd(), '.env');
    const outDir = path.join(process.cwd(), 'assets');
    const outPath = path.join(outDir, 'env.enc');

    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found!');
        process.exit(1);
    }

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }

    console.log('🔒 Encrypting .env...');

    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Validate we can parse it
    const parsed = dotenv.parse(envContent);
    console.log(`📝 Found ${Object.keys(parsed).length} variables.`);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(envContent, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    fs.writeFileSync(outPath, encrypted);
    console.log(`✅ Success! Encrypted payload saved to: ${outPath}`);
}

encryptEnv().catch(err => {
    console.error('💥 Encryption failed:', err);
    process.exit(1);
});
