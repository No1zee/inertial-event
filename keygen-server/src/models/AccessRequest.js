import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    device_id: {
        type: String,
        required: true,
        index: true
    },
    machine_fingerprint: {
        type: String
    },
    machine_name: {
        type: String
    },
    ip_address: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requested_at: {
        type: Date,
        default: Date.now
    },
    approval_notes: {
        type: String
    },
    user_email: {
        type: String
    }
});

export default mongoose.model('AccessRequest', accessRequestSchema);
