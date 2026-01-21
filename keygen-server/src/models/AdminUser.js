import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
export { AdminUser };
