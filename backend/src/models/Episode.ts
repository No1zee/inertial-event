import mongoose, { Schema, Document } from 'mongoose';

export interface IEpisode extends Document {
    contentId: mongoose.Types.ObjectId;
    season: number;
    episodeNumber: number;
    title: string;
    overview?: string;
    airDate?: Date;
    thumbnailUrl?: string;
    sourcesCached?: boolean;
}

const EpisodeSchema: Schema = new Schema({
    contentId: { type: Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    season: { type: Number, default: 1 },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    overview: String,
    airDate: Date,
    thumbnailUrl: String,
    sourcesCached: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for quick episode lookups
EpisodeSchema.index({ contentId: 1, season: 1, episodeNumber: 1 }, { unique: true });

const Episode: mongoose.Model<IEpisode> = mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);
export { Episode };
