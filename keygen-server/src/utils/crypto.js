const crypto = require('crypto');

// Master key - Ensure exactly 32 bytes using SHA256 of the env secret
const MASTER_KEY = crypto.createHash('sha256').update(process.env.MASTER_KEY || 'default-insecure-key').digest();

// AES-256-GCM Encryption
const encrypt = (text) => {
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decrypt = (encryptedText) => {
    try {
        const [ivHex, authTagHex, contentHex] = encryptedText.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        return null; // Decryption failed
    }
};

const generateLicenseKey = (data) => {
    // Basic implementation - can be enhanced with Base32
    // Format: NVS-<RANDOM>-<SIG>
    const payload = JSON.stringify(data);
    const encrypted = encrypt(payload);
    
    // Hash signature
    const signature = crypto.createHmac('sha256', MASTER_KEY).update(encrypted).digest('hex').substring(0, 8);
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // In a real system, we'd encode specific data into the key string itself,
    // but here we just map a random key to the DB entry.
    // Let's stick to the DB storing the full key map for now for simplicity.
    // A key looks like: NVS-7A2B-9C1D-E4F5
    const key = `NVS-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    return key;
};

module.exports = {
    encrypt,
    decrypt,
    generateLicenseKey
};
