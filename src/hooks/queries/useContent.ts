
import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/api/content";
import { Content } from "@/lib/types/content";

export function useTrending() {
    return useQuery({
        queryKey: ['content', 'trending'],
        queryFn: () => contentApi.getTrending(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePopularTV() {
    return useQuery({
        queryKey: ['content', 'popular-tv'],
        queryFn: () => contentApi.getPopularTV(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpcoming() {
    return useQuery({
        queryKey: ['content', 'upcoming'],
        queryFn: ({ pageParam = 1 }: any) => contentApi.getUpcoming(pageParam),
        staleTime: 30 * 60 * 1000, // 30 mins (doesn't change often)
    });
}

export function useContentDetails(id: string | number, type: 'movie' | 'tv' | 'anime' = 'movie') {
    return useQuery({
        queryKey: ['content', 'details', id, type],
        queryFn: () => {
             // Map anime to tv for API call if necessary, or cast if API handles it internally (API signature says movie|tv)
             const apiType = type === 'anime' ? 'tv' : type;
             return contentApi.getDetails(id, apiType);
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useSeasonDetails(id: string | number, seasonNumber: number) {
    return useQuery({
        queryKey: ['season', id, seasonNumber],
        queryFn: () => contentApi.getSeasonDetails(id, seasonNumber),
        enabled: !!id && !!seasonNumber,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

export function useSearch(query: string) {
    return useQuery({
        queryKey: ['content', 'search', query],
        queryFn: () => contentApi.searchContent(query),
        enabled: !!query && query.length > 2,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

export function useDiscover(params: Record<string, any>, type: 'movie' | 'tv' = 'movie') {
    return useQuery({
        queryKey: ['content', 'discover', type, params],
        queryFn: () => contentApi.discover(params, type),
        staleTime: 5 * 60 * 1000,
    });
}

// Special Categories
export function useAnime() {
    return useQuery({
        queryKey: ['content', 'anime'],
        queryFn: () => contentApi.getAnime(),
        staleTime: 15 * 60 * 1000,
    });
}

export function useViralAdultSwim() {
    return useQuery({
        queryKey: ['content', 'adult-swim-viral'],
        queryFn: () => contentApi.getViralAdultSwim(),
        staleTime: 60 * 60 * 1000, // Viral hits don't change often
    });
}

export function useAdultSwimOriginals(type: 'animated' | 'live-action') {
    return useQuery({
        queryKey: ['content', 'adult-swim-originals', type],
        queryFn: () => contentApi.getAdultSwimOriginals(type),
        staleTime: 60 * 60 * 1000,
    });
}

export function useShorts() {
    return useQuery({
        queryKey: ['content', 'shorts'],
        queryFn: () => contentApi.getShorts(),
        staleTime: 6 * 60 * 60 * 1000,
    });
}

export function useAdultSwimDarkComedy() {
    return useQuery({
        queryKey: ['content', 'adult-swim-dark-comedy'],
        queryFn: () => contentApi.getAdultSwimDarkComedy(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimHorror() {
    return useQuery({
        queryKey: ['content', 'adult-swim-horror'],
        queryFn: () => contentApi.getAdultSwimHorror(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimSciFi() {
    return useQuery({
        queryKey: ['content', 'adult-swim-scifi'],
        queryFn: () => contentApi.getAdultSwimSciFi(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimSatire() {
    return useQuery({
        queryKey: ['content', 'adult-swim-satire'],
        queryFn: () => contentApi.getAdultSwimSatire(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimCultClassics() {
    return useQuery({
        queryKey: ['content', 'adult-swim-cult'],
        queryFn: () => contentApi.getAdultSwimCultClassics(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimExperimental() {
    return useQuery({
        queryKey: ['content', 'adult-swim-experimental'],
        queryFn: () => contentApi.getAdultSwimExperimental(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimAnime() {
    return useQuery({
        queryKey: ['content', 'adult-swim-anime'],
        queryFn: () => contentApi.getAdultSwimAnime(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimAction() {
    return useQuery({
        queryKey: ['content', 'adult-swim-action'],
        queryFn: () => contentApi.getAdultSwimAction(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimMusic() {
    return useQuery({
        queryKey: ['content', 'adult-swim-music'],
        queryFn: () => contentApi.getAdultSwimMusic(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimMidnight() {
    return useQuery({
        queryKey: ['content', 'adult-swim-midnight'],
        queryFn: () => contentApi.getAdultSwimMidnight(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimSurreal() {
    return useQuery({
        queryKey: ['content', 'adult-swim-surreal'],
        queryFn: () => contentApi.getAdultSwimSurreal(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimBritish() {
    return useQuery({
        queryKey: ['content', 'adult-swim-british'],
        queryFn: () => contentApi.getAdultSwimBritish(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAdultSwimRetro() {
    return useQuery({
        queryKey: ['content', 'adult-swim-retro'],
        queryFn: () => contentApi.getAdultSwimRetro(),
        staleTime: 60 * 60 * 1000,
    });
}

// Aunties Channel Hooks
export function useKoreanDramas() {
    return useQuery({
        queryKey: ['content', 'korean-dramas'],
        queryFn: () => contentApi.getKoreanDramas(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useAfricanMovies() {
    return useQuery({
        queryKey: ['content', 'african-movies'],
        queryFn: () => contentApi.getAfricanMovies(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useClassicSitcoms() {
    return useQuery({
        queryKey: ['content', 'classic-sitcoms'],
        queryFn: () => contentApi.getClassicSitcoms(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useSoapOperas() {
    return useQuery({
        queryKey: ['content', 'soap-operas'],
        queryFn: () => contentApi.getSoapOperas(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useFamilyDramas() {
    return useQuery({
        queryKey: ['content', 'family-dramas'],
        queryFn: () => contentApi.getFamilyDramas(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useTelenovelas() {
    return useQuery({
        queryKey: ['content', 'telenovelas'],
        queryFn: () => contentApi.getTelenovelas(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useBollywoodMovies() {
    return useQuery({
        queryKey: ['content', 'bollywood'],
        queryFn: () => contentApi.getBollywoodMovies(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useFamilyComedies() {
    return useQuery({
        queryKey: ['content', 'family-comedies'],
        queryFn: () => contentApi.getFamilyComedies(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useCookingShows() {
    return useQuery({
        queryKey: ['content', 'cooking-shows'],
        queryFn: () => contentApi.getCookingShows(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useRomanticMovies() {
    return useQuery({
        queryKey: ['content', 'romantic-movies'],
        queryFn: () => contentApi.getRomanticMovies(),
        staleTime: 60 * 60 * 1000,
    });
}

export function useDayOneDrops(type: 'movie' | 'tv' = 'movie') {
    return useQuery({
        queryKey: ['content', 'day-one', type],
        queryFn: () => contentApi.getDayOneDrops(type),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

export function useSimilar(id: string, type: 'movie' | 'tv' | 'anime' = 'movie') {
    return useQuery({
        queryKey: ['content', 'similar', id, type],
        queryFn: () => contentApi.getSimilar(id, type),
        enabled: !!id,
        staleTime: 60 * 60 * 1000, 
    });
}

export function useProviderContent(providerId: string, type: 'movie' | 'tv' = 'movie', sort_by: string = 'popularity.desc') {
    return useQuery({
        queryKey: ['content', 'provider', providerId, type, sort_by],
        queryFn: () => contentApi.discover({ 
            with_watch_providers: providerId, 
            watch_region: 'US',
            sort_by 
        }, type),
        staleTime: 10 * 60 * 1000,
    });
}

export function useProviderGenre(providerId: string, genreId: number, type: 'movie' | 'tv' = 'movie', sort_by: string = 'popularity.desc') {
    return useQuery({
        queryKey: ['content', 'provider-genre', providerId, genreId, type, sort_by],
        queryFn: () => contentApi.discover({ 
            with_watch_providers: providerId, 
            with_genres: genreId,
            watch_region: 'US',
            sort_by 
        }, type),
        staleTime: 10 * 60 * 1000,
    });
}

export function useProviderClassics(providerId: string, type: 'movie' | 'tv' = 'movie') {
    return useQuery({
        queryKey: ['content', 'provider-classics', providerId, type],
        queryFn: () => {
             const dateFilter = type === 'movie' ? { 'primary_release_date.lte': '2010-01-01' } : { 'first_air_date.lte': '2010-01-01' };
             return contentApi.discover({
                with_watch_providers: providerId,
                watch_region: 'US',
                sort_by: 'vote_average.desc',
                'vote_count.gte': 1000,
                'vote_average.gte': 7.5,
                ...dateFilter
            }, type);
        },
        staleTime: 60 * 60 * 1000,
    });
}

export function useProviderUnderrated(providerId: string, type: 'movie' | 'tv' = 'movie') {
    return useQuery({
        queryKey: ['content', 'provider-underrated', providerId, type],
        queryFn: () => contentApi.discover({
            with_watch_providers: providerId,
            watch_region: 'US',
            sort_by: 'vote_average.desc',
            'vote_count.gte': 200,
            'vote_count.lte': 5000,
            'vote_average.gte': 8.0,
        }, type),
        staleTime: 60 * 60 * 1000,
    });
}
