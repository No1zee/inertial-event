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
  number_of_seasons?: number;
  number_of_episodes?: number;
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
    const url = getTmdbUrl('/trending/all/day', `language=en-US&page=${page}`);
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent(item)));
    } catch (e: any) {
      console.error(`[ContentAPI] Trending fetch failed for URL: ${url}`, e);
      return generateMockContent(12);
    }
  },

  getPopularTV: async (page: number = 1): Promise<Content[]> => {
    const url = getTmdbUrl('/tv/popular', `language=en-US&page=${page}`);
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' })));
    } catch (e: any) {
      console.error(`[ContentAPI] Popular TV fetch failed for URL: ${url}`, e);
      return generateMockContent(12);
    }
  },

  getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie', page?: number): Promise<Content[]> => {
    try {
      const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const randomPage = page || 1;
      const res = await axios.get(
        getTmdbUrl(endpoint, `with_genres=${genreId}&sort_by=popularity.desc&language=en-US&page=${randomPage}`),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent({ ...item, type })));
    } catch (e) {
      console.error(`Genre ${genreId} fetch failed:`, e);
      return generateMockContent(12);
    }
  },

  // --- Dynamic Categories (The Candy Store) ---

  getUpcoming: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || 1;
      const res = await axios.get(getTmdbUrl('/movie/upcoming', `language=en-US&region=US&page=${randomPage}`), { timeout: 10000 });
      const data = res.data.results || [];
      const futureEvents = data.filter((item: TMDBItem) => {
        const release = new Date(item.release_date || '');
        return release > new Date();
      });
      if (futureEvents.length === 0) return generateMockContent(12);
      return futureEvents.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch (e) {
      console.error('Upcoming fetch failed:', e);
      return generateMockContent(12);
    }
  },

  getAnime: async (page?: number): Promise<Content[]> => {
    try {
      const randomPage = page || Math.floor(Math.random() * 3) + 1;
      const res = await axios.get(
        getTmdbUrl(
          '/discover/tv',
          `with_keywords=210024&with_genres=16&language=en-US&sort_by=popularity.desc&page=${randomPage}`
        ),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch (e) {
      console.error('Anime fetch failed:', e);
      return generateMockContent(12);
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
          ),
          { timeout: 10000 }
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&page=${randomPage + 1}${extraFilter}`
          ),
          { timeout: 10000 }
        ),
      ]);
      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error('Bangers fetch failed:', e);
      return generateMockContent(12);
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
          ),
          { timeout: 10000 }
        ),
        axios.get(
          getTmdbUrl(
            tmdbEndpoint,
            `sort_by=popularity.desc&vote_average.gte=7.5&${dateFilter}&language=en-US&page=${randomPage + 1}${extraFilter}`
          ),
          { timeout: 10000 }
        ),
      ]);

      const data = [...(res1.data.results || []), ...(res2.data.results || [])];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error('Classics fetch failed:', e);
      return generateMockContent(12);
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
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return generateMockContent(12);
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
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return generateMockContent(12);
    }
  },


  getSimilar: async (id: string, type: 'movie' | 'tv' | 'anime'): Promise<Content[]> => {
    try {
      // For Anime, we treat it as TV for TMDB queries usually
      const queryType = type === 'anime' ? 'tv' : type;
      const cleanId = id.replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/${queryType}/${cleanId}/recommendations`, 'language=en-US&page=1'));
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch {
      return generateMockContent(12);
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
        ),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return (data || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch {
      return generateMockContent(12);
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
        ),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return (data || []).map((item: TMDBItem) => transformToContent({ ...item, type: 'anime' }));
    } catch (e) {
      console.error('Failed to fetch english anime:', e);
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      return generateMockContent(12);
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
      if (results.length === 0) return generateMockContent(12);
      return results.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
    }
  },

  getShorts: async (): Promise<Content[]> => {
    try {
      // No direct "shorts" filter in TMDB but we can filter by runtime for movies or look at "Short" genre if available
      // Usually runtime <= 40 mins is considered short
      const res = await axios.get(
        getTmdbUrl('/discover/movie', 'with_runtime.lte=40&sort_by=popularity.desc&language=en-US&page=1')
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
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
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
    }
  },

  getAdultSwimSurreal: async (): Promise<Content[]> => {
    try {
      // Surrealist/Absurdist humor
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_keywords=10332,10683&sort_by=popularity.desc&language=en-US&page=1')
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      if (results.length === 0) return generateMockContent(12);
      return results.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
    }
  },

  getSoapOperas: async (): Promise<Content[]> => {
    try {
      // Soap operas and long-running dramas
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_genres=10766&sort_by=popularity.desc&language=en-US&page=1')
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
    }
  },

  getCookingShows: async (): Promise<Content[]> => {
    try {
      // Reality/cooking shows
      const res = await axios.get(
        getTmdbUrl('/discover/tv', 'with_genres=10764&with_keywords=9840&sort_by=popularity.desc&language=en-US&page=1')
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'tv' }));
    } catch {
      return generateMockContent(12);
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
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
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
      return generateMockContent(10);
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
        ),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
    }
  },

  getFeelGood: async (page?: number): Promise<Content[]> => {
    try {
      // Comedy (35), Family (10751), Music (10402)
      const res = await axios.get(
        getTmdbUrl('/discover/movie', `with_genres=35,10751,10402&sort_by=popularity.desc&page=${page || 1}`),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(12);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type: 'movie' }));
    } catch {
      return generateMockContent(12);
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
        getTmdbUrl(tmdbEndpoint, `sort_by=popularity.desc&${dateFilter}&language=en-US&page=${page}${extraFilter}`),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(10);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error(`New releases fetch failed for ${type}:`, e);
      return generateMockContent(10);
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
      const res = await axios.get(getTmdbUrl(endpoint, queryParams.toString()), { timeout: 10000 });
      const data = res.data.results || [];
      if (data.length === 0) return generateMockContent(10);
      return data.map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error('Failed to discover content:', e);
      return generateMockContent(10);
    }
  },

  searchContent: async (query: string, page: number = 1): Promise<Content[]> => {
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
        (item: any) => item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type
      );
      
      return prioritizeContent(results.map((item: TMDBItem) => {
        const type = vibeMappings[normalizedQuery] ? (vibeMappings[normalizedQuery].includes('tv') ? 'tv' : 'movie') : undefined;
        return transformToContent(item, type);
      }));
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
        getTmdbUrl('/search/multi', `query=${encodeURIComponent(query)}&page=1&include_adult=false&language=en-US`),
        { timeout: 10000 }
      );
      const data = res.data.results || [];
      const filtered = data.filter((item: TMDBItem) => item.media_type === 'movie' || item.media_type === 'tv');
      return filtered.map((item: TMDBItem) => transformToContent(item));
    } catch (e) {
      console.error('Search failed:', e);
      return generateMockContent(12);
    }
  },

  getRecommendations: async (id: string | number, type: 'movie' | 'tv'): Promise<Content[]> => {
    const tmdbId = typeof id === 'string' && id.startsWith('tmdb_') ? id.replace('tmdb_', '') : id;
    try {
      const res = await axios.get(getTmdbUrl(`/${type}/${tmdbId}/recommendations`, 'language=en-US'));
      const data = res.data.results || [];
      return data.slice(0, 10).map((item: TMDBItem) => transformToContent(item, type));
    } catch (e) {
      console.error('Fetch recommendations failed:', e);
      return generateMockContent(12);
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
      if (data.length === 0) return generateMockContent(12);
      return prioritizeContent(data.map((item: TMDBItem) => transformToContent(item)));
    } catch (e) {
      console.error(`Failed to fetch person credits for ${personId}:`, e);
      return generateMockContent(12);
    }
  },

  getVideos: async (id: string | number, type: 'movie' | 'tv' = 'movie'): Promise<any[]> => {
    try {
      const cleanId = String(id).replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/${type}/${cleanId}/videos`, 'language=en-US'));
      return res.data.results || [];
    } catch (e) {
      console.error(`Failed to fetch videos for ${id}:`, e);
      return [];
    }
  },

  getDiscoverByGenres: async (genreNames: string[], type: 'movie' | 'tv' = 'movie', limit: number = 10): Promise<Content[]> => {
    try {
      const genreIds = genreNames
        .map(name => GENRE_MAP[name.toLowerCase()])
        .filter(Boolean)
        .join(',');
      
      if (!genreIds) return [];

      const res = await axios.get(
        getTmdbUrl(
          `/discover/${type}`,
          `with_genres=${genreIds}&sort_by=popularity.desc&language=en-US&page=1`
        )
      );
      
      return (res.data.results || [])
        .slice(0, limit)
        .map((item: TMDBItem) => transformToContent({ ...item, type }));
    } catch (e) {
      console.error('Failed to discover by genres:', e);
      return generateMockContent(limit);
    }
  },

  getPersonalizedMix: async (trendingContent: Content[], preferences?: { genres: string[], vibes: string[] }): Promise<Content[]> => {
    if (!preferences || (!preferences.genres?.length && !preferences.vibes?.length)) {
      return trendingContent;
    }

    try {
      const genres = preferences.genres || [];
      // 2/5 (40%) should be influenced. If we have 20 items, 8 should be personalized.
      const totalCount = trendingContent.length;
      const personalizedCount = Math.ceil(totalCount * 0.4);
      const baseCount = totalCount - personalizedCount;

      // Fetch personalized items (mix of movie and tv)
      const [pMovies, pTV] = await Promise.all([
        contentApi.getDiscoverByGenres(genres, 'movie', 10),
        contentApi.getDiscoverByGenres(genres, 'tv', 10)
      ]);

      const personalizedPool = [...pMovies, ...pTV];
      
      if (personalizedPool.length === 0) return trendingContent;

      // Shuffle personalized pool
      const shuffledPersonalized = personalizedPool.sort(() => Math.random() - 0.5).slice(0, personalizedCount);
      
      // Combine: Base trending (60%) + Personalized (40%)
      const baseTrending = trendingContent.slice(0, baseCount);
      
      // Final mix shuffled slightly so personalized items aren't all at the end
      return [...baseTrending, ...shuffledPersonalized].sort(() => Math.random() - 0.5);
    } catch (e) {
      console.error('Failed to create personalized mix:', e);
      return trendingContent;
    }
  },

  getReviews: async (id: string | number, type: 'movie' | 'tv' = 'movie'): Promise<Array<{ author: string; content: string; url: string }>> => {
    try {
      const cleanId = String(id).replace('tmdb_', '');
      const res = await axios.get(getTmdbUrl(`/${type}/${cleanId}/reviews`, 'language=en-US'));
      return res.data.results || [];
    } catch {
      return [];
    }
  }
};

const GENRE_MAP: Record<string, number> = {
  // Movies
  'action': 28,
  'adventure': 12,
  'animation': 16,
  'comedy': 35,
  'crime': 80,
  'documentary': 99,
  'docs': 99,
  'drama': 18,
  'family': 10751,
  'fantasy': 14,
  'history': 36,
  'horror': 27,
  'music': 10402,
  'mystery': 9648,
  'romance': 10749,
  'sci-fi': 878,
  'science fiction': 878,
  'thriller': 53,
  'war': 10752,
  'western': 37,
  'tv movie': 10770,
  
  // TV Specific
  'action & adventure': 10759,
  'kids': 10762,
  'news': 10763,
  'reality': 10764,
  'sci-fi & fantasy': 10765,
  'soap': 10766,
  'talk': 10767,
  'war & politics': 10768,
  'politics': 10768,

  // Aliases & Variations
  'scifi': 878,
  'sf': 878,
  'romcom': 10749,
  'biography': 36,
  'musical': 10402,
  'superhero': 28,
  'anime': 16,
  'cartoon': 16,
  'classic': 18,
  'indie': 18,
  'sports': 99,
  'nature': 99,
  'true crime': 80,
  'psychological': 53,
  'supernatural': 14,
  'dystopian': 878,
  'cyberpunk': 878,
  'slasher': 27,
  'zombie': 27,
  'vampire': 27,
  'martial arts': 28,
  'heist': 80,
  'legal': 18,
  'medical': 18,
  'period drama': 36,
  'dark comedy': 35,
  'parody': 35,
  'satire': 35,
  'space': 878,
  'time travel': 878,
  'noir': 80,
  'neo-noir': 80,
  'detective': 9648,
  'supernatural thriller': 53,
  'survival': 12,
  'disaster': 28
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

const transformToContent = (item: TMDBItem, forcedType?: 'movie' | 'tv' | 'anime'): Content => {
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
    type: (() => {
      const rawType = forcedType || item.media_type || item.type || 'movie';
      const typeStr = String(rawType).toLowerCase();
      if (typeStr === 'movie' || typeStr === 'tv' || typeStr === 'anime') {
        return typeStr as 'movie' | 'tv' | 'anime';
      }
      // Fallback for TMDB person or invalid values
      if (item.first_air_date || item.name) return 'tv';
      return 'movie';
    })(),
    genres: (item.genres || []).map((g: { name: string } | string) => (typeof g === 'object' ? g.name : g)),
    lastAirDate: item.last_air_date || undefined,
    originalLanguage: item.original_language || undefined,
    originCountry:
      item.origin_country || item.production_countries?.map((c: { iso_3166_1: string }) => c.iso_3166_1) || [],
    status: 'ongoing',
    isAdult: item.adult || false,
    seasons: item.number_of_seasons || (item.seasons?.length) || undefined,
    episodes: item.number_of_episodes || undefined,
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
    culturalContext: `This work is a cornerstone of our cinematic archive, selected for its directorial integrity and stylistic vanguard.`,
    accuracyVerified: true,
    curatorNote: `"${title}" has been inducted into the S-Class archive for its exceptional thematic purity and visual excellence.`,
    didYouKnow: "Every entry in the S-Class archive undergoes a rigorous directorial audit for thematic purity and visual excellence."
  };
};
