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
        enum: ['permanent', 'trial', 'limited'],
        required: true
    },
    expires_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'unused'],
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
});

const License = mongoose.models.License || mongoose.model('License', licenseSchema);
export { License };
