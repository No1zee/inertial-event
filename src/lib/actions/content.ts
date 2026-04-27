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
    rating: item.vote_average || 0,
    releaseDate: item.release_date || item.first_air_date || '',
    type: mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'tv' : 'anime',
    genres: [],
    originCountry: item.origin_country || [],
    originalLanguage: item.original_language || 'en',
    status: mediaType === 'movie' ? 'completed' : 'ongoing',
    isAdult: false,
  };
}

export async function searchContentServer(query: string, page: number = 1): Promise<Content[]> {
  if (!query) return [];
  try {
    const res = await axios.get(
      getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=${page}&language=en-US&include_adult=false`)
    );
    const results = (res.data.results || []).filter(
      (item: TMDBItem) => item.media_type === 'movie' || item.media_type === 'tv'
    );
    return results.map((item: TMDBItem) => transformToContent(item));
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
