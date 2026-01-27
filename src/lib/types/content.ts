export interface Content {
    id: string;
    title: string;
    description?: string;
    poster: string;
    backdrop?: string;
    rating: number;
    releaseDate: string;
    type: 'movie' | 'tv' | 'anime';
    genres: string[];
    lastAirDate?: string;
    originalLanguage?: string;
    originCountry?: string[];
    progress?: number; // Current playback time in seconds
    lastWatched?: number; // Timestamp
    addedAt?: number; // Timestamp
    duration?: number; // Total duration in seconds (already exists, verify type)
    season?: number;
    episode?: number;
    seasons?: number;
    episodes?: number;
    status: 'ongoing' | 'completed';
    isAdult: boolean;
    language?: string;
    country?: string[];
    seasonsList?: Season[];
    cast?: CastMember[];
    recommendations?: Content[];
    trailer?: string;
    popularity?: number;
    belongsToCollection?: {
        id: number;
        name: string;
        poster_path: string;
        backdrop_path: string;
    };
    ratings?: {
        imdb?: { score: number; votes?: number };
        rottenTomatoes?: { score: number; state: 'fresh' | 'rotten' | 'certified' };
        metacritic?: number;
    };
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
}

export interface Season {
    id: number;
    season_number: number;
    episode_count: number;
    name: string;
}

export interface Episode {
    id: string;
    title: string;
    number: number;
    season: number;
    description?: string;
    duration: number;
    releaseDate: string;
    stillImage?: string;
    sources: StreamSource[];
}

export interface StreamSource {
    id: string;
    name: string; // 'Vidlink', 'Consumet', 'Torrent', etc
    url: string;
    quality: 'SD' | '720p' | '1080p' | '4K';
    type: 'hls' | 'dash' | 'mp4' | 'torrent';
    headers?: Record<string, string>;
    isWorking: boolean;
    lastChecked: Date;
}

export interface Subtitle {
    id: string;
    language: string;
    url: string;
    format: 'srt' | 'vtt' | 'ass' | 'sub';
    isDefault: boolean;
}

export interface SearchFilters {
    genres?: string[];
    year?: number;
    rating?: number;
    status?: 'ongoing' | 'completed';
    type?: 'movie' | 'tv' | 'anime';
    sortBy?: 'trending' | 'rating' | 'newest' | 'popularity';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
    hasNextPage: boolean;
}
