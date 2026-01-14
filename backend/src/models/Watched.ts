import mongoose, { Schema, Document } from 'mongoose';

export interface IWatched extends Document {
    userId: mongoose.Types.ObjectId;
    contentId: mongoose.Types.ObjectId;
    episodeId?: mongoose.Types.ObjectId;
    position: number; // in seconds
    duration: number; // in seconds
    completed: boolean;
    lastWatchedAt: Date;
}

const WatchedSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contentId: { type: Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    episodeId: { type: Schema.Types.ObjectId, ref: 'Episode' },
    position: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for getting a user's progress on a specific item
WatchedSchema.index({ userId: 1, contentId: 1, episodeId: 1 }, { unique: true });

export default mongoose.models.Watched || mongoose.model<IWatched>('Watched', WatchedSchema);
