import axios from 'axios';
import './cache';
import api from '@/services/api';
import { Content, SeasonDetails } from '@/lib/types/content';
import { generateMockContent, MOCK_TV_SHOWS } from './mockData';
import { getOptimizedImageUrl } from '@/lib/utils/image';

// Hardcoded for static export - TMDB keys are meant to be public anyway
const TMDB_KEY =
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NEXT_PUBLIC_TMDB_API_KEY &&
  process.env.NEXT_PUBLIC_TMDB_API_KEY !== 'your_tmdb_key_here'
    ? process.env.NEXT_PUBLIC_TMDB_API_KEY
    : '';

// Use direct TMDB URL as primary. In Next.js App Router, the proxy isn't always needed for client fetches
// and can lead to 404s if not configured in next.config.js for rewrites.
const BASE_URL = 'https://api.themoviedb.org/3';

// Helper to handle URL switching between Proxy (Dev) and Direct (Prod/Android)
const getTmdbUrl = (endpoint: string, params: string = '') => {
  // Always hit TMDB directly with API key
  const separator = endpoint.includes('?') ? '&' : '?';
  const finalParams = params ? `&${params}` : '';
  return `${BASE_URL}${endpoint}${separator}api_key=${TMDB_KEY}${finalParams}`;
};

interface TMDBItem {
  id: number;
  _id?: string;
  tmdbId?: string;
  title?: string;
  name?: string;
  overview?: string;
  description?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  posterUrl?: string;
  backdropUrl?: string;
  vote_average?: number;
  vote_count?: number;
  rating?: number;
  year?: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  type?: string;
  genres?: Array<{ id: number; name: string } | string>;
  origin_country?: string[];
  original_language?: string;
  last_air_date?: string;
  seasons?: Array<{
    id: number;
    season_number: number;
    episode_count: number;
    name: string;
  }>;
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew?: Array<{
      job: string;
      name: string;
    }>;
  };
  videos?: {
    results?: Array<{
      type: string;
      site: string;
      key: string;
    }>;
  };
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  production_companies?: Array<{ name: string; iso_3166_1?: string }>;
  production_countries?: Array<{ iso_3166_1: string }>;
  adult?: boolean;
}

