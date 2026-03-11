import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
    title: string;
    slug: string;
    type: 'movie' | 'series' | 'anime';
    tmdbId?: number;
    description: string;
    year: number;
    runtime?: number;
    genres: string[];
    posterUrl: string;
    backdropUrl: string;
    rating?: number;
    trendingScore?: number;
    embedding?: number[];
    seasons?: Array<{
        seasonNumber: number;
        episodes: mongoose.Types.ObjectId[];
    }>;
}

const ContentSchema: Schema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['movie', 'series', 'anime'], required: true },
    tmdbId: { type: Number, index: true },
    description: { type: String, required: true },
    year: { type: Number, required: true },
    runtime: Number,
    genres: [String],
    posterUrl: { type: String, required: true },
    backdropUrl: { type: String, required: true },
    rating: Number,
    trendingScore: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    seasons: [{
        seasonNumber: Number,
        episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }]
    }]
}, { timestamps: true });

const ContentModel: mongoose.Model<IContent> = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
export { ContentModel as Content };
