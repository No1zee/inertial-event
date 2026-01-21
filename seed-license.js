const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dbUser:wONNEQRLaeNblzCd@cluster0.spqnpie.mongodb.net/?appName=Cluster0';
const LICENSE_KEY = 'NVS-5F97-AA74-85AA';

const licenseSchema = new mongoose.Schema({
    license_key: { type: String, required: true, unique: true },
    device_id: String,
    status: { type: String, enum: ['unused', 'active', 'revoked'], default: 'unused' },
    access_type: { type: String, enum: ['standard', 'premium', 'admin'], default: 'standard' },
    activated_at: Date,
    expires_at: Date,
    machine_info: Object
}, { timestamps: true });

const License = mongoose.models.License || mongoose.model('License', licenseSchema);

async function seed() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const normalized = LICENSE_KEY.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const existing = await License.findOne({ license_key: LICENSE_KEY });
        if (existing) {
            console.log(`License ${LICENSE_KEY} already exists with status: ${existing.status}`);
            if (!existing.key_normalized) {
                console.log('Migrating existing license to include normalized key...');
                existing.key_normalized = normalized;
                await existing.save();
                console.log('Migration complete.');
            }
        } else {
            console.log(`Creating license ${LICENSE_KEY}...`);
            await License.create({
                license_key: LICENSE_KEY,
                key_normalized: normalized,
                status: 'unused',
                access_type: 'premium',
                expires_at: new Date('2030-01-01') // Long expiry
            });
            console.log('License seeded successfully!');
        }

        const count = await License.countDocuments();
        console.log(`Total licenses in DB: ${count}`);

    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seed();
