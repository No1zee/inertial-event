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
    duration?: number; // in minutes
    seasons?: number;
    episodes?: number;
    status: 'ongoing' | 'completed';
    isAdult: boolean;
    language?: string;
    country?: string[];
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
