import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema({
    license_key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    device_id: {
        type: String,
        default: null
    },
    access_type: {
        type: String,
        default: 'permanent'
    },
    key_normalized: {
        type: String,
        unique: true
    },
    expires_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        default: 'unused'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    created_by: {
        type: String,
        default: 'admin'
    }
}, { strict: false });

// Auto-normalize key before saving
licenseSchema.pre('save', function() {
    if (this.license_key) {
        this.key_normalized = String(this.license_key).toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
});

const License = mongoose.model('License', licenseSchema);
export { License };
