'use server';

import axios from 'axios';
import { Content } from '@/lib/types/content';

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const getTmdbUrl = (endpoint: string, params: string = '') => {
  const separator = endpoint.includes('?') ? '&' : '?';
  const finalParams = params ? `&${params}` : '';
  return `${BASE_URL}${endpoint}${separator}api_key=${TMDB_KEY}${finalParams}`;
};

interface TMDBItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  origin_country?: string[];
  original_language?: string;
}

// Transform TMDB response to internal Content type
function transformToContent(item: TMDBItem, type?: string): Content {
  const mediaType = type || item.media_type || (item.title ? 'movie' : 'tv');
  return {
    id: `tmdb_${item.id}`,
    title: item.title || item.name || 'Untitled',
    description: item.overview || '',
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/images/placeholder.png',
    backdrop: item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : '/images/hero_placeholder.jpg',
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    rating: item.vote_average || 0,
    releaseDate: item.release_date || item.first_air_date || '',
    type: (() => {
      const t = String(mediaType).toLowerCase();
      if (t === 'movie' || t === 'tv' || t === 'anime' || t === 'series') return t;
      return 'movie';
    })(),
    genres: [],
    originCountry: item.origin_country || [],
    originalLanguage: item.original_language || 'en',
    status: mediaType === 'movie' ? 'completed' : 'ongoing',
    isAdult: false,
  };
}


export async function searchContentServer(query: string, page: number = 1): Promise<Content[]> {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Vibe Mapping Logic - The "Oracle" Cinematic Library
  const vibeMappings: Record<string, string> = {
    'cinematic poetry': 'discover/movie?with_genres=18,10749&sort_by=vote_average.desc&vote_count.gte=1000',
    'noir shadow': 'discover/movie?with_genres=80,9648&sort_by=revenue.desc&vote_count.gte=500',
    'high-octane': 'discover/movie?with_genres=28,12&sort_by=popularity.desc',
    'golden hour': 'discover/movie?with_genres=37,18&sort_by=vote_average.desc&vote_count.gte=1000',
    'oracle picks': 'movie/top_rated?',
    'cyberpunk decay': 'discover/movie?with_keywords=210332,179431&sort_by=popularity.desc',
    'cerebral thriller': 'discover/movie?with_genres=53,9648&vote_average.gte=7.5&vote_count.gte=1000',
    'aurelian classic': 'discover/movie?primary_release_date.lte=1980-01-01&sort_by=vote_average.desc&vote_count.gte=2000',
    'vanguard anime': 'discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc',
    'afrofuturism': 'discover/movie?with_keywords=1701,232930&sort_by=popularity.desc',
  };

  try {
    let url: string;
    
    if (vibeMappings[normalizedQuery]) {
      const endpoint = vibeMappings[normalizedQuery];
      url = getTmdbUrl(`/${endpoint}`, `page=${page}&language=en-US`);
    } else {
      url = getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=${page}&language=en-US&include_adult=false`);
    }

    const res = await axios.get(url);
    const results = (res.data.results || []).filter(
      (item: TMDBItem) => item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type // Discover results don't always have media_type
    );
    
    // Ensure media_type is set for discover results which might be missing it
    const transformed = results.map((item: TMDBItem) => {
      const type = vibeMappings[normalizedQuery] ? (vibeMappings[normalizedQuery].includes('tv') ? 'tv' : 'movie') : undefined;
      return transformToContent(item, type);
    });

    return transformed;
  } catch (e) {
    console.error('Server search failed:', e);
    return [];
  }
}

export async function getPersonDetailsServer(personId: number) {
  try {
    const res = await axios.get(getTmdbUrl(`/person/${personId}`, 'language=en-US'));
    return res.data;
  } catch (e) {
    console.error('Server fetch person failed:', e);
    return null;
  }
}

export async function getPersonCreditsServer(personId: number): Promise<Content[]> {
  try {
    const res = await axios.get(getTmdbUrl(`/person/${personId}/combined_credits`, 'language=en-US'));
    const data = res.data.cast || [];
    return data.map((item: TMDBItem) => transformToContent(item));
  } catch (e) {
    console.error('Server fetch credits failed:', e);
    return [];
  }
}

export async function getRecommendationsServer(id: string | number, type: 'movie' | 'tv'): Promise<Content[]> {
  const tmdbId = typeof id === 'string' && id.startsWith('tmdb_') ? id.replace('tmdb_', '') : id;
  try {
    const res = await axios.get(getTmdbUrl(`/${type}/${tmdbId}/recommendations`, 'language=en-US'));
    const data = res.data.results || [];
    return data.slice(0, 10).map((item: TMDBItem) => transformToContent(item, type));
  } catch (e) {
    console.error('Server fetch recommendations failed:', e);
    return [];
  }
}
