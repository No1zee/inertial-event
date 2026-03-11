import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    name?: string;
    library: mongoose.Types.ObjectId[];
    preferences: {
        autoplay: boolean;
        quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
        subtitleLanguage: string;
        theme: 'dark' | 'light';
    };
    appState?: any; // Generic bucket for storing frontend Zustand states (history, series tracking)
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: String,
    library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    preferences: {
        autoplay: { type: Boolean, default: true },
        quality: { type: String, enum: ['auto', '1080p', '720p', '480p', '360p'], default: 'auto' },
        subtitleLanguage: { type: String, default: 'en' },
        theme: { type: String, enum: ['dark', 'light'], default: 'dark' }
    },
    appState: { type: Schema.Types.Mixed, default: {} } // Flexible JSON structure
}, { timestamps: true });

UserSchema.pre('save', async function (next: any) {
    if (!this.isModified('passwordHash')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash as string, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', UserSchema);
export { User };
