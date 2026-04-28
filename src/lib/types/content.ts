export interface Content {
  id: string;
  title: string;
  description?: string;
  overview?: string;
  poster: string;
  backdrop?: string;
  poster_path?: string;
  backdrop_path?: string;
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
  providerId?: string;
  seasonsList?: Season[];
  cast?: CastMember[];
  recommendations?: Content[];
  trailer?: string;
  popularity?: number;
  director?: string;
  directors?: string[];
  productionCompanies?: string[];
  belongsToCollection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  };
  ratings?: {
    imdb?: { score: number; votes?: number };
    rottenTomatoes?: { score: number; state: 'rotten' | 'fresh' | 'certified' };
    metacritic?: number;
  };
  heritage?: {
    culturalContext?: string;
    regionalOrigins?: string[];
    accuracyVerified?: boolean;
    curatorNote?: string;
    didYouKnow?: string;
  };
}

// Optimized interface for storage (LocalStorage is synchronous!)
export interface MinifiedContent extends Partial<Content> {
  id: string;
  title: string;
  overview?: string;
  type: 'movie' | 'tv' | 'anime';
  poster: string;
  // Optional extras we might want to keep
  backdrop?: string;
  lastWatched?: number;
  progress?: number;
  duration?: number;
  season?: number;
  episode?: number;
  providerId?: string;
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

export interface SeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episodes: SeasonEpisode[];
}

export interface SeasonEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number;
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