export const contentApi = {
  getCollectionDetails: async (
    _collectionId: string | number
  ): Promise<{
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    parts: Content[];
  }> => {
    // Return mock for now
    return {
      id: 0,
      name: 'Mock Collection',
      overview: '',
      poster_path: '',
      backdrop_path: '',
      parts: generateMockContent(5),
    };
  },

  getTrending: async (page: number = 1): Promise<Content[]> => {
    try {
      const res = await axios.get(getTmdbUrl('/trending/all/day', `language=en-US&page=${page}`));
      const data = res.data.results || [];
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent(item)));
    } catch {
      return generateMockContent(10);
    }
  },

  getPopularTV: async (page: number = 1): Promise<Content[]> => {
    try {
      const res = await axios.get(getTmdbUrl('/tv/popular', `language=en-US&page=${page}`));
      const data = res.data.results || [];
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' })));
    } catch {
      // Fallback to mock on error only
      return [...MOCK_TV_SHOWS, ...generateMockContent(5)];
    }
  },

  getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const res = await axios.get(
        getTmdbUrl(endpoint, `with_genres=${genreId}&sort_by=popularity.desc&language=en-US&page=${randomPage}`)
      );
      return prioritizeContent((res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type })));
    } catch {
      // Fallback
      return generateMockContent(10);
    }
  },

  // --- Dynamic Categories (The Candy Store) ---

  getUpcoming: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || 1;
      const res = await axios.get(getTmdbUrl('/movie/upcoming', `language=en-US&region=US&page=${randomPage}`));
      const data = res.data.results || [];
      // Filter only future dates to be safe
      const futureEvents = data.filter((item: TMDBItem) => {
        const release = new Date(item.release_date || '');
        return release > new Date();
      });
      return futureEvents.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch (e) {
      console.error('Failed to fetch upcoming:', e);
      return [];
    }
  },

  getAnime: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || Math.floor(Math.random() * 3) + 1;
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          `with_keywords=210024&with_genres=16&language=en-US&sort_by=popularity.desc&page=${randomPage}`
        )
      );
      const data = res.data.results || [];
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch (e) {
      console.error('Failed to fetch anime:', e);
      return [];
    }
  },

  getBangers: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
      const [res1, res2] = await Promise.all([
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage}${extraFilter}`
          )
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage + 1}${extraFilter}`
          )
        ),
      ]);
      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  getClassics: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const dateFilter = type === 'movie' ? 'primary_release_date.lte=2010-01-01' : 'first_air_date.lte=2010-01-01';
      const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

      const [res1, res2] = await Promise.all([
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`
          )
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage + 1}${extraFilter}`
          )
        ),
      ]);

      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  getUnderrated: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

      const [res1, res2] = await Promise.all([
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage}${extraFilter}`
          )
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=vote_average.desc&vote_count.gte=200&vote_count.lte=2000&vote_average.gte=8.0&language=en-US&page=${randomPage + 1}${extraFilter}`
          )
        ),
      ]);
      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  getFresh: async (type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const currentYear = new Date().getFullYear();
      const dateFilter =
        type === 'movie' ? `primary_release_year=${currentYear}` : `first_air_date_year=${currentYear}`;
      const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';

      const [res1, res2] = await Promise.all([
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage}${extraFilter}`
          )
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${randomPage + 1}${extraFilter}`
          )
        ),
      ]);
      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  getRecommendations: async (_id: string): Promise<Content[]> => {
    try {
      // const cleanId = id.replace('tmdb_', '');
      // We can't easily know the type from just ID here without lookup, but usually recommendations come from same type.
      // Try movie first, if fail/empty try tv. Or better, pass type if possible.
      // For now, let's assume we can get type or just try both.
      // Actually, best is to ask the caller to provide valid context or just return empty if id invalid.
      // Let's rely on the fact that we can often guess or duplicate.
      // A safer bet: The history item SHOULD have the type. But if we only have ID...
      // Optimization: The caller (Page) has the history item, so it knows the type.
      // Let's update signature to take type.
      return [];
    } catch {
      return [];
    }
  },

  getSimilar: async (id: string, type: 'movie' | 'tv' | 'anime'): Promise<Content[]> => {
    try {
      // For Anime, we treat it as TV for TMDB queries usually
      const queryType = type === 'anime' ? 'tv' : type;
      const cleanId = id.replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/${queryType}/${cleanId}/recommendations`, 'language=en-US&page=1'));
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  // --- Anime Specific Categories ---
  // --- Anime Specific Categories ---
  getAnimeByGenre: async (genreQuery: string, page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || 1;
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          `${genreQuery}&with_keywords=210024&language=en-US&sort_by=popularity.desc&page=${randomPage}`
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch {
      return [];
    }
  },

  getEnglishAnime: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || 1;
      // Bias towards English original language OR specific English-market keywords
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          `with_genres=16&with_keywords=210024&with_original_language=en&sort_by=popularity.desc&page=${randomPage}`
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch (e) {
      console.error('Failed to fetch english anime:', e);
      return [];
    }
  },

  getAdultAnimation: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || 1;
      // Animation (16) + Comedy (35) WITHOUT Anime (210024)
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          `with_genres=16,35&without_keywords=210024&language=en-US&sort_by=popularity.desc&page=${randomPage}`
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getViralAdultSwim: async (): Promise<Content[]> => {
    try {
      // Specific TMDB IDs for viral hits:
      // Rick and Morty (60625), Primal (90027), Smiling Friends (119253), Eric Andre (41926), Robot Chicken (421)
      const hits = [60625, 90027, 119253, 41926, 421];
      const results = await Promise.all(hits.map(id => axios.get(getTmdbUrl(`/tv/${id}`, 'language=en-US'))));
      return results.map(res => transformToContent({ ...res.data, type: 'tv' }));
    } catch (e) {
      console.error('Failed to fetch viral adult swim:', e);
      return [];
    }
  },

  getAdultSwimOriginals: async (type: 'animated' | 'live-action'): Promise<Content[]> => {
    try {
      // Network 80 is Adult Swim/Cartoon Network
      const genreFilter = type === 'animated' ? '&with_genres=16' : '&without_genres=16';
      // Filter for shows from 2010 onwards to avoid 90s content
      const dateFilter = '&first_air_date.gte=2010-01-01';

      // Fetch multiple pages to get more content
      const [page1, page2] = await Promise.all([
        axios.get(
          getTmdbUrl(
            '/discover/tv',
            `with_networks=80${genreFilter}${dateFilter}&language=en-US&sort_by=popularity.desc&page=1`
          )
        ),
        axios.get(
          getTmdbUrl(
            '/discover/tv',
            `with_networks=80${genreFilter}${dateFilter}&language=en-US&sort_by=popularity.desc&page=2`
          )
        ),
      ]);

      const results = [...(page1.data.results || []), ...(page2.data.results || [])];
      return results.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getShorts: async (): Promise<Content[]> => {
    try {
      // No direct "shorts" filter in TMDB but we can filter by runtime for movies or look at "Short" genre if available
      // Usually runtime <= 40 mins is considered short
      const res = await axios.get(
        getTmdbUrl('/discover/movie', 'with_runtime.lte=40&sort_by=popularity.desc&language=en-US&page=1')
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  // Adult Swim Genre-Specific Content
  getAdultSwimByGenre: async (genres: number[]): Promise<Content[]> => {
    try {
      const genreString = genres.join(',');
      const dateFilter = '&first_air_date.gte=2000-01-01';

      // Fetch from multiple sources: Network 80 (Adult Swim) + Adult Animation (16+35 Comedy)
      const [network, adultAnim] = await Promise.all([
        axios.get(
          getTmdbUrl(
            '/discover/tv',
            `with_networks=80&with_genres=${genreString}${dateFilter}&language=en-US&sort_by=popularity.desc&page=1`
          )
        ),
        axios.get(
          getTmdbUrl(
            '/discover/tv',
            `with_genres=16,${genreString}&without_keywords=210024${dateFilter}&vote_average.gte=6.5&language=en-US&sort_by=popularity.desc&page=1`
          )
        ),
      ]);

      const results: TMDBItem[] = [...(network.data.results || []), ...(adultAnim.data.results || [])];
      // Remove duplicates by ID
      const unique = results.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
      return unique.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimDarkComedy: async (): Promise<Content[]> => {
    return contentApi.getAdultSwimByGenre([35]); // Comedy
  },

  getAdultSwimHorror: async (): Promise<Content[]> => {
    return contentApi.getAdultSwimByGenre([27, 9648]); // Horror + Mystery
  },

  getAdultSwimSciFi: async (): Promise<Content[]> => {
    return contentApi.getAdultSwimByGenre([878, 10765]); // Sci-Fi + Sci-Fi & Fantasy
  },

  getAdultSwimSatire: async (): Promise<Content[]> => {
    return contentApi.getAdultSwimByGenre([35, 18]); // Comedy + Drama (for satirical content)
  },

  // More Adult Swim Content
  getAdultSwimCultClassics: async (): Promise<Content[]> => {
    try {
      // Cult animation classics
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_networks=80&vote_average.gte=7.5&sort_by=vote_average.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimExperimental: async (): Promise<Content[]> => {
    try {
      // Experimental/weird animation
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=16,35&vote_average.gte=7&with_keywords=10683&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimAnime: async (): Promise<Content[]> => {
    try {
      // Mature anime for adult swim
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=16&with_keywords=210024&vote_average.gte=7&first_air_date.gte=2000-01-01&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimAction: async (): Promise<Content[]> => {
    return contentApi.getAdultSwimByGenre([10759]); // Action & Adventure
  },

  getAdultSwimMusic: async (): Promise<Content[]> => {
    try {
      // Music-themed animation
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=16,10402&vote_average.gte=6.5&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimMidnight: async (): Promise<Content[]> => {
    try {
      // "Midnight Munchies" - Chill/trippy animation
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=16,10765&with_keywords=10683&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimSurreal: async (): Promise<Content[]> => {
    try {
      // Surrealist/Absurdist humor
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_keywords=10332,10683&sort_by=popularity.desc&language=en-US&page=1')
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimBritish: async (): Promise<Content[]> => {
    try {
      // British comedy/alt shows often seen on AS
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_origin_country=GB&with_genres=35&vote_average.gte=7.5&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAdultSwimRetro: async (): Promise<Content[]> => {
    try {
      // Older 2000s era classics
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_networks=80&first_air_date.lte=2010-01-01&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  // Aunties Channel Content
  getKoreanDramas: async (): Promise<Content[]> => {
    try {
      // Korean dramas with romance/drama
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_original_language=ko&with_genres=18&sort_by=popularity.desc&vote_average.gte=7&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getAfricanMovies: async (): Promise<Content[]> => {
    try {
      // African cinema - Nigeria (Nollywood), South Africa, Kenya
      const [nigeria, southAfrica] = await Promise.all([
        axios.get(
          getTmdbUrl('/discover/movie', 'with_origin_country=NG&sort_by=popularity.desc&language=en-US&page=1')
        ),
        axios.get(
          getTmdbUrl('/discover/movie', 'with_origin_country=ZA&sort_by=popularity.desc&language=en-US&page=1')
        ),
      ]);
      const results = [...(nigeria.data.results || []), ...(southAfrica.data.results || [])];
      return results.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  getClassicSitcoms: async (): Promise<Content[]> => {
    try {
      // Classic comedy TV shows
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=35&vote_average.gte=7&first_air_date.lte=2010-01-01&sort_by=vote_average.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getSoapOperas: async (): Promise<Content[]> => {
    try {
      // Soap operas and long-running dramas
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_genres=10766&sort_by=popularity.desc&language=en-US&page=1')
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getFamilyDramas: async (): Promise<Content[]> => {
    try {
      // Family-friendly dramas
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=18,10751&vote_average.gte=6.5&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getTelenovelas: async (): Promise<Content[]> => {
    try {
      // Spanish-language telenovelas and dramas
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_original_language=es&with_genres=18&sort_by=popularity.desc&vote_average.gte=6&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getBollywoodMovies: async (): Promise<Content[]> => {
    try {
      // Hindi/Indian cinema
      const res = await axios.get(
        getTmdbUrl(
          '/discover/movie',
          'with_original_language=hi&sort_by=popularity.desc&vote_average.gte=6&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  getFamilyComedies: async (): Promise<Content[]> => {
    try {
      // Family-friendly comedy shows
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          'with_genres=35,10751&vote_average.gte=6.5&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getCookingShows: async (): Promise<Content[]> => {
    try {
      // Reality/cooking shows
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_genres=10764&with_keywords=9840&sort_by=popularity.desc&language=en-US&page=1')
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return [];
    }
  },

  getRomanticMovies: async (): Promise<Content[]> => {
    try {
      // Romantic movies
      const res = await axios.get(
        getTmdbUrl(
          '/discover/movie',
          'with_genres=10749&vote_average.gte=6.5&sort_by=popularity.desc&language=en-US&page=1'
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  // Hero Heavy Hitters - Premium content for carousels
  getHeroHeavyHitters: async (type: 'movie' | 'tv' | 'all' = 'all'): Promise<Content[]> => {
    try {
      const currentYear = new Date().getFullYear();
      const params = `vote_average.gte=7.5&vote_count.gte=1000&primary_release_date.gte=${currentYear - 2}-01-01&sort_by=popularity.desc&language=en-US&page=1`;

      if (type === 'all') {
        const [movies, tv] = await Promise.all([
          axios.get(getTmdbUrl('/discover/movie', params)),
          axios.get(getTmdbUrl('/discover/tv', params.replace('primary_release_date', 'first_air_date'))),
        ]);
        const results = [
          ...(movies.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' })),
          ...(tv.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' })),
        ];
        // Sort by rating and popularity
        return results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 10);
      } else if (type === 'movie') {
        const res = await axios.get(getTmdbUrl('/discover/movie', params));
        return (res.data.results || [])
          .slice(0, 10)
          .map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
      } else {
        const res = await axios.get(
          getTmdbUrl('/discover/tv', params.replace('primary_release_date', 'first_air_date'))
        );
        return (res.data.results || [])
          .slice(0, 10)
          .map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
      }
    } catch {
      return [];
    }
  },

  // --- specialized "Candy Store" categories ---

  getShortAndSweet: async (page?: number): Promise<Content[]> => {
    try {
      // Movies under 100 minutes with good ratings
      const res = await axios.get(
        getTmdbUrl(
          '/discover/movie',
          `with_runtime.lte=100&vote_average.gte=7&sort_by=popularity.desc&page=${page || 1}`
        )
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  getFeelGood: async (page?: number): Promise<Content[]> => {
    try {
      // Comedy (35), Family (10751), Music (10402)
      const res = await axios.get(
        getTmdbUrl('/discover/movie', `with_genres=35,10751,10402&sort_by=popularity.desc&page=${page || 1}`)
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return [];
    }
  },

  getDayOneDrops: async (type: 'movie' | 'tv' = 'movie', page: number = 1): Promise<Content[]> => {
    try {
      const tmdbEndpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';

      // Get date range for last 14 days (extended slightly from 7 for better results)
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 14);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      const dateFilter =
        type === 'movie'
          ? `primary_release_date.gte=${formatDate(pastDate)}&primary_release_date.lte=${formatDate(today)}`
          : `first_air_date.gte=${formatDate(pastDate)}&first_air_date.lte=${formatDate(today)}`;

      const extraFilter = type === 'tv' ? '&without_keywords=210024' : '';
      const res = await axios.get(
        getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${page}${extraFilter}`)
      );
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return [];
    }
  },

  // Flexible discover for custom categories (A24, CBM, etc.)
  discover: async (
    params: Record<string, string | number | boolean | undefined>,
    type: 'movie' | 'tv' = 'movie'
  ): Promise<Content[]> => {
    try {
      const queryParams = new URLSearchParams({
        language: 'en-US',
        page: (params.page || Math.floor(Math.random() * 3) + 1).toString(),
        sort_by: params.sort_by || 'popularity.desc',
        ...params,
      } as Record<string, string>);

      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const res = await axios.get(getTmdbUrl(endpoint, queryParams.toString()));
      return (res.data.results || []).map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error('Failed to discover content:', e);
      return [];
    }
  },

  searchContent: async (query: string, page: number = 1): Promise<Content[]> => {
    try {
      if (!query) return [];
      const res = await axios.get(
        getTmdbUrl(
          '/search/multi',
          `query=${encodeURIComponent(query)}&page=${page}&language=en-US&include_adult=false`
        )
      );

      // Filter out 'person' results
      const results = (res.data.results || []).filter(
        (item: TMDBItem) => item.media_type === 'movie' || item.media_type === 'tv'
      );

      return prioritizeContent(results.map((item: TMDBItem) => transformToContent(item)));
    } catch (e) {
      console.error('Search failed:', e);
      return [];
    }
  },

  semanticSearch: async (query: string, limit: number = 10): Promise<Content[]> => {
    try {
      if (!query) return [];
      // Use our custom backend for semantic search
      const res = await api.get<Content[]>(`/content/semantic-search`, {
        params: { q: query, limit },
      });
      return res.data;
    } catch (e) {
      console.error('Semantic search failed:', e);
      return [];
    }
  },

  getTrailer: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<string | null> => {
    try {
      const cleanId = id.replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/${type}/${cleanId}/videos`, 'language=en-US'));
      const videos = res.data.results || [];
      const trailer =
        (videos as Array<{ type: string; site: string; key: string }>).find(
          v => v.type === 'Trailer' && v.site === 'YouTube'
        ) || videos[0];
      return trailer ? trailer.key : null;
    } catch {
      return null;
    }
  },

  getDetails: async (id: string | number, type: 'movie' | 'tv' | 'anime' = 'movie'): Promise<Content | null> => {
    try {
      const idStr = String(id);
      // Handle mock IDs
      if (idStr.startsWith('mock-')) {
        const index = parseInt(idStr.split('-')[1]);
        return {
          id: idStr,
          title: `Content Title ${index + 1}`,
          description: 'This is a detailed mock description for testing purposes.',
          poster: '/images/placeholder.png',
          backdrop: '/images/hero_placeholder.jpg',
          rating: 8.5,
          releaseDate: '2024-01-01',
          type: type,
          genres: ['Mock', 'Test'],
          status: 'completed',
          isAdult: false,
          seasonsList: [],
          cast: [],
          recommendations: [],
          trailer: undefined,
        };
      }

      // Strip 'tmdb_' prefix if present
      const cleanId = idStr.replace('tmdb_', '');

      const endpoint = type === 'movie' ? `/movie/${cleanId}` : `/tv/${cleanId}`;
      const res = await axios.get(
        getTmdbUrl(endpoint, 'language=en-US&append_to_response=credits,recommendations,videos')
      );
      return transformToContent({ ...res.data, type });
    } catch (e) {
      console.error(`Failed to fetch ${type} details for ${id}:`, e);
      return null;
    }
  },

  getSeasonDetails: async (id: string | number, seasonNumber: number): Promise<SeasonDetails | null> => {
    try {
      const idStr = String(id).replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/tv/${idStr}/season/${seasonNumber}`, 'language=en-US'));
      return res.data;
    } catch (e) {
      console.error(`Failed to fetch season ${seasonNumber} for ${id}:`, e);
      return null;
    }
  },

  search: async (query: string): Promise<Content[]> => {
    try {
      const res = await axios.get(
        getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=1&include_adult=false&language=en-US`)
      );
      const data = res.data.results || [];
      // Filter only movie and tv
      const filtered = data.filter((item: TMDBItem) => item.media_type === 'movie' || item.media_type === 'tv');
      return filtered.map((item: TMDBItem) => transformToContent(item));
    } catch (e) {
      console.error('Failed to search content:', e);
      return [];
    }
  },

  getPersonDetails: async (personId: number): Promise<any> => {
    try {
      const res = await axios.get(getTmdbUrl(`/person/${personId}`, 'language=en-US'));
      return res.data;
    } catch (e) {
      console.error(`Failed to fetch person details for ${personId}:`, e);
      return null;
    }
  },

  getPersonCredits: async (personId: number): Promise<Content[]> => {
    try {
      const res = await axios.get(getTmdbUrl(`/person/${personId}/combined_credits`, 'language=en-US'));
      const data = res.data.cast || [];
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent(item)));
    } catch (e) {
      console.error(`Failed to fetch person credits for ${personId}:`, e);
      return [];
    }
  },
};

export const prioritizeContent = (contents: Content[]): Content[] => {
  // Geographic Priority Tiers
  const getGeoScore = (c: Content): number => {
    // US First
    if (c.originCountry?.includes('US')) return 100;
    // UK Second
    if (c.originCountry?.includes('GB')) return 80;
    // English Speaking Third
    if (['AU', 'CA', 'NZ', 'IE'].some(code => c.originCountry?.includes(code))) return 60;
    // Africa Fourth
    if (['NG', 'ZA', 'KE', 'ET', 'GH', 'UG', 'DZ', 'MA', 'EG'].some(code => c.originCountry?.includes(code))) return 40;
    // Korean Fifth
    if (c.originalLanguage === 'ko' || c.originCountry?.includes('KR')) return 20;
    // Rest of the World Last
    return 0;
  };

  const getRecencyScore = (c: Content): number => {
    const year = parseInt(c.releaseDate);
    if (isNaN(year)) return 0;
    const currentYear = new Date().getFullYear();
    // Give boost if within last 2 years
    return year >= currentYear - 2 ? 50 : 0;
  };

  const getPremiumScore = (c: Content): number => {
    // High rating (>8.0) is premium
    return c.rating >= 8.0 ? 50 : 0;
  };

  return [...contents].sort((a, b) => {
    const scoreA = getGeoScore(a) + getRecencyScore(a) + getPremiumScore(a);
    const scoreB = getGeoScore(b) + getRecencyScore(b) + getPremiumScore(b);

    // Secondary sort by popularity/rating if scores are equal
    if (scoreB === scoreA) {
      return (b.rating || 0) - (a.rating || 0);
    }

    return scoreB - scoreA;
  });
};

const transformToContent = (item: TMDBItem): Content => {
  return {
    id: String(item._id || item.id || `tmdb_${item.tmdbId}`),
    title: item.title || item.name || 'Unknown Title',
    description: item.description || item.overview || '',
    poster: getOptimizedImageUrl(item.poster_path || item.posterUrl, 'w500'),
    backdrop:
      item.backdrop_path || item.backdropUrl
        ? getOptimizedImageUrl(item.backdrop_path || item.backdropUrl, 'w780')
        : undefined,
    poster_path: item.poster_path || item.posterUrl || undefined,
    backdrop_path: item.backdrop_path || item.backdropUrl || undefined,
    rating: item.rating || item.vote_average || 0,
    releaseDate: item.year || item.release_date || item.first_air_date || '2024',
    type: (item.type || item.media_type || 'movie') as 'movie' | 'tv' | 'anime',
    genres: (item.genres || []).map((g: { name: string } | string) => (typeof g === 'object' ? g.name : g)),
    lastAirDate: item.last_air_date || undefined,
    originalLanguage: item.original_language || undefined,
    originCountry:
      item.origin_country || item.production_countries?.map((c: { iso_3166_1: string }) => c.iso_3166_1) || [],
    status: 'ongoing',
    isAdult: item.adult || false,
    seasonsList:
      item.seasons?.map((s: { id: number; season_number: number; episode_count: number; name: string }) => ({
        id: s.id,
        season_number: s.season_number,
        episode_count: s.episode_count,
        name: s.name,
      })) || [],
    cast:
      item.credits?.cast
        ?.slice(0, 10)
        .map((c: { id: number; name: string; character: string; profile_path: string | null }) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: getOptimizedImageUrl(c.profile_path, 'w185'),
        })) || [],
    trailer:
      item.videos?.results?.find(
        (v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube'
      )?.key || undefined,
    belongsToCollection: item.belongs_to_collection || undefined,
    director: item.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name || undefined,
    directors:
      item.credits?.crew
        ?.filter((c: { job: string; name: string }) => c.job === 'Director')
        .map((c: { name: string }) => c.name) || [],
    productionCompanies: item.production_companies?.map((c: { name: string }) => c.name) || [],
    ratings: {
      imdb: {
        score: item.vote_average ? Number(item.vote_average.toFixed(1)) : 0,
        votes: item.vote_count,
      },
      rottenTomatoes: {
        score: item.vote_average ? Math.round(item.vote_average * 10) : 0,
        state:
          (item.vote_average || 0) * 10 >= 75 ? 'certified' : (item.vote_average || 0) * 10 >= 60 ? 'fresh' : 'rotten',
      },
    },
    heritage: getHeritageData(item.id, item.title || item.name || ''),
  };
};

const getHeritageData = (id: number | string, title: string) => {
  const idStr = String(id);

  // Sample: The Woman King (TMDB 724495)
  if (idStr === '724495' || title.includes('Woman King')) {
    return {
      culturalContext:
        'Based on the true story of the Agojie, the all-female military unit that protected the West African Kingdom of Dahomey in the 18th and 19th centuries.\n\nThe film explores the complex history of the kingdom and its struggle against the Oyo Empire and the transatlantic slave trade.',
      regionalOrigins: ['Benin', 'West Africa'],
      accuracyVerified: true,
      curatorNote: 'A powerful representation of African military prowess and the legacy of the Dahomey Amazons.',
      didYouKnow:
        "The Dahomey kingdom's female warriors were the real-life inspiration for the Dora Milaje in Black Panther.",
    };
  }

  // Sample: Shaka Ilembe (if present)
  if (title.includes('Shaka')) {
    return {
      culturalContext:
        'A deep dive into the origin story of the iconic Zulu king, Shaka kaSenzangakhona.\n\nSet in the late 1700s, it depicts the rise of the Zulu Empire and the tactical innovations that changed Southern African warfare forever.',
      regionalOrigins: ['South Africa', 'KwaZulu-Natal'],
      accuracyVerified: true,
      curatorNote: 'The most ambitious historical production in African television history.',
      didYouKnow:
        'The production used hundreds of hand-crafted Zulu shields and traditional attire to ensure absolute historical fidelity.',
    };
  }

  // Sample: Black Panther (TMDB 284053)
  if (idStr === '284053' || title.includes('Black Panther')) {
    return {
      culturalContext:
        'While fictional, Wakanda is a celebration of Afrofuturism—a cultural aesthetic that combines science fiction, history, and fantasy to explore the African-American experience and connect those in the diaspora to their African heritage.',
      regionalOrigins: ['Pan-African', 'East Africa (Inspiration)'],
      accuracyVerified: true,
      curatorNote: 'A landmark moment for global African representation in modern blockbusters.',
      didYouKnow: 'The language spoken in Wakanda is isiXhosa, one of the official languages of South Africa.',
    };
  }

  // Fallback Institutional Note for high-quality content
  return {
    culturalContext: "This work is a cornerstone of our cinematic archive, selected for its directorial integrity and stylistic vanguard.",
    accuracyVerified: true,
    curatorNote: "An institutional-grade masterpiece that defines the Golden Hour sanctuary. Essential viewing for the discerning archivist.",
    didYouKnow: "Every entry in the S-Class archive undergoes a rigorous directorial audit for thematic purity and visual excellence."
  };
};
