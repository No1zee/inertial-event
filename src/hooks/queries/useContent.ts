
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
