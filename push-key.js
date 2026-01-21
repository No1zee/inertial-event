const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

const keyToPush = process.argv[2];

if (!keyToPush) {
    console.log('Usage: node push-key.js YOUR-KEY-HERE');
    process.exit(1);
}

const licenseSchema = new mongoose.Schema({
    license_key: { type: String, required: true, unique: true },
    key_normalized: { type: String, unique: true },
    status: { type: String, default: 'unused' },
    access_type: { type: String, default: 'premium' },
    created_at: { type: Date, default: Date.now }
}, { strict: false });

const License = mongoose.models.License || mongoose.model('License', licenseSchema);

async function pushKey() {
    try {
        console.log('🔗 Connecting to Production Database...');
        await mongoose.connect(MONGODB_URI);
        
        const normalized = keyToPush.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Check if exists
        const existing = await License.findOne({ key_normalized: normalized });
        if (existing) {
            console.log(`⚠️  Key ${keyToPush} already exists in Production DB (Status: ${existing.status})`);
            process.exit(0);
        }

        const newLicense = new License({
            license_key: keyToPush,
            key_normalized: normalized,
            status: 'unused',
            access_type: 'premium'
        });

        await newLicense.save();
        console.log(`✅ Success! Key ${keyToPush} is now active in Production.`);
        
    } catch (err) {
        console.error('💥 Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

pushKey();
