
import { useQuery } from "@tanstack/react-query";
import sourceProvider from "@/services/sourceProvider";
import { Content } from "@/lib/types/content";

export function useSources(content: Content | null, season: number = 1, episode: number = 1) {
    return useQuery({
        queryKey: ['sources', content?.id, content?.type, season, episode],
        queryFn: async () => {
            if (!content) return new Map();
            return sourceProvider.getAllSources(content as any, season, episode);
        },
        enabled: !!content,
        staleTime: 5 * 60 * 1000, 
        retry: 1,
    });
}
