export interface Movie {
    id: number;
    title?: string;
    name?: string; // For TV shows
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string;
    backdrop_path?: string;
    media_type: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    video?: boolean;
    // Extra fields
    runtime?: number;
    number_of_seasons?: number;
}

export interface SearchResults {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
}
